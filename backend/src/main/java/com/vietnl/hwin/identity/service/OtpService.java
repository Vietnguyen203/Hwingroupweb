package com.vietnl.hwin.identity.service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;

import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.common.exception.NotFoundException;
import com.vietnl.hwin.common.exception.TooManyRequestsException;
import com.vietnl.hwin.common.ratelimit.RateLimiter;
import com.vietnl.hwin.common.util.Hashing;
import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.repository.UserAccountRepository;
import com.vietnl.hwin.identity.service.integration.DevOtpInbox;
import com.vietnl.hwin.identity.service.integration.OtpSender;

/**
 * Gửi và kiểm tra OTP 6 số, tới SĐT (SMS) hoặc email.
 * - Lưu HMAC(pepper, mã) trong Redis, TTL 5 phút. Không lưu mã gốc.
 * - Sai 5 lần -> khóa nơi nhận (SĐT / email) 15 phút.
 * - Gửi tối đa 3 lần / 10 phút theo nơi nhận và theo IP.
 * Công bố cho module khác (affiliate dùng khi đổi tài khoản ngân hàng).
 */
@Service
@NamedInterface("services")
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final String FIELD_HASH = "hash";
    private static final String FIELD_ATTEMPTS = "attempts";

    private final StringRedisTemplate redis;
    private final RateLimiter rateLimiter;
    private final Map<OtpChannel, OtpSender> senders = new EnumMap<>(OtpChannel.class);
    private final DevOtpInbox devInbox;
    private final UserAccountRepository users;
    private final OtpProperties props;

    public OtpService(StringRedisTemplate redis, RateLimiter rateLimiter, List<OtpSender> senders,
                      DevOtpInbox devInbox, UserAccountRepository users, OtpProperties props) {
        this.redis = redis;
        this.rateLimiter = rateLimiter;
        senders.forEach(s -> this.senders.put(s.channel(), s));
        this.devInbox = devInbox;
        this.users = users;
        this.props = props;
    }

    /** @return thời gian hiệu lực (giây) */
    public long send(OtpTarget target, OtpPurpose purpose, String ipHash) {
        OtpSender sender = senders.get(target.channel());
        if (sender == null || !sender.available()) {
            throw new DomainException("OTP_CHANNEL_UNAVAILABLE", target.channel() == OtpChannel.SMS
                    ? "Hiện chưa gửi được OTP qua SMS, vui lòng dùng email"
                    : "Hiện chưa gửi được OTP qua email");
        }
        ensureNotLocked(target);
        if (!rateLimiter.tryAcquire("rl:otp:to:" + target.key(), props.sendLimit(), props.sendWindow())
                || !rateLimiter.tryAcquire("rl:otp:ip:" + ipHash, props.ipSendLimit(), props.sendWindow())) {
            throw new TooManyRequestsException("OTP_SEND_LIMIT",
                    "Bạn đã yêu cầu OTP quá nhiều lần, vui lòng thử lại sau ít phút");
        }
        String code = Hashing.randomDigits(6);
        String key = otpKey(target, purpose);
        redis.delete(key);
        redis.opsForHash().putAll(key, Map.of(FIELD_HASH, hash(target, purpose, code), FIELD_ATTEMPTS, "0"));
        redis.expire(key, props.ttl());
        if (props.logCode()) {
            // Chỉ profile dev/test: in mã ra log + lưu hộp thư dev cho Postman / test
            log.info("[DEV OTP] {} {} -> {}", purpose, target.masked(), code);
            devInbox.put(target, purpose, code);
        }
        sender.send(target.value(), code, purpose);
        return props.ttl().toSeconds();
    }

    /** OTP xác nhận đổi tài khoản ngân hàng – gửi tới email (nếu có) hoặc SĐT của tài khoản. */
    public long sendBankChangeOtp(UUID userId, String ipHash) {
        return send(targetOf(userId), OtpPurpose.BANK_CHANGE, ipHash);
    }

    public void verifyBankChangeOtp(UUID userId, String code) {
        verify(targetOf(userId), OtpPurpose.BANK_CHANGE, code);
    }

    /** Kiểm tra OTP; đúng thì xóa (dùng 1 lần), sai thì tăng bộ đếm và có thể khóa. */
    public void verify(OtpTarget target, OtpPurpose purpose, String code) {
        ensureNotLocked(target);
        String key = otpKey(target, purpose);
        Object stored = redis.opsForHash().get(key, FIELD_HASH);
        if (stored == null) {
            throw new DomainException("OTP_EXPIRED", "Mã OTP đã hết hạn, vui lòng gửi lại");
        }
        if (code != null && Hashing.constantTimeEquals(stored.toString(), hash(target, purpose, code))) {
            redis.delete(key);
            return;
        }
        long attempts = redis.opsForHash().increment(key, FIELD_ATTEMPTS, 1);
        if (attempts >= props.maxAttempts()) {
            redis.delete(key);
            redis.opsForValue().set(lockKey(target), "1", props.lockDuration());
            throw new TooManyRequestsException("OTP_LOCKED",
                    "Nhập sai OTP quá " + props.maxAttempts() + " lần. Vui lòng thử lại sau "
                            + props.lockDuration().toMinutes() + " phút");
        }
        throw new DomainException("OTP_INVALID",
                "Mã OTP không đúng. Còn " + (props.maxAttempts() - attempts) + " lần thử");
    }

    private OtpTarget targetOf(UUID userId) {
        return users.findById(userId).orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản")).otpTarget();
    }

    private void ensureNotLocked(OtpTarget target) {
        if (Boolean.TRUE.equals(redis.hasKey(lockKey(target)))) {
            throw new TooManyRequestsException("OTP_LOCKED", "Tạm khóa nhận OTP do nhập sai nhiều lần, vui lòng thử lại sau");
        }
    }

    private String hash(OtpTarget target, OtpPurpose purpose, String code) {
        return Hashing.hmacSha256Hex(props.pepper(), purpose + ":" + target.key() + ":" + code);
    }

    private static String otpKey(OtpTarget target, OtpPurpose purpose) {
        return "otp:" + purpose + ":" + target.key();
    }

    private static String lockKey(OtpTarget target) {
        return "otp:lock:" + target.key();
    }
}

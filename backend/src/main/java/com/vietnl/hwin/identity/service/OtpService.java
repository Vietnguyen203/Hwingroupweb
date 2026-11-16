package com.vietnl.hwin.identity.service;

import java.util.Map;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.modulith.NamedInterface;
import org.springframework.stereotype.Service;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.DomainException;
import com.vietnl.hwin.common.exception.TooManyRequestsException;
import com.vietnl.hwin.common.ratelimit.RateLimiter;
import com.vietnl.hwin.common.util.Hashing;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.service.integration.OtpSender;

/**
 * Gửi và kiểm tra OTP 6 số.
 * - Lưu HMAC(pepper, mã) trong Redis, TTL 5 phút. Không lưu mã gốc.
 * - Sai 5 lần -> khóa SĐT 15 phút.
 * - Gửi tối đa 3 lần / 10 phút theo SĐT và theo IP.
 * Công bố cho module khác (affiliate dùng khi đổi tài khoản ngân hàng).
 */
@Service
@NamedInterface("services")
public class OtpService {

    private static final String FIELD_HASH = "hash";
    private static final String FIELD_ATTEMPTS = "attempts";

    private final StringRedisTemplate redis;
    private final RateLimiter rateLimiter;
    private final OtpSender sender;
    private final OtpProperties props;

    public OtpService(StringRedisTemplate redis, RateLimiter rateLimiter, OtpSender sender, OtpProperties props) {
        this.redis = redis;
        this.rateLimiter = rateLimiter;
        this.sender = sender;
        this.props = props;
    }

    /** @return thời gian hiệu lực (giây) */
    public long send(PhoneNumber phone, OtpPurpose purpose, String ipHash) {
        ensureNotLocked(phone);
        if (!rateLimiter.tryAcquire("rl:otp:phone:" + phone.value(), props.sendLimit(), props.sendWindow())
                || !rateLimiter.tryAcquire("rl:otp:ip:" + ipHash, props.ipSendLimit(), props.sendWindow())) {
            throw new TooManyRequestsException("OTP_SEND_LIMIT",
                    "Bạn đã yêu cầu OTP quá nhiều lần, vui lòng thử lại sau ít phút");
        }
        String code = Hashing.randomDigits(6);
        String key = otpKey(phone, purpose);
        redis.delete(key);
        redis.opsForHash().putAll(key, Map.of(FIELD_HASH, hash(phone, purpose, code), FIELD_ATTEMPTS, "0"));
        redis.expire(key, props.ttl());
        sender.send(phone, code, purpose);
        return props.ttl().toSeconds();
    }

    /** OTP xác nhận đổi tài khoản ngân hàng (affiliate dùng – không lộ enum OtpPurpose ra ngoài module). */
    public long sendBankChangeOtp(PhoneNumber phone, String ipHash) {
        return send(phone, OtpPurpose.BANK_CHANGE, ipHash);
    }

    public void verifyBankChangeOtp(PhoneNumber phone, String code) {
        verify(phone, OtpPurpose.BANK_CHANGE, code);
    }

    /** Kiểm tra OTP; đúng thì xóa (dùng 1 lần), sai thì tăng bộ đếm và có thể khóa. */
    public void verify(PhoneNumber phone, OtpPurpose purpose, String code) {
        ensureNotLocked(phone);
        String key = otpKey(phone, purpose);
        Object stored = redis.opsForHash().get(key, FIELD_HASH);
        if (stored == null) {
            throw new DomainException("OTP_EXPIRED", "Mã OTP đã hết hạn, vui lòng gửi lại");
        }
        if (code != null && Hashing.constantTimeEquals(stored.toString(), hash(phone, purpose, code))) {
            redis.delete(key);
            return;
        }
        long attempts = redis.opsForHash().increment(key, FIELD_ATTEMPTS, 1);
        if (attempts >= props.maxAttempts()) {
            redis.delete(key);
            redis.opsForValue().set(lockKey(phone), "1", props.lockDuration());
            throw new TooManyRequestsException("OTP_LOCKED",
                    "Nhập sai OTP quá " + props.maxAttempts() + " lần. Vui lòng thử lại sau "
                            + props.lockDuration().toMinutes() + " phút");
        }
        throw new DomainException("OTP_INVALID",
                "Mã OTP không đúng. Còn " + (props.maxAttempts() - attempts) + " lần thử");
    }

    private void ensureNotLocked(PhoneNumber phone) {
        if (Boolean.TRUE.equals(redis.hasKey(lockKey(phone)))) {
            throw new TooManyRequestsException("OTP_LOCKED", "Số điện thoại đang bị tạm khóa do nhập sai OTP nhiều lần");
        }
    }

    private String hash(PhoneNumber phone, OtpPurpose purpose, String code) {
        return Hashing.hmacSha256Hex(props.pepper(), purpose + ":" + phone.value() + ":" + code);
    }

    private static String otpKey(PhoneNumber phone, OtpPurpose purpose) {
        return "otp:" + purpose + ":" + phone.value();
    }

    private static String lockKey(PhoneNumber phone) {
        return "otp:lock:" + phone.value();
    }
}

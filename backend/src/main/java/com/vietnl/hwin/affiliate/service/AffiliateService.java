package com.vietnl.hwin.affiliate.service;

import java.io.InputStream;
import java.util.Map;
import com.vietnl.hwin.common.storage.PrivateFileStore;
import com.vietnl.hwin.affiliate.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.affiliate.entity.AffiliateStatus;
import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.BankAccount;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.service.OtpService;
import com.vietnl.hwin.identity.service.UserQueryService;

/**
 * Use case phía CTV: đăng ký, xem hồ sơ, cập nhật tài khoản ngân hàng (bắt buộc OTP).
 * Mọi thao tác dùng userId lấy từ JWT.
 */
@Service
public class AffiliateService {

    private final AffiliateRepository affiliates;
    private final UserQueryService users;
    private final OtpService otp;
    private final BankAccountCrypto crypto;
    private final AuditLogger audit;
    private final PrivateFileStore files;
    private final Clock clock;

    public AffiliateService(AffiliateRepository affiliates, UserQueryService users, OtpService otp,
                            BankAccountCrypto crypto, AuditLogger audit, PrivateFileStore files, Clock clock) {
        this.affiliates = affiliates;
        this.users = users;
        this.otp = otp;
        this.crypto = crypto;
        this.audit = audit;
        this.files = files;
        this.clock = clock;
    }

    /** Nhận 1 ảnh CCCD vào kho riêng tư, trả về khóa để đính kèm khi đăng ký CTV. */
    public String uploadIdCard(UUID userId, InputStream content, long size, String contentType) {
        return files.store(idCardFolder(userId), content, size, contentType);
    }

    private static String idCardFolder(UUID userId) {
        return "id-cards/" + userId;
    }

    /** Khóa phải do chính người dùng này tải lên (chặn dùng ảnh của người khác hoặc đường dẫn bất kỳ). */
    private String checkedIdCardKey(UUID userId, String key) {
        if (key == null || key.isBlank()) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ID_CARD_REQUIRED);
        }
        if (!key.startsWith(idCardFolder(userId) + "/") || key.contains("..") || !files.exists(key)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ID_CARD_INVALID);
        }
        return key;
    }

    /**
     * Đăng ký CTV (hoặc đăng ký lại nếu đã bị từ chối).
     * SĐT ưu tiên lấy từ tài khoản; tài khoản đăng ký bằng email thì CTV phải nhập SĐT liên hệ ({@code rawPhone}).
     */
    @Transactional
    public <T> T register(UUID userId, String fullName, String socialLink, String note, String rawPhone,
                          String idCardFrontKey, String idCardBackKey, Function<Affiliate, T> mapper) {
        String front = checkedIdCardKey(userId, idCardFrontKey);
        String back = checkedIdCardKey(userId, idCardBackKey);
        Affiliate a = affiliates.findByUserId(userId).orElse(null);
        if (a == null) {
            PhoneNumber phone = users.findPhone(userId).orElseGet(() -> {
                if (rawPhone == null || rawPhone.isBlank()) {
                    throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PHONE_REQUIRED);
                }
                return PhoneNumber.of(rawPhone);
            });
            a = affiliates.save(Affiliate.register(userId, phone, fullName, socialLink, note, front, back));
        } else if (a.getStatus() == AffiliateStatus.REJECTED) {
            a.reapply(fullName, socialLink, note, front, back);
        } else {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ALREADY_REGISTERED, Map.of("status", String.valueOf(a.getStatus())));
        }
        return mapper.apply(a);
    }

    @Transactional(readOnly = true)
    public <T> T me(UUID userId, Function<Affiliate, T> mapper) {
        return mapper.apply(load(userId));
    }

    /** Gửi OTP (tới email hoặc SĐT của tài khoản) trước khi đổi tài khoản ngân hàng. */
    @Transactional(readOnly = true)
    public long sendBankChangeOtp(UUID userId, String ipHash) {
        load(userId); // phải là CTV
        return otp.sendBankChangeOtp(userId, ipHash);
    }

    /** Đổi tài khoản ngân hàng: kiểm tra OTP -> mã hóa -> lưu -> audit. Đổi (không phải lần đầu) khóa rút 48h. */
    @Transactional
    public <T> T changeBankAccount(UUID userId, String bankName, String accountNo, String holder, String otpCode,
                                   Function<Affiliate, T> mapper) {
        Affiliate a = load(userId);
        otp.verifyBankChangeOtp(userId, otpCode);
        boolean firstTime = a.getBankAccount() == null;
        BankAccount account = crypto.encrypt(bankName, accountNo, holder);
        Instant now = clock.instant();
        a.changeBankAccount(account, now);
        audit.log("affiliate", "Affiliate", a.getId(), firstTime ? "BANK_SET" : "BANK_CHANGED", userId, null,
                "{\"bankName\":\"" + account.bankName().replace("\"", "") + "\",\"last4\":\"" + account.accountNoLast4() + "\"}");
        return mapper.apply(a);
    }

    Affiliate load(UUID userId) {
        return affiliates.findByUserId(userId)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.AFFILIATE_NOT_REGISTERED));
    }
}

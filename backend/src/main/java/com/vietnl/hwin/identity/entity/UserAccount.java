package com.vietnl.hwin.identity.entity;

import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.vietnl.hwin.common.domain.AggregateRoot;
import com.vietnl.hwin.common.domain.EmailAddress;
import com.vietnl.hwin.common.domain.PhoneNumber;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: tài khoản người dùng.
 * - Khách/CTV: định danh bằng SĐT hoặc email, đăng nhập OTP (gửi tới đúng nơi đã nhập).
 * - Admin: định danh bằng email + mật khẩu (BCrypt).
 */
@Entity
@Table(name = "user_accounts", schema = "identity")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserAccount extends AggregateRoot<UserAccount> {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    private PhoneNumber phone;

    private String email;

    private String passwordHash;

    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", schema = "identity", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Set<Role> roles = new HashSet<>();

    private Instant lastLoginAt;

    /** Ngày sinh (khách hàng) – luôn ở quá khứ. */
    private java.time.LocalDate dateOfBirth;

    private String address;

    /** CCCD: chỉ lưu bản mã hóa AES-GCM + HMAC (kiểm tra trùng) + 4 số cuối (hiển thị). */
    private String citizenIdEncrypted;

    private String citizenIdHash;

    private String citizenIdLast4;

    /** Đăng nhập admin không cần OTP – CHỈ tài khoản dev admin/admin (gắn theo tài khoản, không theo role). */
    private boolean otpExempt;

    /** Tạo tài khoản khách khi đăng nhập OTP bằng SĐT lần đầu. */
    public static UserAccount registerCustomer(PhoneNumber phone) {
        UserAccount u = newCustomer();
        u.phone = phone;
        return u;
    }

    /** Tạo tài khoản khách khi đăng nhập OTP bằng email lần đầu (chưa có SĐT). */
    public static UserAccount registerCustomer(EmailAddress email) {
        UserAccount u = newCustomer();
        u.email = email.value();
        return u;
    }

    /**
     * Đăng ký khách đầy đủ thông tin: SĐT hoặc email (đã xác minh OTP), họ tên, ngày sinh (quá khứ), địa chỉ,
     * CCCD (đã mã hóa ở service), mật khẩu (đã băm).
     */
    public static UserAccount registerCustomer(PhoneNumber phone, EmailAddress email, String fullName,
                                               java.time.LocalDate dateOfBirth, String address, String citizenIdEncrypted,
                                               String citizenIdHash, String citizenIdLast4, String passwordHash,
                                               java.time.LocalDate today) {
        if (dateOfBirth == null || !dateOfBirth.isBefore(today)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.DATE_OF_BIRTH_INVALID);
        }
        UserAccount u = newCustomer();
        u.phone = phone;
        u.email = email == null ? null : email.value();
        u.rename(fullName);
        u.dateOfBirth = dateOfBirth;
        u.address = address == null ? null : address.trim();
        u.citizenIdEncrypted = citizenIdEncrypted;
        u.citizenIdHash = citizenIdHash;
        u.citizenIdLast4 = citizenIdLast4;
        u.passwordHash = passwordHash;
        return u;
    }

    /** Thêm SĐT (đã xác minh OTP) cho tài khoản đăng ký bằng email – SĐT dùng được làm tên đăng nhập. */
    public void addPhone(PhoneNumber newPhone) {
        if (this.phone != null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.PHONE_ALREADY_SET);
        }
        this.phone = newPhone;
    }

    /** CCCD đã che: ********1234. */
    public String citizenIdMasked() {
        return citizenIdLast4 == null ? null : "********" + citizenIdLast4;
    }

    public boolean hasPassword() {
        return passwordHash != null;
    }

    private static UserAccount newCustomer() {
        UserAccount u = new UserAccount();
        u.status = UserStatus.ACTIVE;
        u.roles.add(Role.CUSTOMER);
        return u;
    }

    /**
     * Nơi nhận OTP bảo mật (đăng nhập admin, đổi tài khoản ngân hàng):
     * email nếu tài khoản có email hợp lệ, không thì SĐT.
     */
    public OtpTarget otpTarget() {
        if (EmailAddress.isValid(email)) {
            return OtpTarget.email(EmailAddress.of(email));
        }
        if (phone != null) {
            return OtpTarget.phone(phone);
        }
        throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.NO_OTP_CONTACT);
    }

    /**
     * Tạo tài khoản quản trị – luôn đăng nhập 2 bước (mật khẩu + OTP), nên bắt buộc có nơi nhận OTP:
     * {@code email} là email thật, hoặc có SĐT. {@code email} là email hoặc tên đăng nhập.
     */
    public static UserAccount createAdmin(String email, String passwordHash, String fullName, PhoneNumber phone) {
        if (phone == null && !EmailAddress.isValid(email)) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ADMIN_CONTACT_REQUIRED);
        }
        UserAccount u = newAdmin(email, passwordHash, fullName);
        u.phone = phone;
        return u;
    }

    /** Tài khoản dev admin/admin: miễn OTP. Chỉ AdminSeeder gọi ở profile dev. */
    public static UserAccount createDevAdmin(String email, String passwordHash, String fullName) {
        UserAccount u = newAdmin(email, passwordHash, fullName);
        u.otpExempt = true;
        return u;
    }

    /** Bật miễn OTP cho tài khoản dev đã có (chỉ AdminSeeder gọi ở profile dev). */
    public void markDevOtpExempt() {
        this.otpExempt = true;
    }

    private static UserAccount newAdmin(String email, String passwordHash, String fullName) {
        if (email == null || email.isBlank() || passwordHash == null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ADMIN_INVALID);
        }
        UserAccount u = new UserAccount();
        u.email = email.trim().toLowerCase();
        u.passwordHash = passwordHash;
        u.fullName = fullName;
        u.status = UserStatus.ACTIVE;
        u.roles.add(Role.ADMIN);
        return u;
    }

    /** Ghi nhận đăng nhập thành công. Tài khoản bị khóa không được đăng nhập. */
    public void recordLogin(Instant now) {
        ensureActive();
        this.lastLoginAt = now;
    }

    public void ensureActive() {
        if (status != UserStatus.ACTIVE) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.USER_LOCKED);
        }
    }

    public void grantRole(Role role) {
        roles.add(role);
    }

    public void revokeRole(Role role) {
        if (role == Role.CUSTOMER) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ROLE_REQUIRED);
        }
        roles.remove(role);
    }

    public void rename(String fullName) {
        this.fullName = fullName == null ? null : fullName.trim();
    }

    public boolean isAdmin() {
        return roles.contains(Role.ADMIN);
    }

    public Set<Role> getRoles() {
        return Collections.unmodifiableSet(roles);
    }
}

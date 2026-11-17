package com.vietnl.hwin.identity.entity;

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
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.exception.DomainException;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: tài khoản người dùng.
 * - Khách/CTV: định danh bằng SĐT, đăng nhập OTP.
 * - Admin: định danh bằng email + mật khẩu (BCrypt).
 */
@Entity
@Table(name = "user_account", schema = "identity")
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
    @CollectionTable(name = "user_role", schema = "identity", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Set<Role> roles = new HashSet<>();

    private Instant lastLoginAt;

    /** Đăng nhập admin không cần OTP – CHỈ tài khoản dev admin/admin (gắn theo tài khoản, không theo role). */
    private boolean otpExempt;

    /** Tạo tài khoản khách khi đăng nhập OTP lần đầu. */
    public static UserAccount registerCustomer(PhoneNumber phone) {
        UserAccount u = new UserAccount();
        u.phone = phone;
        u.status = UserStatus.ACTIVE;
        u.roles.add(Role.CUSTOMER);
        return u;
    }

    /**
     * Tạo tài khoản quản trị – luôn đăng nhập 2 bước (mật khẩu + OTP), nên bắt buộc có SĐT nhận OTP.
     * {@code email} là email hoặc tên đăng nhập.
     */
    public static UserAccount createAdmin(String email, String passwordHash, String fullName, PhoneNumber phone) {
        if (phone == null) {
            throw new DomainException("ADMIN_PHONE_REQUIRED", "Admin cần số điện thoại để nhận OTP đăng nhập");
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
            throw new DomainException("ADMIN_INVALID", "Admin cần email/tên đăng nhập và mật khẩu");
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
            throw new DomainException("USER_LOCKED", "Tài khoản đã bị khóa");
        }
    }

    public void grantRole(Role role) {
        roles.add(role);
    }

    public void revokeRole(Role role) {
        if (role == Role.CUSTOMER) {
            throw new DomainException("ROLE_REQUIRED", "Không thể gỡ vai trò CUSTOMER");
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

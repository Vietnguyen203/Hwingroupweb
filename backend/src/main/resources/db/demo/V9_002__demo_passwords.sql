-- Mật khẩu đăng nhập cho tài khoản mẫu: Hwin@2026 (BCrypt). Đăng nhập = SĐT + mật khẩu + OTP (dev lấy OTP qua /api/dev/otp/latest)
update identity.user_accounts
   set password_hash = '$2a$10$9l9i.lQQK9OhUXRCsj0czeNCp.eLfcZjLH9Ro41fXk5BMwjaDlhbO',
       date_of_birth = date '1990-01-01',
       address       = 'Hà Nội'
 where password_hash is null and phone is not null;

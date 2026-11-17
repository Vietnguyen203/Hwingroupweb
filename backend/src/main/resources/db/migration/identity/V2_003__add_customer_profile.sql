-- Hồ sơ khách khi đăng ký: ngày sinh, địa chỉ, CCCD (mã hóa). Mật khẩu dùng lại cột password_hash.
alter table identity.user_accounts
    add column date_of_birth        date,
    add column address              varchar(255),
    add column citizen_id_encrypted varchar(255),
    add column citizen_id_hash      varchar(64) unique,
    add column citizen_id_last4     varchar(4);

comment on column identity.user_accounts.date_of_birth is 'Ngày sinh – luôn là ngày trong quá khứ (kiểm tra ở ứng dụng)';
comment on column identity.user_accounts.address is 'Địa chỉ khai báo khi đăng ký';
comment on column identity.user_accounts.citizen_id_encrypted is 'Số CCCD mã hóa AES-GCM (khóa IDENTITY_PII_KEY) – không lưu bản rõ';
comment on column identity.user_accounts.citizen_id_hash is 'HMAC-SHA256 của số CCCD – kiểm tra trùng mà không giải mã';
comment on column identity.user_accounts.citizen_id_last4 is '4 số cuối CCCD để hiển thị (********1234)';
comment on column identity.user_accounts.password_hash is 'BCrypt – admin và khách / CTV (đăng nhập email hoặc SĐT + mật khẩu + OTP)';

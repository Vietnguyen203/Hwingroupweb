-- Đăng nhập admin 2 bước: mật khẩu + OTP.
-- Cờ miễn OTP gắn theo TÀI KHOẢN (không theo role): chỉ tài khoản dev admin/admin được bật,
-- backend từ chối khởi động ở môi trường không phải dev nếu còn tài khoản nào miễn OTP.
alter table identity.user_accounts add column otp_exempt boolean not null default false;

comment on column identity.user_accounts.otp_exempt is
    'true = đăng nhập admin không cần OTP. CHỈ dành cho tài khoản dev admin/admin; môi trường thật không cho phép';

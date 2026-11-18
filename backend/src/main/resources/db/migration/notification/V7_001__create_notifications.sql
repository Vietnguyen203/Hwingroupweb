-- Thông báo trong ứng dụng (chuông thông báo): mỗi dòng là một thông báo gửi tới MỘT người nhận.
-- Chỉ lưu loại (type) + dữ liệu (data); câu chữ tiếng Việt do giao diện dựng theo type.
create schema if not exists notification;

create table notification.notifications
(
    id           uuid         primary key,
    recipient_id uuid         not null,
    type         varchar(40)  not null,
    data         jsonb        not null default '{}'::jsonb,
    link         varchar(200),
    dedupe_key   varchar(120),
    created_at   timestamptz  not null default now(),
    read_at      timestamptz
);

-- Danh sách của một người, mới nhất trước
create index ix_notifications_recipient_created on notification.notifications (recipient_id, created_at desc, id desc);
-- Đếm / lọc chưa đọc
create index ix_notifications_unread on notification.notifications (recipient_id) where read_at is null;
-- Sự kiện được xử lý lại (retry) không tạo thông báo trùng
create unique index ux_notifications_dedupe on notification.notifications (recipient_id, dedupe_key) where dedupe_key is not null;

comment on table notification.notifications is 'Thông báo trong ứng dụng; recipient_id = identity.user_accounts.id (không FK vì khác module)';
comment on column notification.notifications.type is 'Loại thông báo (enum NotificationType), giao diện dựa vào đây để dựng tiêu đề / nội dung / biểu tượng';
comment on column notification.notifications.data is 'Dữ liệu điền vào câu thông báo (mã đơn, số tiền...)';
comment on column notification.notifications.link is 'Đường dẫn giao diện mở ra khi bấm vào thông báo';
comment on column notification.notifications.dedupe_key is 'Khóa chống trùng khi sự kiện bị xử lý lại, duy nhất theo từng người nhận';

create table identity.user_accounts
(
    id            uuid primary key default public.uuid_generate_v7(),
    phone         varchar(16) unique,
    email         varchar(255) unique,
    password_hash varchar(100),
    full_name     varchar(100),
    status        varchar(16)  not null check (status in ('ACTIVE', 'LOCKED')),
    last_login_at timestamptz,
    version       bigint       not null default 0,
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now(),
    constraint ck_user_account_identifier check (phone is not null or email is not null)
);

create table identity.user_roles
(
    user_id uuid        not null references identity.user_accounts (id) on delete cascade,
    role    varchar(16) not null check (role in ('CUSTOMER', 'AFFILIATE', 'ADMIN')),
    primary key (user_id, role)
);

create table identity.refresh_tokens
(
    id             uuid primary key default public.uuid_generate_v7(),
    user_id        uuid         not null references identity.user_accounts (id) on delete cascade,
    token_hash     varchar(64)  not null unique,
    family_id      uuid         not null,
    expires_at     timestamptz  not null,
    revoked_at     timestamptz,
    replaced_by_id uuid  ,
    user_agent     varchar(255),
    ip_hash        varchar(64),
    created_at     timestamptz  not null default now()
);
create index idx_refresh_token_user on identity.refresh_tokens (user_id);
create index idx_refresh_token_family on identity.refresh_tokens (family_id);

-- Chú thích bảng / cột
comment on table identity.user_accounts is 'Tài khoản. Khách/CTV định danh bằng SĐT (đăng nhập OTP); admin bằng email/tên đăng nhập + mật khẩu BCrypt';
comment on column identity.user_accounts.phone is 'SĐT chuẩn hóa E.164 (+84xxxxxxxxx); null với admin';
comment on column identity.user_accounts.email is 'Email hoặc tên đăng nhập của admin';
comment on column identity.user_accounts.password_hash is 'BCrypt – chỉ admin có';
comment on column identity.user_accounts.status is 'ACTIVE | LOCKED';
comment on column identity.user_accounts.version is 'Optimistic locking';
comment on table identity.user_roles is 'Vai trò của tài khoản (nhiều-nhiều): CUSTOMER | AFFILIATE | ADMIN';
comment on table identity.refresh_tokens is 'Refresh token (lưu hash SHA-256). Xoay vòng mỗi lần dùng; dùng lại token đã thu hồi -> thu hồi cả family';
comment on column identity.refresh_tokens.token_hash is 'SHA-256 của token – không lưu token gốc';
comment on column identity.refresh_tokens.family_id is 'Chuỗi token sinh ra từ cùng một lần đăng nhập';
comment on column identity.refresh_tokens.replaced_by_id is 'Token kế tiếp sau khi xoay vòng';
comment on column identity.refresh_tokens.ip_hash is 'SHA-256 của IP – không lưu IP gốc';


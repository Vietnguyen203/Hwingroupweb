-- Module affiliate: cộng tác viên, click link, gắn khách vĩnh viễn, hoa hồng, rút tiền.
-- Tham chiếu sang module khác (user, khách, đơn) chỉ lưu ID – không có FK xuyên schema.

create table affiliate.affiliates
(
    id                      uuid primary key default public.uuid_generate_v7(),
    user_id                 uuid         not null unique, -- ref -> identity.user_accounts
    phone                   varchar(16)  not null,
    full_name               varchar(100) not null,
    referral_code           varchar(16) unique,           -- sinh khi được duyệt
    status                  varchar(16)  not null check (status in ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    social_link             varchar(500),
    note                    varchar(1000),
    bank_name               varchar(100),
    bank_account_no_enc     varchar(255),
    bank_account_holder_enc varchar(255),
    bank_account_no_last4   varchar(4),
    bank_changed_at         timestamptz,
    reviewed_by             uuid,                         -- ref -> identity.user_accounts (admin)
    reviewed_at             timestamptz,
    status_reason           varchar(500),
    version                 bigint       not null default 0,
    created_at              timestamptz  not null default now(),
    updated_at              timestamptz  not null default now()
);
create index idx_affiliate_status on affiliate.affiliates (status, created_at desc);

create table affiliate.referral_clicks
(
    id            uuid primary key default public.uuid_generate_v7(),
    affiliate_id  uuid        not null references affiliate.affiliates (id),
    referral_code varchar(16) not null,
    ip_hash       varchar(64) not null,
    user_agent    varchar(255),
    landing_path  varchar(500),
    clicked_at    timestamptz not null
);
create index idx_referral_click_affiliate_time on affiliate.referral_clicks (affiliate_id, clicked_at);

create table affiliate.customer_bindings
(
    id             uuid primary key default public.uuid_generate_v7(),
    customer_id    uuid        not null unique, -- ref -> customer.customers – GẮN VĨNH VIỄN (first-touch)
    affiliate_id   uuid        not null references affiliate.affiliates (id),
    first_order_id uuid        not null,        -- ref -> ordering.orders
    referral_code  varchar(16) not null,
    bound_at       timestamptz not null
);
create index idx_customer_binding_affiliate on affiliate.customer_bindings (affiliate_id);

create table affiliate.commissions
(
    id           uuid primary key default public.uuid_generate_v7(),
    order_id     uuid         not null unique, -- ref -> ordering.orders – mỗi đơn tối đa 1 hoa hồng
    order_code   varchar(20)  not null,
    affiliate_id uuid         not null references affiliate.affiliates (id),
    customer_id  uuid         not null,        -- ref -> customer.customers
    base_amount  bigint       not null check (base_amount >= 0),
    rate         numeric(5, 4) not null check (rate >= 0 and rate <= 1),
    amount       bigint       not null check (amount >= 0),
    status       varchar(16)  not null check (status in ('PENDING', 'APPROVED', 'CANCELLED')),
    eligible_at  timestamptz,
    approved_at  timestamptz,
    cancelled_at timestamptz,
    version      bigint       not null default 0,
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now()
);
create index idx_commission_affiliate on affiliate.commissions (affiliate_id, created_at desc);
create index idx_commission_status_eligible on affiliate.commissions (status, eligible_at);

create table affiliate.payouts
(
    id                      uuid primary key default public.uuid_generate_v7(),
    affiliate_id            uuid         not null references affiliate.affiliates (id),
    amount                  bigint       not null check (amount > 0),
    status                  varchar(16)  not null check (status in ('REQUESTED', 'APPROVED', 'PAID', 'REJECTED')),
    bank_name               varchar(100) not null,
    bank_account_no_enc     varchar(255) not null,
    bank_account_holder_enc varchar(255) not null,
    transaction_ref         varchar(100),
    reject_reason           varchar(500),
    processed_by            uuid,        -- ref -> identity.user_accounts (admin)
    requested_at            timestamptz  not null,
    approved_at             timestamptz,
    paid_at                 timestamptz,
    rejected_at             timestamptz,
    version                 bigint       not null default 0,
    created_at              timestamptz  not null default now(),
    updated_at              timestamptz  not null default now()
);
create index idx_payout_affiliate on affiliate.payouts (affiliate_id, requested_at desc);
create index idx_payout_status on affiliate.payouts (status, requested_at);
-- Mỗi CTV tối đa 1 yêu cầu rút đang mở -> chống rút trùng khi bấm 2 lần / gọi đồng thời
create unique index uq_payout_open on affiliate.payouts (affiliate_id) where status in ('REQUESTED', 'APPROVED');

-- Mô tả (DBeaver: Properties / Comment)
comment on table affiliate.affiliates is 'Cộng tác viên (CTV). PENDING -> APPROVED / REJECTED; APPROVED <-> SUSPENDED. Chỉ APPROVED có link hoạt động';
comment on column affiliate.affiliates.user_id is 'Tài khoản identity của CTV (một người vừa là khách vừa là CTV)';
comment on column affiliate.affiliates.phone is 'SĐT của CTV (bản chụp) – dùng chặn tự giới thiệu';
comment on column affiliate.affiliates.referral_code is 'Mã giới thiệu duy nhất, sinh khi được duyệt. Link: /?ref=CODE hoặc /p/slug?ref=CODE';
comment on column affiliate.affiliates.bank_account_no_enc is 'Số tài khoản – mã hóa AES-GCM (khóa AFFILIATE_BANK_KEY)';
comment on column affiliate.affiliates.bank_account_holder_enc is 'Chủ tài khoản – mã hóa AES-GCM';
comment on column affiliate.affiliates.bank_account_no_last4 is '4 số cuối để hiển thị ****1234';
comment on column affiliate.affiliates.bank_changed_at is 'Lần đổi tài khoản ngân hàng gần nhất – khóa rút tiền 48 giờ sau khi đổi (lần thiết lập đầu tiên không khóa)';
comment on column affiliate.affiliates.status_reason is 'Lý do từ chối / tạm khóa';
comment on table affiliate.referral_clicks is 'Lượt click link CTV. Không đếm trùng cùng IP + mã trong 24 giờ (Redis)';
comment on column affiliate.referral_clicks.ip_hash is 'SHA-256 của IP – không lưu IP gốc';
comment on table affiliate.customer_bindings is 'Gắn khách vĩnh viễn (first-touch): đơn đầu tiên có ref hợp lệ -> mọi đơn sau của khách tính hoa hồng cho CTV này';
comment on table affiliate.commissions is 'Hoa hồng: rate x (subtotal - discount), không tính phí ship, 1 cấp. PENDING -> APPROVED (giao + 7 ngày) / CANCELLED (hủy, trả hàng)';
comment on column affiliate.commissions.base_amount is 'Cơ sở tính = subtotal - discount (VND)';
comment on column affiliate.commissions.amount is 'floor(base_amount x rate) (VND)';
comment on column affiliate.commissions.eligible_at is 'Thời điểm được duyệt = ngày giao + hold-days; null khi đơn chưa giao';
comment on table affiliate.payouts is 'Yêu cầu rút tiền: REQUESTED -> APPROVED -> PAID; REJECTED (tiền tự trở lại số dư). Tối thiểu 200.000đ';
comment on column affiliate.payouts.bank_account_no_enc is 'Bản chụp tài khoản nhận tiền tại thời điểm yêu cầu (mã hóa)';
comment on column affiliate.payouts.transaction_ref is 'Mã giao dịch chuyển khoản admin nhập khi chi trả';

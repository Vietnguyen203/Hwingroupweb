create table customer.customers
(
    id         uuid   primary key, -- = identity.user_accounts.id (ID, không FK)
    phone      varchar(16)  not null unique,
    full_name  varchar(100),
    version    bigint       not null default 0,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

create table customer.customer_addresses
(
    id              uuid primary key default public.uuid_generate_v7(),
    customer_id     uuid         not null references customer.customers (id) on delete cascade,
    recipient_name  varchar(100) not null,
    recipient_phone varchar(16)  not null,
    province        varchar(100) not null,
    district        varchar(100) not null,
    ward            varchar(100) not null,
    street          varchar(255) not null,
    is_default      boolean      not null default false,
    created_at      timestamptz  not null default now()
);
create index idx_customer_address_customer on customer.customer_addresses (customer_id);
-- Không đặt unique partial index cho is_default: aggregate Customer đảm bảo tối đa 1 địa chỉ mặc định
-- (Hibernate flush UPDATE theo thứ tự không xác định sẽ vi phạm index tạm thời).

-- Read model: thống kê khách, cập nhật qua event của ordering
create table customer.customer_stats
(
    customer_id    uuid   primary key references customer.customers (id) on delete cascade,
    total_orders   integer     not null default 0,
    total_spent    bigint      not null default 0,
    first_order_at timestamptz,
    last_order_at  timestamptz,
    updated_at     timestamptz not null default now()
);
create index idx_customer_stats_last_order on customer.customer_stats (last_order_at);

create table customer.customer_product_stats
(
    customer_id     uuid        not null references customer.customers (id) on delete cascade,
    product_id      uuid        not null, -- ref -> catalog.products (ID, không FK)
    total_quantity  integer     not null default 0,
    order_count     integer     not null default 0,
    last_ordered_at timestamptz,
    primary key (customer_id, product_id)
);

-- Chống xử lý trùng event (listener idempotent)
create table customer.processed_events
(
    event_id     uuid         not null,
    listener     varchar(100) not null,
    processed_at timestamptz  not null default now(),
    primary key (event_id, listener)
);

-- Chú thích bảng / cột
comment on table customer.customers is 'Hồ sơ khách. id = identity.user_accounts.id (tạo khi nhận event UserRegistered)';
comment on table customer.customer_addresses is 'Sổ địa chỉ (tối đa 10, đúng 1 địa chỉ mặc định)';
comment on table customer.customer_stats is 'Read model: thống kê mua hàng, cập nhật từ event ordering (không tính đơn hủy/trả)';
comment on column customer.customer_stats.last_order_at is 'Dùng phân nhóm "lâu chưa quay lại"';
comment on table customer.customer_product_stats is 'Read model: khách đã mua sản phẩm nào bao nhiêu – "Sản phẩm bạn hay mua"';
comment on table customer.processed_events is 'Event đã xử lý theo từng listener – chống cập nhật trùng khi event phát lại';


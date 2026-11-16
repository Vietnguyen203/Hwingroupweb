create table customer.customer
(
    id         uuid   primary key, -- = identity.user_account.id (ID, không FK)
    phone      varchar(16)  not null unique,
    full_name  varchar(100),
    version    bigint       not null default 0,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

create table customer.customer_address
(
    id              uuid primary key default gen_random_uuid(),
    customer_id     uuid         not null references customer.customer (id) on delete cascade,
    recipient_name  varchar(100) not null,
    recipient_phone varchar(16)  not null,
    province        varchar(100) not null,
    district        varchar(100) not null,
    ward            varchar(100) not null,
    street          varchar(255) not null,
    is_default      boolean      not null default false,
    created_at      timestamptz  not null default now()
);
create index idx_customer_address_customer on customer.customer_address (customer_id);
-- Không đặt unique partial index cho is_default: aggregate Customer đảm bảo tối đa 1 địa chỉ mặc định
-- (Hibernate flush UPDATE theo thứ tự không xác định sẽ vi phạm index tạm thời).

-- Read model: thống kê khách, cập nhật qua event của ordering
create table customer.customer_stats
(
    customer_id    uuid   primary key references customer.customer (id) on delete cascade,
    total_orders   integer     not null default 0,
    total_spent    bigint      not null default 0,
    first_order_at timestamptz,
    last_order_at  timestamptz,
    updated_at     timestamptz not null default now()
);
create index idx_customer_stats_last_order on customer.customer_stats (last_order_at);

create table customer.customer_product_stat
(
    customer_id     uuid        not null references customer.customer (id) on delete cascade,
    product_id      uuid        not null, -- ref -> catalog.product (ID, không FK)
    total_quantity  integer     not null default 0,
    order_count     integer     not null default 0,
    last_ordered_at timestamptz,
    primary key (customer_id, product_id)
);

-- Chống xử lý trùng event (listener idempotent)
create table customer.processed_event
(
    event_id     uuid         not null,
    listener     varchar(100) not null,
    processed_at timestamptz  not null default now(),
    primary key (event_id, listener)
);

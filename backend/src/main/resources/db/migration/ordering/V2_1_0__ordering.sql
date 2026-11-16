create table ordering.cart
(
    id         bigint generated always as identity primary key,
    user_id    bigint      not null unique, -- ref -> identity.user_account (ID, không FK)
    version    bigint      not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table ordering.cart_item
(
    id         bigint generated always as identity primary key,
    cart_id    bigint      not null references ordering.cart (id) on delete cascade,
    product_id bigint      not null, -- ref -> catalog.product (ID, không FK)
    quantity   integer     not null check (quantity between 1 and 99),
    added_at   timestamptz not null default now(),
    constraint uq_cart_item unique (cart_id, product_id)
);

create table ordering.orders
(
    id               bigint generated always as identity primary key,
    order_code       varchar(20)  not null unique,
    customer_id      bigint       not null, -- ref -> customer.customer (= userId)
    referral_code    varchar(16),
    status           varchar(16)  not null check (status in
        ('PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED')),
    payment_method   varchar(16)  not null check (payment_method in ('COD', 'BANK_QR')),
    payment_status   varchar(16)  not null check (payment_status in ('UNPAID', 'PAID')),
    subtotal         bigint       not null check (subtotal >= 0),
    discount         bigint       not null default 0 check (discount >= 0),
    shipping_fee     bigint       not null check (shipping_fee >= 0),
    total            bigint       not null check (total >= 0),
    recipient_name   varchar(100) not null,
    recipient_phone  varchar(16)  not null,
    province         varchar(100) not null,
    district         varchar(100) not null,
    ward             varchar(100) not null,
    street           varchar(255) not null,
    note             varchar(500),
    vat_requested    boolean      not null default false,
    vat_company_name varchar(255),
    vat_tax_code     varchar(20),
    vat_address      varchar(500),
    vat_email        varchar(255),
    cancel_reason    varchar(32),
    payment_ref      varchar(100),
    placed_at        timestamptz  not null,
    confirmed_at     timestamptz,
    shipped_at       timestamptz,
    delivered_at     timestamptz,
    completed_at     timestamptz,
    cancelled_at     timestamptz,
    returned_at      timestamptz,
    version          bigint       not null default 0,
    created_at       timestamptz  not null default now(),
    updated_at       timestamptz  not null default now(),
    constraint ck_orders_total check (total = subtotal - discount + shipping_fee)
);
create index idx_orders_customer on ordering.orders (customer_id, placed_at desc);
create index idx_orders_status on ordering.orders (status, placed_at);

create table ordering.order_item
(
    id           bigint generated always as identity primary key,
    order_id     bigint       not null references ordering.orders (id) on delete cascade,
    product_id   bigint       not null, -- ref -> catalog.product (ID, không FK)
    product_name varchar(200) not null,
    product_slug varchar(220) not null,
    image_url    varchar(500),
    unit_price   bigint       not null check (unit_price >= 0),
    quantity     integer      not null check (quantity > 0),
    line_total   bigint       not null check (line_total >= 0)
);
create index idx_order_item_order on ordering.order_item (order_id);

create table ordering.order_status_history
(
    id          bigint generated always as identity primary key,
    order_id    bigint      not null references ordering.orders (id) on delete cascade,
    from_status varchar(16),
    to_status   varchar(16) not null,
    actor_id    bigint, -- ref -> identity.user_account, null với job/hệ thống
    note        varchar(255),
    created_at  timestamptz not null default now()
);
create index idx_order_status_history_order on ordering.order_status_history (order_id);

-- Biến động kho theo đơn hàng. Unique (order_id, product_id, type) giúp trừ/hoàn kho idempotent
-- khi listener chạy lại.
create table catalog.stock_movement
(
    id         uuid primary key default public.uuid_generate_v7(),
    product_id uuid        not null references catalog.product (id),
    order_id   uuid        not null, -- ref -> ordering.orders (ID, không FK)
    type       varchar(16) not null check (type in ('DEDUCT', 'RESTORE')),
    quantity   integer     not null check (quantity > 0),
    created_at timestamptz not null default now(),
    constraint uq_stock_movement unique (order_id, product_id, type)
);
create index idx_stock_movement_order on catalog.stock_movement (order_id);

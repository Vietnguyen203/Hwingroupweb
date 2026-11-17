-- Biến động kho theo đơn hàng. Unique (order_id, product_id, type) giúp trừ/hoàn kho idempotent
-- khi listener chạy lại.
create table catalog.stock_movements
(
    id         uuid primary key default public.uuid_generate_v7(),
    product_id uuid        not null references catalog.products (id),
    order_id   uuid        not null, -- ref -> ordering.orders (ID, không FK)
    type       varchar(16) not null check (type in ('DEDUCT', 'RESTORE')),
    quantity   integer     not null check (quantity > 0),
    created_at timestamptz not null default now(),
    constraint uq_stock_movement unique (order_id, product_id, type)
);
create index idx_stock_movement_order on catalog.stock_movements (order_id);

-- Chú thích bảng / cột
comment on table catalog.stock_movements is 'Nhật ký trừ/hoàn kho theo đơn. Unique (order_id, product_id, type) giúp xử lý event idempotent';
comment on column catalog.stock_movements.order_id is 'ID đơn bên ordering.orders – chỉ lưu ID, không FK xuyên schema';
comment on column catalog.stock_movements.type is 'DEDUCT (trừ khi đặt) | RESTORE (hoàn khi hủy/trả)';


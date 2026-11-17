create table ordering.carts
(
    id         uuid primary key default public.uuid_generate_v7(),
    user_id    uuid        not null unique, -- ref -> identity.user_accounts (ID, không FK)
    version    bigint      not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table ordering.cart_items
(
    id         uuid primary key default public.uuid_generate_v7(),
    cart_id    uuid        not null references ordering.carts (id) on delete cascade,
    product_id uuid        not null, -- ref -> catalog.products (ID, không FK)
    quantity   integer     not null check (quantity between 1 and 99),
    added_at   timestamptz not null default now(),
    constraint uq_cart_item unique (cart_id, product_id)
);

create table ordering.orders
(
    id               uuid primary key default public.uuid_generate_v7(),
    order_code       varchar(20)  not null unique,
    customer_id      uuid         not null, -- ref -> customer.customers (= userId)
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

create table ordering.order_items
(
    id           uuid primary key default public.uuid_generate_v7(),
    order_id     uuid         not null references ordering.orders (id) on delete cascade,
    product_id   uuid         not null, -- ref -> catalog.products (ID, không FK)
    product_name varchar(200) not null,
    product_slug varchar(220) not null,
    image_url    varchar(500),
    unit_price   bigint       not null check (unit_price >= 0),
    quantity     integer      not null check (quantity > 0),
    line_total   bigint       not null check (line_total >= 0)
);
create index idx_order_item_order on ordering.order_items (order_id);

create table ordering.order_status_histories
(
    id          uuid primary key default public.uuid_generate_v7(),
    order_id    uuid        not null references ordering.orders (id) on delete cascade,
    from_status varchar(16),
    to_status   varchar(16) not null,
    actor_id    uuid  , -- ref -> identity.user_accounts, null với job/hệ thống
    note        varchar(255),
    created_at  timestamptz not null default now()
);
create index idx_order_status_history_order on ordering.order_status_histories (order_id);

-- Chú thích bảng / cột
comment on table ordering.carts is 'Giỏ hàng lưu server – mỗi user một giỏ';
comment on column ordering.carts.user_id is 'ID tài khoản (identity) – không FK xuyên schema';
comment on table ordering.cart_items is 'Dòng giỏ hàng: chỉ productId + số lượng, giá luôn lấy mới từ catalog';
comment on table ordering.orders is 'Đơn hàng (aggregate root). Vòng đời: PENDING > CONFIRMED > SHIPPING > DELIVERED > COMPLETED; CANCELLED; RETURNED';
comment on column ordering.orders.order_code is 'Mã đơn hiển thị cho khách: HW + yyMMdd + 4 ký tự ngẫu nhiên';
comment on column ordering.orders.customer_id is 'ID khách (= id tài khoản) – không FK xuyên schema';
comment on column ordering.orders.referral_code is 'Mã CTV đọc từ cookie hwin_ref lúc đặt hàng';
comment on column ordering.orders.payment_method is 'COD | BANK_QR (chuyển khoản VietQR, admin xác nhận)';
comment on column ordering.orders.payment_status is 'UNPAID | PAID (COD tự PAID khi giao thành công)';
comment on column ordering.orders.subtotal is 'Tạm tính = Σ đơn giá x số lượng (VND)';
comment on column ordering.orders.discount is 'Giảm giá – demo luôn 0';
comment on column ordering.orders.total is 'Tổng thanh toán = subtotal - discount + shipping_fee';
comment on column ordering.orders.recipient_name is 'Địa chỉ giao (bản chụp lúc đặt, không phụ thuộc sổ địa chỉ)';
comment on column ordering.orders.vat_requested is 'Khách có yêu cầu xuất hóa đơn VAT';
comment on column ordering.orders.payment_ref is 'Mã giao dịch chuyển khoản admin nhập khi xác nhận đã nhận tiền';
comment on table ordering.order_items is 'Dòng đơn – chụp lại tên và giá tại thời điểm đặt';
comment on column ordering.order_items.product_id is 'ID sản phẩm bên catalog – không FK xuyên schema';
comment on table ordering.order_status_histories is 'Lịch sử chuyển trạng thái đơn (ai, lúc nào, ghi chú)';
comment on column ordering.order_status_histories.actor_id is 'Người thực hiện (id tài khoản); null = hệ thống/job';


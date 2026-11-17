-- Đánh giá sản phẩm của khách (1 khách – 1 đánh giá / sản phẩm; chỉ khách đã nhận hàng, kiểm tra ở ứng dụng)
create table customer.product_reviews
(
    id            uuid primary key default public.uuid_generate_v7(),
    product_id    uuid         not null, -- ref -> catalog.products (ID, không FK xuyên schema)
    customer_id   uuid         not null references customer.customers (id) on delete cascade,
    reviewer_name varchar(100) not null,
    rating        integer      not null check (rating between 1 and 5),
    comment       varchar(1000),
    visible       boolean      not null default true,
    version       bigint       not null default 0,
    created_at    timestamptz  not null default now(),
    updated_at    timestamptz  not null default now(),
    constraint uq_product_reviews_product_customer unique (product_id, customer_id)
);
create index idx_product_reviews_product on customer.product_reviews (product_id, created_at desc);

comment on table customer.product_reviews is 'Đánh giá sản phẩm của khách đã nhận hàng';
comment on column customer.product_reviews.reviewer_name is 'Tên khách tại lúc đánh giá (API trả về dạng che: Trần V. B.)';
comment on column customer.product_reviews.rating is 'Số sao 1–5';
comment on column customer.product_reviews.visible is 'false = ẩn khỏi trang sản phẩm (kiểm duyệt)';

create table catalog.categories
(
    id         uuid primary key default public.uuid_generate_v7(),
    name       varchar(100) not null,
    slug       varchar(120) not null unique,
    icon_url   varchar(500),
    sort_order integer      not null default 0,
    active     boolean      not null default true,
    version    bigint       not null default 0,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

create table catalog.products
(
    id                      uuid primary key default public.uuid_generate_v7(),
    category_id             uuid         not null references catalog.categories (id),
    name                    varchar(200) not null,
    slug                    varchar(220) not null unique,
    price                   bigint       not null check (price >= 0),
    compare_at_price        bigint check (compare_at_price is null or compare_at_price >= 0),
    short_description       varchar(500),
    description             text,
    unit                    varchar(50),
    stock                   integer      not null default 0 check (stock >= 0),
    active                  boolean      not null default true,
    bestseller              boolean      not null default false,
    sold_count              integer      not null default 0,
    -- Thông tin thực phẩm (FoodInfo)
    manufacturer            varchar(200),
    shelf_life              varchar(100),
    storage_instructions    varchar(1000),
    declaration_number      varchar(100),
    food_safety_cert_number varchar(100),
    food_safety_cert_url    varchar(500),
    -- Cột phục vụ tìm kiếm không dấu (tự sinh)
    search_text             text generated always as
        (public.f_unaccent(lower(name || ' ' || coalesce(short_description, '')))) stored,
    version                 bigint       not null default 0,
    created_at              timestamptz  not null default now(),
    updated_at              timestamptz  not null default now()
);
create index idx_product_category_active on catalog.products (category_id, active);
create index idx_product_bestseller on catalog.products (bestseller) where active;
create index idx_product_search_trgm on catalog.products using gin (search_text gin_trgm_ops);

create table catalog.product_images
(
    id         uuid primary key default public.uuid_generate_v7(),
    product_id uuid         not null references catalog.products (id) on delete cascade,
    url        varchar(500) not null,
    sort_order integer      not null default 0
);
create index idx_product_image_product on catalog.product_images (product_id);

-- Chú thích bảng / cột
comment on table catalog.categories is 'Danh mục sản phẩm (menu icon trang chủ)';
comment on column catalog.categories.active is 'false = ẩn (không xóa cứng)';
comment on table catalog.products is 'Sản phẩm – không có biến thể (1 sản phẩm = 1 giá). Tiền tính bằng VND';
comment on column catalog.products.category_id is 'Danh mục (cùng schema – có FK)';
comment on column catalog.products.price is 'Giá bán (VND)';
comment on column catalog.products.compare_at_price is 'Giá gốc để gạch ngang; null nếu không giảm giá';
comment on column catalog.products.stock is 'Tồn kho hiện tại – trừ khi đặt hàng, hoàn khi hủy/trả';
comment on column catalog.products.sold_count is 'Số lượng đã bán – dùng sắp xếp "bán chạy"';
comment on column catalog.products.bestseller is 'Cờ hiển thị khối Bán chạy';
comment on column catalog.products.manufacturer is 'Nhà sản xuất (NSX)';
comment on column catalog.products.shelf_life is 'Hạn sử dụng / thời hạn sử dụng';
comment on column catalog.products.storage_instructions is 'Hướng dẫn bảo quản';
comment on column catalog.products.declaration_number is 'Số giấy tự công bố sản phẩm';
comment on column catalog.products.food_safety_cert_number is 'Số giấy chứng nhận cơ sở đủ điều kiện ATTP';
comment on column catalog.products.search_text is 'Tự sinh: f_unaccent(lower(tên + mô tả ngắn)) – tìm kiếm không dấu';
comment on table catalog.product_images is 'Ảnh sản phẩm (thuộc aggregate Product)';

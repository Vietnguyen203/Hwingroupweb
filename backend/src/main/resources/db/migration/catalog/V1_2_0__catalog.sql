create table catalog.category
(
    id         uuid primary key default gen_random_uuid(),
    name       varchar(100) not null,
    slug       varchar(120) not null unique,
    icon_url   varchar(500),
    sort_order integer      not null default 0,
    active     boolean      not null default true,
    version    bigint       not null default 0,
    created_at timestamptz  not null default now(),
    updated_at timestamptz  not null default now()
);

create table catalog.product
(
    id                      uuid primary key default gen_random_uuid(),
    category_id             uuid         not null references catalog.category (id),
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
create index idx_product_category_active on catalog.product (category_id, active);
create index idx_product_bestseller on catalog.product (bestseller) where active;
create index idx_product_search_trgm on catalog.product using gin (search_text gin_trgm_ops);

create table catalog.product_image
(
    id         uuid primary key default gen_random_uuid(),
    product_id uuid         not null references catalog.product (id) on delete cascade,
    url        varchar(500) not null,
    sort_order integer      not null default 0
);
create index idx_product_image_product on catalog.product_image (product_id);

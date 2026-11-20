-- Thư viện video mạng xã hội (Facebook, TikTok, YouTube): chỉ lưu đường dẫn gốc + cấu hình nhúng do backend tạo,
-- KHÔNG lưu file video. Mỗi video gắn tối đa vài sản phẩm của cửa hàng.
create schema if not exists content;

create table content.videos
(
    id            uuid          primary key default public.uuid_generate_v7(),
    title         varchar(200)  not null,
    slug          varchar(220)  not null,
    description   text,
    platform      varchar(16)   not null,
    source_url    varchar(1000) not null,
    external_id   varchar(200)  not null,
    embed_url     varchar(1000) not null,
    thumbnail_url varchar(1000),
    category_id   uuid,
    display_order integer       not null default 0,
    status        varchar(16)   not null default 'HIDDEN',
    created_at    timestamptz   not null default now(),
    updated_at    timestamptz   not null default now(),
    constraint uq_videos_slug unique (slug),
    constraint uq_videos_platform_external unique (platform, external_id),
    constraint ck_videos_platform check (platform in ('FACEBOOK', 'TIKTOK', 'YOUTUBE')),
    constraint ck_videos_status check (status in ('PUBLISHED', 'HIDDEN'))
);

create index idx_videos_status_order on content.videos (status, display_order);
create index idx_videos_category on content.videos (category_id);
create index idx_videos_platform on content.videos (platform);

comment on table content.videos is 'Video mạng xã hội hiển thị trên web; video vẫn nằm ở nền tảng gốc';
comment on column content.videos.source_url is 'Đường dẫn gốc đã chuẩn hóa (https), dùng cho nút "Xem bài gốc"';
comment on column content.videos.external_id is 'Mã video trên nền tảng; cùng (platform, external_id) chỉ thêm được một lần';
comment on column content.videos.embed_url is 'Địa chỉ nhúng do backend tạo từ source_url (không nhận HTML/iframe từ client)';
comment on column content.videos.category_id is 'Danh mục (catalog.categories) – không có khóa ngoại liên schema, service kiểm tra tồn tại';

create table content.video_products
(
    id            uuid    primary key default public.uuid_generate_v7(),
    video_id      uuid    not null references content.videos (id) on delete cascade,
    product_id    uuid    not null,
    display_order integer not null default 0,
    constraint uq_video_products unique (video_id, product_id)
);

create index idx_video_products_product on content.video_products (product_id);

comment on column content.video_products.product_id is 'Sản phẩm (catalog.products) – không có khóa ngoại liên schema, service kiểm tra tồn tại';

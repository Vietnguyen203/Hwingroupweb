-- Giảm giá thêm theo % do admin đặt (áp cho cả combo). Giá khách trả = price * (100 - sale_percent) / 100.
alter table catalog.products
    add column sale_percent   integer not null default 0 check (sale_percent between 0 and 90),
    add column effective_price bigint;

update catalog.products set effective_price = price;
alter table catalog.products alter column effective_price set not null;
alter table catalog.products add constraint chk_products_effective_price check (effective_price >= 0);

comment on column catalog.products.sale_percent is 'Giảm giá thêm (%), 0–90, chỉ ADMIN đặt; tính trên giá niêm yết (price)';
comment on column catalog.products.effective_price is 'Giá khách thực trả = price * (100 - sale_percent) / 100 (lưu sẵn để sắp xếp theo giá)';
create index idx_products_effective_price on catalog.products (effective_price);

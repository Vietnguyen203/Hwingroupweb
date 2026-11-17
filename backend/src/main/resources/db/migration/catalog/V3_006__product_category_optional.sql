-- Sản phẩm được phép chưa phân loại: xóa danh mục thì sản phẩm thuộc danh mục đó chuyển về "chưa phân loại"
-- (giao diện admin đã báo trước điều này). Idempotent: an toàn với DB đã được chỉnh tay như vậy.
alter table catalog.products alter column category_id drop not null;

alter table catalog.products drop constraint if exists products_category_id_fkey;
alter table catalog.products
    add constraint products_category_id_fkey foreign key (category_id) references catalog.categories (id) on delete set null;

comment on column catalog.products.category_id is 'Danh mục (cùng schema – có FK); null = chưa phân loại, tự về null khi xóa danh mục';

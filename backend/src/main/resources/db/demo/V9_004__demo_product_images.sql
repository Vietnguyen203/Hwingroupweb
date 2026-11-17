-- Ảnh mẫu bổ sung để thấy thư viện ảnh trang sản phẩm: mỗi sản phẩm 3 ảnh, chả lụa truyền thống 5 ảnh (tối đa).
insert into catalog.product_images (product_id, url, sort_order)
select p.id, '/sample/products/' || p.slug || '-' || n.i || '.svg', n.i - 1
  from catalog.products p cross join generate_series(2, 5) as n(i)
 where n.i <= case when p.slug = 'cha-lua-truyen-thong-500g' then 5 else 3 end;

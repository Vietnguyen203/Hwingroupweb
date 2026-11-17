-- Dữ liệu mẫu trang chủ: đủ danh mục chuẩn, sản phẩm chưa phân loại được gán về đúng danh mục, và một combo giảm giá.
-- Không đụng tới danh mục / sản phẩm đã có (ON CONFLICT DO NOTHING; chỉ gán sản phẩm đang chưa phân loại).

insert into catalog.categories (name, slug, icon_url, sort_order) values
    ('Chả & Giò',              'cha-gio',        '/sample/icons/cha-gio.svg',        1),
    ('Xúc xích & Lạp xưởng',   'xuc-xich',       '/sample/icons/xuc-xich.svg',       2),
    ('Thịt chế biến sẵn',      'thit-che-bien',  '/sample/icons/thit-che-bien.svg',  3),
    ('Hải sản chế biến',       'hai-san',        '/sample/icons/hai-san.svg',        4),
    ('Đồ khô & Đặc sản',       'do-kho',         '/sample/icons/do-kho.svg',         5),
    ('Combo tiết kiệm',        'combo',          '/sample/icons/combo.svg',          6)
on conflict (slug) do nothing;

update catalog.products p
   set category_id = c.id
  from (values
    ('cha-lua-truyen-thong-500g', 'cha-gio'), ('cha-que-nuong-500g', 'cha-gio'), ('gio-thu-500g', 'cha-gio'),
    ('lap-xuong-tuoi-500g', 'xuc-xich'), ('xuc-xich-heo-xong-khoi-500g', 'xuc-xich'),
    ('thit-heo-gac-bep-250g', 'thit-che-bien'), ('thit-kho-trung-dong-hop-400g', 'thit-che-bien'),
    ('cha-ca-thac-lac-500g', 'hai-san'), ('tom-kho-loai-1-200g', 'hai-san'),
    ('ruoc-cha-bong-heo-200g', 'do-kho'), ('nem-chua-thanh-hoa-hop-20', 'do-kho'),
    ('combo-tet-sum-vay', 'combo')
  ) as m (product_slug, category_slug)
  join catalog.categories c on c.slug = m.category_slug
 where p.slug = m.product_slug and p.category_id is null;

-- Combo Tết sum vầy (giá niêm yết 299.000đ đã trừ ưu đãi combo) + giảm thêm 15% -> khách trả 254.150đ
insert into catalog.products (category_id, name, slug, price, compare_at_price, short_description, description, unit, stock,
                              bestseller, sold_count, manufacturer, shelf_life, storage_instructions, declaration_number,
                              food_safety_cert_number, food_safety_cert_url, brand, weight, packaging, origin, ingredients,
                              features, usage_instructions, sale_percent, effective_price)
select c.id, 'Combo Tết sum vầy', 'combo-tet-sum-vay', 299000, 340000,
       'Chả lụa 500g + Giò thủ 500g + Lạp xưởng 500g – tiết kiệm 41.000đ.',
       'Chả lụa 500g + Giò thủ 500g + Lạp xưởng 500g – tiết kiệm 41.000đ.' || E'\n\nĐóng hộp quà, tiện biếu tặng dịp Tết. (Dữ liệu mẫu cho bản demo.)',
       'combo 3 món', 50, true, 190, 'Công ty TNHH Thực phẩm HWIN (dữ liệu mẫu)', 'Theo từng sản phẩm trong combo',
       'Theo hướng dẫn từng sản phẩm.', 'TCB-012/2025/HWIN', 'ATTP-2025-0001-HWIN', '/sample/cert-attp.svg',
       'HWIN Food', 'Combo 3 món', 'Hộp quà', 'Việt Nam',
       'Gồm: chả lụa truyền thống, giò thủ, lạp xưởng tươi (xem chi tiết từng sản phẩm).',
       'Mua theo bộ tiết kiệm hơn; đóng hộp quà; tiện biếu tặng dịp Tết.',
       'Bảo quản theo hướng dẫn trên từng sản phẩm trong combo.', 15, 299000 * 85 / 100
  from catalog.categories c
 where c.slug = 'combo'
on conflict (slug) do nothing;

insert into catalog.product_images (product_id, url, sort_order)
select p.id, '/sample/products/combo-tet-sum-vay' || case n.i when 1 then '' else '-' || n.i end || '.svg', n.i - 1
  from catalog.products p cross join generate_series(1, 3) as n(i)
 where p.slug = 'combo-tet-sum-vay'
   and not exists (select 1 from catalog.product_images i where i.product_id = p.id);

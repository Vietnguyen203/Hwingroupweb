-- Dữ liệu mẫu cho demo: 6 danh mục, 12 sản phẩm thực phẩm chế biến.
-- Ảnh mẫu nằm ở frontend/public/sample (phục vụ bởi Next.js, cùng origin).

insert into catalog.categories (name, slug, icon_url, sort_order) values
    ('Chả & Giò',              'cha-gio',        '/sample/icons/cha-gio.svg',        1),
    ('Xúc xích & Lạp xưởng',   'xuc-xich',       '/sample/icons/xuc-xich.svg',       2),
    ('Thịt chế biến sẵn',      'thit-che-bien',  '/sample/icons/thit-che-bien.svg',  3),
    ('Hải sản chế biến',       'hai-san',        '/sample/icons/hai-san.svg',        4),
    ('Đồ khô & Đặc sản',       'do-kho',         '/sample/icons/do-kho.svg',         5),
    ('Combo tiết kiệm',        'combo',          '/sample/icons/combo.svg',          6);

with p (cat, name, slug, price, compare_at, short_desc, unit, stock, bestseller, sold, shelf, storage) as (values
    ('cha-gio', 'Chả lụa truyền thống 500g', 'cha-lua-truyen-thong-500g', 95000, 110000,
     'Chả lụa giã tay từ thịt heo đùi tươi, gói lá chuối, dai giòn tự nhiên.', 'đòn 500g', 120, true, 340,
     '30 ngày kể từ NSX', 'Bảo quản ngăn mát 0–5°C. Dùng hết trong 3 ngày sau khi mở gói.'),
    ('cha-gio', 'Chả quế nướng 500g', 'cha-que-nuong-500g', 105000, null,
     'Chả lụa phết quế nướng than hoa, thơm mùi quế đặc trưng.', 'đòn 500g', 80, false, 120,
     '30 ngày kể từ NSX', 'Bảo quản ngăn mát 0–5°C.'),
    ('cha-gio', 'Giò thủ 500g', 'gio-thu-500g', 120000, null,
     'Giò thủ tai, mũi, nấm mèo – giòn sần sật, không chất bảo quản.', 'cây 500g', 60, true, 210,
     '20 ngày kể từ NSX', 'Bảo quản ngăn mát 0–5°C.'),
    ('xuc-xich', 'Lạp xưởng tươi 500g', 'lap-xuong-tuoi-500g', 115000, 130000,
     'Lạp xưởng tươi tỉ lệ nạc mỡ 7:3, rượu mai quế lộ thơm nhẹ.', 'gói 500g', 150, true, 400,
     '60 ngày (ngăn đông)', 'Bảo quản ngăn đông -18°C. Rã đông ngăn mát trước khi chế biến.'),
    ('xuc-xich', 'Xúc xích heo xông khói 500g', 'xuc-xich-heo-xong-khoi-500g', 89000, null,
     'Xúc xích xông khói gỗ sồi, chiên hoặc nướng đều ngon.', 'gói 500g', 100, false, 95,
     '90 ngày (ngăn đông)', 'Bảo quản ngăn đông -18°C.'),
    ('thit-che-bien', 'Thịt heo gác bếp 250g', 'thit-heo-gac-bep-250g', 189000, 220000,
     'Thịt heo bản ướp mắc khén, hun khói trên gác bếp theo cách người Tây Bắc.', 'gói 250g', 70, true, 260,
     '6 tháng (hút chân không)', 'Nơi khô ráo, thoáng mát; sau khi mở để ngăn mát.'),
    ('thit-che-bien', 'Thịt kho trứng đóng hộp 400g', 'thit-kho-trung-dong-hop-400g', 69000, null,
     'Thịt ba chỉ kho trứng cút nước dừa, hâm nóng là ăn ngay.', 'hộp 400g', 90, false, 80,
     '12 tháng kể từ NSX', 'Nơi khô ráo, tránh ánh nắng trực tiếp.'),
    ('hai-san', 'Chả cá thác lác 500g', 'cha-ca-thac-lac-500g', 135000, null,
     'Chả cá thác lác Hậu Giang quết tay, dai ngọt, không hàn the.', 'hộp 500g', 75, true, 300,
     '90 ngày (ngăn đông)', 'Bảo quản ngăn đông -18°C.'),
    ('hai-san', 'Tôm khô loại 1 200g', 'tom-kho-loai-1-200g', 249000, 279000,
     'Tôm đất Cà Mau phơi nắng tự nhiên, đỏ au, ngọt thịt.', 'túi 200g', 40, false, 70,
     '6 tháng kể từ NSX', 'Nơi khô ráo; sau khi mở nên để ngăn mát.'),
    ('do-kho', 'Ruốc (chà bông) heo 200g', 'ruoc-cha-bong-heo-200g', 85000, null,
     'Ruốc heo sợi tơi mịn, rang lửa nhỏ, không phẩm màu.', 'hũ 200g', 130, true, 280,
     '6 tháng kể từ NSX', 'Đậy kín nắp, nơi khô ráo thoáng mát.'),
    ('do-kho', 'Nem chua Thanh Hóa (hộp 20 cái)', 'nem-chua-thanh-hoa-hop-20', 75000, null,
     'Nem chua lá ổi, chua dịu, giòn bì – đặc sản xứ Thanh.', 'hộp 20 cái', 110, false, 150,
     '7 ngày kể từ NSX', 'Bảo quản ngăn mát 0–5°C.'),
    ('combo', 'Combo Tết sum vầy', 'combo-tet-sum-vay', 299000, 340000,
     'Chả lụa 500g + Giò thủ 500g + Lạp xưởng 500g – tiết kiệm 41.000đ.', 'combo 3 món', 50, true, 190,
     'Theo từng sản phẩm trong combo', 'Theo hướng dẫn từng sản phẩm.')
)
insert into catalog.products (category_id, name, slug, price, compare_at_price, short_description, description,
                             unit, stock, bestseller, sold_count, manufacturer, shelf_life, storage_instructions,
                             declaration_number, food_safety_cert_number, food_safety_cert_url)
select c.id, p.name, p.slug, p.price, p.compare_at, p.short_desc,
       p.short_desc || E'\n\nSản phẩm được sản xuất trên dây chuyền đạt chuẩn ATTP, đóng gói hút chân không, '
           || 'giao hàng giữ lạnh. (Dữ liệu mẫu cho bản demo.)',
       p.unit, p.stock, p.bestseller, p.sold,
       'Công ty TNHH Thực phẩm HWIN (dữ liệu mẫu)', p.shelf, p.storage,
       'TCB-' || lpad(row_number() over ()::text, 3, '0') || '/2025/HWIN', 'ATTP-2025-0001-HWIN',
       '/sample/cert-attp.svg'
from p join catalog.categories c on c.slug = p.cat;

insert into catalog.product_images (product_id, url, sort_order)
select id, '/sample/products/' || slug || '.svg', 0 from catalog.products;

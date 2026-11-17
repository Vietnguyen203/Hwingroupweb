-- Thông tin cơ bản + nội dung chi tiết của sản phẩm: thương hiệu, khối lượng, đóng gói, xuất xứ,
-- thành phần, đặc điểm, hướng dẫn sử dụng. (Ảnh: tối thiểu 1, tối đa 5 – kiểm tra ở ứng dụng.)
alter table catalog.products
    add column brand              varchar(100),
    add column weight             varchar(50),
    add column packaging          varchar(100),
    add column origin             varchar(100),
    add column ingredients        text,
    add column features           text,
    add column usage_instructions text;

comment on column catalog.products.brand is 'Thương hiệu';
comment on column catalog.products.weight is 'Khối lượng / quy cách, ví dụ 500g, 20 cái';
comment on column catalog.products.packaging is 'Đóng gói, ví dụ Gói hút chân không, Hộp 20 cái';
comment on column catalog.products.origin is 'Xuất xứ, ví dụ Việt Nam';
comment on column catalog.products.ingredients is 'Thành phần';
comment on column catalog.products.features is 'Đặc điểm nổi bật';
comment on column catalog.products.usage_instructions is 'Hướng dẫn sử dụng (bảo quản nằm ở storage_instructions)';

-- Dữ liệu mẫu cho 12 sản phẩm demo
update catalog.products p
   set brand = v.brand, weight = v.weight, packaging = v.packaging, origin = v.origin,
       ingredients = v.ingredients, features = v.features, usage_instructions = v.usage
  from (values
    ('cha-lua-truyen-thong-500g', 'HWIN Food', '500g', 'Đòn gói lá chuối, hút chân không', 'Việt Nam', 'Thịt heo đùi tươi 85%, nước mắm, tiêu, muối, đường, lá chuối.', 'Giã tay thủ công; dai giòn tự nhiên; không hàn the; không chất bảo quản.', 'Cắt lát ăn trực tiếp, chiên hoặc cuốn bánh mì. Bảo quản ngăn mát 0–5°C, dùng hết trong 3 ngày sau khi mở gói.'),
    ('cha-que-nuong-500g', 'HWIN Food', '500g', 'Đòn gói lá chuối, hút chân không', 'Việt Nam', 'Thịt heo nạc 80%, quế, nước mắm, tiêu, đường, muối.', 'Phết quế nướng than hoa; thơm đặc trưng; không phẩm màu.', 'Cắt lát ăn ngay hoặc áp chảo nhẹ. Bảo quản ngăn mát 0–5°C.'),
    ('gio-thu-500g', 'HWIN Food', '500g', 'Cây bọc lá, hút chân không', 'Việt Nam', 'Tai heo, mũi heo, nấm mèo, tiêu, nước mắm, hành khô.', 'Giòn sần sật; không chất bảo quản; nấu theo công thức truyền thống.', 'Ăn nguội kèm dưa hành, nước chấm. Bảo quản ngăn mát 0–5°C.'),
    ('lap-xuong-tuoi-500g', 'HWIN Food', '500g', 'Gói hút chân không', 'Việt Nam', 'Thịt heo (nạc 70%, mỡ 30%), rượu mai quế lộ, đường, muối, tiêu, ruột heo.', 'Tỉ lệ nạc mỡ 7:3; thơm rượu mai quế lộ; làm lạnh sâu giữ độ tươi.', 'Rã đông ngăn mát, hấp hoặc chiên lửa nhỏ 8–10 phút. Bảo quản ngăn đông -18°C.'),
    ('xuc-xich-heo-xong-khoi-500g', 'HWIN Food', '500g', 'Gói hút chân không', 'Việt Nam', 'Thịt heo 88%, tinh bột, muối, tiêu, hương khói tự nhiên, vỏ collagen.', 'Xông khói gỗ sồi; ăn liền hoặc chế biến nhanh; thịt chắc, vị đậm.', 'Chiên, nướng hoặc luộc 3–5 phút. Bảo quản ngăn đông -18°C.'),
    ('thit-heo-gac-bep-250g', 'HWIN Food', '250g', 'Gói hút chân không', 'Việt Nam (Tây Bắc)', 'Thịt heo bản, mắc khén, gừng, tỏi, ớt, muối, tiêu rừng.', 'Hun khói trên gác bếp; thơm mắc khén; để được lâu.', 'Hấp hoặc nướng nóng, thái lát mỏng. Bảo quản nơi khô ráo, sau khi mở để ngăn mát.'),
    ('thit-kho-trung-dong-hop-400g', 'HWIN Food', '400g', 'Hộp thiếc đóng kín', 'Việt Nam', 'Thịt ba chỉ heo, trứng, nước dừa, nước mắm, đường, hành tỏi.', 'Nấu sẵn; hâm nóng ăn liền; vị đậm đà kiểu miền Nam.', 'Hâm nóng 3–5 phút. Bảo quản nơi khô ráo; sau khi mở dùng hết trong 2 ngày (ngăn mát).'),
    ('cha-ca-thac-lac-500g', 'HWIN Food', '500g', 'Khay bọc màng, hút chân không', 'Việt Nam', 'Thịt cá thác lác 90%, tiêu, tỏi, muối, đường.', 'Cá thác lác nạo thủ công; dai ngọt tự nhiên; không chất bảo quản.', 'Chiên vàng, nấu lẩu hoặc nấu canh. Bảo quản ngăn đông -18°C.'),
    ('tom-kho-loai-1-200g', 'HWIN Food', '200g', 'Túi zip hút chân không', 'Việt Nam (Cà Mau)', 'Tôm biển 100%, muối.', 'Tôm loại 1 đều con; phơi nắng tự nhiên; vị ngọt đậm.', 'Ăn trực tiếp, nấu canh, xào hoặc làm gỏi. Bảo quản nơi khô ráo, kín gió.'),
    ('ruoc-cha-bong-heo-200g', 'HWIN Food', '200g', 'Hũ nhựa nắp xoáy', 'Việt Nam', 'Thịt heo nạc 95%, nước mắm, đường, hành khô.', 'Sợi tơi mềm, xốp; thơm; không chất bảo quản.', 'Ăn cùng cháo, cơm, xôi, bánh mì. Đậy kín nắp sau khi dùng, bảo quản nơi khô ráo.'),
    ('nem-chua-thanh-hoa-hop-20', 'HWIN Food', '20 cái', 'Hộp 20 cái, gói lá ổi', 'Việt Nam (Thanh Hóa)', 'Thịt heo nạc, bì heo, thính gạo, tỏi, ớt, tiêu, lá ổi, lá đinh lăng.', 'Lên men tự nhiên; chua nhẹ, giòn dai; gói lá ổi truyền thống.', 'Ăn trực tiếp kèm tỏi, ớt. Bảo quản ngăn mát 0–5°C.'),
    ('combo-tet-sum-vay', 'HWIN Food', 'Combo 3 món', 'Hộp quà', 'Việt Nam', 'Gồm: chả lụa truyền thống, giò thủ, lạp xưởng tươi (xem chi tiết từng sản phẩm).', 'Mua theo bộ tiết kiệm hơn; đóng hộp quà; tiện biếu tặng dịp Tết.', 'Bảo quản theo hướng dẫn trên từng sản phẩm trong combo.')
  ) as v (slug, brand, weight, packaging, origin, ingredients, features, usage)
 where p.slug = v.slug;

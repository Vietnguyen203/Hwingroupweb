-- Dữ liệu mẫu giảm giá thêm: combo giảm 15% (giá niêm yết 299.000đ -> 254.150đ), chả lụa giảm 10%.
update catalog.products set sale_percent = 15, effective_price = price * 85 / 100 where slug = 'combo-tet-sum-vay';
update catalog.products set sale_percent = 10, effective_price = price * 90 / 100 where slug = 'cha-lua-truyen-thong-500g';

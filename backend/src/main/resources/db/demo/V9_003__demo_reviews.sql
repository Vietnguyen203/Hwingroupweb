-- Đánh giá mẫu của khách Bình (đã nhận đơn HWDEMO0001: giò thủ + chả lụa).
insert into customer.product_reviews (product_id, customer_id, reviewer_name, rating, comment, created_at)
select p.id, '01900000-0000-7000-8000-000000000102', 'Trần Văn Bình', v.rating, v.comment, now() - v.ago
  from (values
    ('gio-thu-500g', 5, 'Giò giòn, thơm, đóng gói kỹ và giao nhanh. Cả nhà ăn hết sạch, sẽ mua lại!', interval '8 days'),
    ('cha-lua-truyen-thong-500g', 4, 'Chả lụa dai ngon, vị vừa miệng. Hơi mong giá mềm hơn một chút.', interval '9 days')
  ) as v (slug, rating, comment, ago)
  join catalog.products p on p.slug = v.slug;

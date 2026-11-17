-- =====================================================================================
-- DỮ LIỆU MẪU CHO DEMO – chỉ nạp ở profile dev (spring.flyway.locations có classpath:db/demo).
-- Số liệu khớp nhau giữa các module như khi chạy qua nghiệp vụ thật:
--   tồn kho / stock_movement, đơn + lịch sử, hoa hồng, khách gắn CTV, thống kê khách, click, audit.
--
-- Tài khoản (đăng nhập OTP – ở dev lấy mã trong log hoặc GET /api/dev/otp/latest):
--   CTV mẫu  : 0901000001 – Nguyễn Thị Hoa – mã giới thiệu HWINDEMO (đã duyệt)
--   Khách 1  : 0901000002 – Trần Văn Bình  – đã gắn với CTV HWINDEMO
--   Khách 2  : 0901000003 – Lê Thị Cúc     – khách tự vào (không qua CTV)
-- Đơn mẫu:
--   HWDEMO0001  Bình  qua link CTV  COD      DELIVERED (10 ngày trước) -> hoa hồng 31.000 APPROVED
--   HWDEMO0002  Bình  (đã gắn CTV)   COD      CONFIRMED                 -> hoa hồng 11.500 PENDING
--   HWDEMO0003  Cúc                  BANK_QR  PENDING, chưa chuyển khoản
--   HWDEMO0004  Cúc                  COD      CANCELLED (khách tự hủy)  -> đã hoàn kho
-- =====================================================================================

-- ---------------------------------------------------------------- tài khoản
insert into identity.user_accounts (id, phone, full_name, status, last_login_at) values
    ('01900000-0000-7000-8000-000000000101', '+84901000001', 'Nguyễn Thị Hoa', 'ACTIVE', now() - interval '1 day'),
    ('01900000-0000-7000-8000-000000000102', '+84901000002', 'Trần Văn Bình',  'ACTIVE', now() - interval '2 days'),
    ('01900000-0000-7000-8000-000000000103', '+84901000003', 'Lê Thị Cúc',     'ACTIVE', now() - interval '1 hour');
insert into identity.user_roles (user_id, role) values
    ('01900000-0000-7000-8000-000000000101', 'CUSTOMER'),
    ('01900000-0000-7000-8000-000000000101', 'AFFILIATE'),
    ('01900000-0000-7000-8000-000000000102', 'CUSTOMER'),
    ('01900000-0000-7000-8000-000000000103', 'CUSTOMER');

-- ---------------------------------------------------------------- hồ sơ khách + sổ địa chỉ
insert into customer.customers (id, phone, full_name, created_at) values
    ('01900000-0000-7000-8000-000000000101', '+84901000001', 'Nguyễn Thị Hoa', now() - interval '30 days'),
    ('01900000-0000-7000-8000-000000000102', '+84901000002', 'Trần Văn Bình',  now() - interval '20 days'),
    ('01900000-0000-7000-8000-000000000103', '+84901000003', 'Lê Thị Cúc',     now() - interval '5 days');
insert into customer.customer_addresses (customer_id, recipient_name, recipient_phone, province, district, ward, street, is_default) values
    ('01900000-0000-7000-8000-000000000102', 'Trần Văn Bình', '+84901000002', 'Hà Nội', 'Cầu Giấy', 'Dịch Vọng Hậu', '144 Xuân Thủy', true),
    ('01900000-0000-7000-8000-000000000103', 'Lê Thị Cúc', '+84901000003', 'TP Hồ Chí Minh', 'Quận 1', 'Bến Nghé', '12 Lê Lợi', true);

-- ---------------------------------------------------------------- CTV
insert into affiliate.affiliates (id, user_id, phone, full_name, referral_code, status, social_link, note, reviewed_at, created_at) values
    ('01900000-0000-7000-8000-000000000201', '01900000-0000-7000-8000-000000000101', '+84901000001', 'Nguyễn Thị Hoa',
     'HWINDEMO', 'APPROVED', 'https://facebook.com/hoa.banhang', 'CTV mẫu cho demo', now() - interval '25 days', now() - interval '26 days');

insert into affiliate.referral_clicks (affiliate_id, referral_code, ip_hash, user_agent, landing_path, clicked_at)
select '01900000-0000-7000-8000-000000000201', 'HWINDEMO', md5('demo-ip-' || g), 'Mozilla/5.0 (iPhone)',
       '/p/cha-lua-truyen-thong-500g?ref=HWINDEMO', now() - (g || ' days')::interval
from generate_series(1, 12) g;

-- ---------------------------------------------------------------- đơn hàng
insert into ordering.orders (id, order_code, customer_id, referral_code, status, payment_method, payment_status,
                             subtotal, discount, shipping_fee, total,
                             recipient_name, recipient_phone, province, district, ward, street, note,
                             placed_at, confirmed_at, shipped_at, delivered_at, cancelled_at, cancel_reason, created_at)
values
    ('01900000-0000-7000-8000-000000000301', 'HWDEMO0001', '01900000-0000-7000-8000-000000000102', 'HWINDEMO',
     'DELIVERED', 'COD', 'PAID', 310000, 0, 30000, 340000,
     'Trần Văn Bình', '+84901000002', 'Hà Nội', 'Cầu Giấy', 'Dịch Vọng Hậu', '144 Xuân Thủy', 'Giao giờ hành chính',
     now() - interval '13 days', now() - interval '13 days', now() - interval '12 days', now() - interval '10 days',
     null, null, now() - interval '13 days'),
    ('01900000-0000-7000-8000-000000000302', 'HWDEMO0002', '01900000-0000-7000-8000-000000000102', null,
     'CONFIRMED', 'COD', 'UNPAID', 115000, 0, 30000, 145000,
     'Trần Văn Bình', '+84901000002', 'Hà Nội', 'Cầu Giấy', 'Dịch Vọng Hậu', '144 Xuân Thủy', null,
     now() - interval '1 day', now() - interval '20 hours', null, null, null, null, now() - interval '1 day'),
    ('01900000-0000-7000-8000-000000000303', 'HWDEMO0003', '01900000-0000-7000-8000-000000000103', null,
     'PENDING', 'BANK_QR', 'UNPAID', 299000, 0, 30000, 329000,
     'Lê Thị Cúc', '+84901000003', 'TP Hồ Chí Minh', 'Quận 1', 'Bến Nghé', '12 Lê Lợi', null,
     now() - interval '1 hour', null, null, null, null, null, now() - interval '1 hour'),
    ('01900000-0000-7000-8000-000000000304', 'HWDEMO0004', '01900000-0000-7000-8000-000000000103', null,
     'CANCELLED', 'COD', 'UNPAID', 75000, 0, 30000, 105000,
     'Lê Thị Cúc', '+84901000003', 'TP Hồ Chí Minh', 'Quận 1', 'Bến Nghé', '12 Lê Lợi', null,
     now() - interval '3 days', null, null, null, now() - interval '3 days', 'CUSTOMER_REQUEST', now() - interval '3 days');

with lines (order_id, slug, qty) as (values
    ('01900000-0000-7000-8000-000000000301'::uuid, 'cha-lua-truyen-thong-500g', 2),
    ('01900000-0000-7000-8000-000000000301'::uuid, 'gio-thu-500g', 1),
    ('01900000-0000-7000-8000-000000000302'::uuid, 'lap-xuong-tuoi-500g', 1),
    ('01900000-0000-7000-8000-000000000303'::uuid, 'combo-tet-sum-vay', 1),
    ('01900000-0000-7000-8000-000000000304'::uuid, 'nem-chua-thanh-hoa-hop-20', 1))
insert into ordering.order_items (order_id, product_id, product_name, product_slug, image_url, unit_price, quantity, line_total)
select l.order_id, p.id, p.name, p.slug, '/sample/products/' || p.slug || '.svg', p.price, l.qty, p.price * l.qty
from lines l join catalog.products p on p.slug = l.slug;

insert into ordering.order_status_histories (order_id, from_status, to_status, actor_id, note, created_at) values
    ('01900000-0000-7000-8000-000000000301', null, 'PENDING', '01900000-0000-7000-8000-000000000102', 'Đặt hàng', now() - interval '13 days'),
    ('01900000-0000-7000-8000-000000000301', 'PENDING', 'CONFIRMED', null, null, now() - interval '13 days' + interval '1 hour'),
    ('01900000-0000-7000-8000-000000000301', 'CONFIRMED', 'SHIPPING', null, null, now() - interval '12 days'),
    ('01900000-0000-7000-8000-000000000301', 'SHIPPING', 'DELIVERED', null, null, now() - interval '10 days'),
    ('01900000-0000-7000-8000-000000000302', null, 'PENDING', '01900000-0000-7000-8000-000000000102', 'Đặt hàng', now() - interval '1 day'),
    ('01900000-0000-7000-8000-000000000302', 'PENDING', 'CONFIRMED', null, null, now() - interval '20 hours'),
    ('01900000-0000-7000-8000-000000000303', null, 'PENDING', '01900000-0000-7000-8000-000000000103', 'Đặt hàng', now() - interval '1 hour'),
    ('01900000-0000-7000-8000-000000000304', null, 'PENDING', '01900000-0000-7000-8000-000000000103', 'Đặt hàng', now() - interval '3 days'),
    ('01900000-0000-7000-8000-000000000304', 'PENDING', 'CANCELLED', '01900000-0000-7000-8000-000000000103', 'Hủy: CUSTOMER_REQUEST', now() - interval '3 days' + interval '10 minutes');

-- ---------------------------------------------------------------- tồn kho (đơn 1–3 trừ kho; đơn 4 trừ rồi hoàn)
insert into catalog.stock_movements (product_id, order_id, type, quantity, created_at)
select i.product_id, i.order_id, 'DEDUCT', i.quantity, o.placed_at
from ordering.order_items i join ordering.orders o on o.id = i.order_id where o.order_code like 'HWDEMO%';
insert into catalog.stock_movements (product_id, order_id, type, quantity, created_at)
select i.product_id, i.order_id, 'RESTORE', i.quantity, o.cancelled_at
from ordering.order_items i join ordering.orders o on o.id = i.order_id where o.order_code = 'HWDEMO0004';
update catalog.products p
   set stock = p.stock - x.qty, sold_count = p.sold_count + x.qty
  from (select i.product_id, sum(i.quantity) as qty
          from ordering.order_items i join ordering.orders o on o.id = i.order_id
         where o.order_code in ('HWDEMO0001', 'HWDEMO0002', 'HWDEMO0003') group by i.product_id) x
 where p.id = x.product_id;

-- ---------------------------------------------------------------- gắn khách + hoa hồng
insert into affiliate.customer_bindings (id, customer_id, affiliate_id, first_order_id, referral_code, bound_at) values
    ('01900000-0000-7000-8000-000000000401', '01900000-0000-7000-8000-000000000102', '01900000-0000-7000-8000-000000000201',
     '01900000-0000-7000-8000-000000000301', 'HWINDEMO', now() - interval '13 days');

insert into affiliate.commissions (id, order_id, order_code, affiliate_id, customer_id, base_amount, rate, amount,
                                  status, eligible_at, approved_at, created_at) values
    ('01900000-0000-7000-8000-000000000501', '01900000-0000-7000-8000-000000000301', 'HWDEMO0001',
     '01900000-0000-7000-8000-000000000201', '01900000-0000-7000-8000-000000000102', 310000, 0.10, 31000,
     'APPROVED', now() - interval '3 days', now() - interval '3 days', now() - interval '13 days'),
    ('01900000-0000-7000-8000-000000000502', '01900000-0000-7000-8000-000000000302', 'HWDEMO0002',
     '01900000-0000-7000-8000-000000000201', '01900000-0000-7000-8000-000000000102', 115000, 0.10, 11500,
     'PENDING', null, null, now() - interval '1 day');

-- ---------------------------------------------------------------- thống kê khách (không tính đơn hủy)
insert into customer.customer_stats (customer_id, total_orders, total_spent, first_order_at, last_order_at) values
    ('01900000-0000-7000-8000-000000000101', 0, 0, null, null),
    ('01900000-0000-7000-8000-000000000102', 2, 485000, now() - interval '13 days', now() - interval '1 day'),
    ('01900000-0000-7000-8000-000000000103', 1, 329000, now() - interval '1 hour', now() - interval '1 hour');
insert into customer.customer_product_stats (customer_id, product_id, total_quantity, order_count, last_ordered_at)
select o.customer_id, i.product_id, sum(i.quantity), count(*), max(o.placed_at)
from ordering.order_items i join ordering.orders o on o.id = i.order_id
where o.order_code in ('HWDEMO0001', 'HWDEMO0002', 'HWDEMO0003')
group by o.customer_id, i.product_id;

-- ---------------------------------------------------------------- nhật ký tiền
insert into audit.audit_logs (module, aggregate_type, aggregate_id, action, actor_id, amount, detail, created_at) values
    ('affiliate', 'Affiliate', '01900000-0000-7000-8000-000000000201', 'AFFILIATE_APPROVED', null, null, '{"referralCode":"HWINDEMO","demo":true}', now() - interval '25 days'),
    ('affiliate', 'Commission', '01900000-0000-7000-8000-000000000501', 'COMMISSION_CREATED', null, 31000, '{"orderCode":"HWDEMO0001","demo":true}', now() - interval '13 days'),
    ('affiliate', 'Commission', '01900000-0000-7000-8000-000000000501', 'COMMISSION_APPROVED', null, 31000, '{"orderCode":"HWDEMO0001","demo":true}', now() - interval '3 days'),
    ('affiliate', 'Commission', '01900000-0000-7000-8000-000000000502', 'COMMISSION_CREATED', null, 11500, '{"orderCode":"HWDEMO0002","demo":true}', now() - interval '1 day');

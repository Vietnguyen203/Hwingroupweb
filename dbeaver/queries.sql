-- Câu SQL kiểm tra dữ liệu HWIN (chạy trong DBeaver: đặt con trỏ vào câu rồi Ctrl+Enter)

-- 1. Migration đã chạy
select version, description, success, installed_on
from public.flyway_schema_history order by installed_rank;

-- 2. Tài khoản + vai trò
select u.id, u.phone, u.email, u.status, string_agg(r.role, ', ') as roles, u.last_login_at, u.created_at
from identity.user_accounts u
left join identity.user_roles r on r.user_id = u.id
group by u.id order by u.id;

-- 3. Refresh token (đã thu hồi hay chưa, cùng family = cùng một lần đăng nhập)
select id, user_id, family_id, expires_at, revoked_at, replaced_by_id, created_at
from identity.refresh_tokens order by id desc limit 20;

-- 4. Danh mục + số sản phẩm đang bán
select c.id, c.name, c.slug, c.active, count(p.id) filter (where p.active) as active_products
from catalog.categories c
left join catalog.products p on p.category_id = c.id
group by c.id order by c.sort_order;

-- 5. Sản phẩm: giá, tồn kho, đã bán
select id, name, price, compare_at_price, stock, sold_count, active, bestseller
from catalog.products order by id;

-- 6. Thử tìm kiếm không dấu giống backend
select name, search_text from catalog.products
where search_text like '%' || public.f_unaccent(lower('Chả Lụa')) || '%';

-- 7. Biến động kho theo đơn (Chặng 2)
select m.order_id, p.name, m.type, m.quantity, m.created_at
from catalog.stock_movements m join catalog.products p on p.id = m.product_id
order by m.id desc limit 50;

-- 8. Event nội bộ chưa xử lý xong (completion_date null = đang chờ / lỗi)
select listener_id, event_type, publication_date, completion_date, completion_attempts, status
from public.event_publication order by publication_date desc limit 50;

-- 9. Nhật ký kiểm toán (thay đổi liên quan tới tiền)
select * from audit.audit_logs order by id desc limit 50;

-- 10. Đơn hàng mới nhất (trạng thái, thanh toán, tổng tiền, mã CTV)
select order_code, customer_id, status, payment_method, payment_status, subtotal, shipping_fee, total,
       referral_code, recipient_name, placed_at
from ordering.orders order by placed_at desc limit 30;

-- 11. Chi tiết một đơn: sản phẩm + lịch sử trạng thái (thay HW... bằng mã đơn)
select i.product_name, i.unit_price, i.quantity, i.line_total
from ordering.order_items i join ordering.orders o on o.id = i.order_id where o.order_code = 'HW...';
select h.from_status, h.to_status, h.actor_id, h.note, h.created_at
from ordering.order_status_histories h join ordering.orders o on o.id = h.order_id
where o.order_code = 'HW...' order by h.created_at;

-- 12. Số đơn và tiền theo trạng thái
select status, count(*) as so_don, sum(total) as tong_tien from ordering.orders group by status order by 2 desc;

-- 13. Giỏ hàng đang có hàng
select c.user_id, i.product_id, p.name, i.quantity
from ordering.carts c join ordering.cart_items i on i.cart_id = c.id join catalog.products p on p.id = i.product_id
order by c.user_id;

-- 14. Khách hàng + thống kê + nhóm (ngưỡng mặc định: thân thiết >= 3 đơn, lâu chưa quay lại > 60 ngày)
select c.id, c.phone, c.full_name, s.total_orders, s.total_spent, s.last_order_at,
       case when s.last_order_at < now() - interval '60 days' then 'DORMANT'
            when coalesce(s.total_orders, 0) >= 3 then 'LOYAL' else 'NEW' end as nhom
from customer.customers c left join customer.customer_stats s on s.customer_id = c.id
order by c.created_at desc;

-- 15. Sổ địa chỉ
select customer_id, recipient_name, recipient_phone, street, ward, district, province, is_default
from customer.customer_addresses order by customer_id, is_default desc;

-- 16. Sản phẩm khách hay mua
select ps.customer_id, p.name, ps.total_quantity, ps.order_count, ps.last_ordered_at
from customer.customer_product_stats ps join catalog.products p on p.id = ps.product_id
order by ps.customer_id, ps.total_quantity desc;

-- 17. CTV: trạng thái, mã, ngân hàng (đã che)
select id, full_name, phone, status, referral_code, bank_name, bank_account_no_last4, bank_changed_at, created_at
from affiliate.affiliates order by created_at desc;

-- 18. Hoa hồng theo CTV + trạng thái
select a.referral_code, c.status, count(*) as so_don, sum(c.amount) as tong_hoa_hong
from affiliate.commissions c join affiliate.affiliates a on a.id = c.affiliate_id
group by a.referral_code, c.status order by 1, 2;

-- 19. Số dư khả dụng từng CTV = hoa hồng APPROVED - rút tiền (trừ REJECTED)
select a.referral_code,
       coalesce((select sum(amount) from affiliate.commissions where affiliate_id = a.id and status = 'APPROVED'), 0)
     - coalesce((select sum(amount) from affiliate.payouts where affiliate_id = a.id and status <> 'REJECTED'), 0) as so_du
from affiliate.affiliates a where a.referral_code is not null;

-- 20. Khách đã gắn vĩnh viễn với CTV
select b.customer_id, a.referral_code, b.first_order_id, b.bound_at
from affiliate.customer_bindings b join affiliate.affiliates a on a.id = b.affiliate_id order by b.bound_at desc;

-- 21. Yêu cầu rút tiền
select p.id, a.referral_code, p.amount, p.status, p.transaction_ref, p.requested_at, p.paid_at
from affiliate.payouts p join affiliate.affiliates a on a.id = p.affiliate_id order by p.requested_at desc;

-- 22. Lượt click theo CTV (30 ngày)
select referral_code, count(*) from affiliate.referral_clicks
where clicked_at > now() - interval '30 days' group by referral_code order by 2 desc;

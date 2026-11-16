-- Mô tả bảng/cột ngay trong database (DBeaver: tab Properties / cột Comment).
-- docs/06-database.md được sinh tự động từ các mô tả này.

-- ============================== schema
comment on schema identity  is 'Bounded context identity: tài khoản, vai trò, phiên đăng nhập';
comment on schema catalog   is 'Bounded context catalog: danh mục, sản phẩm, tồn kho';
comment on schema ordering  is 'Bounded context ordering: giỏ hàng, đơn hàng';
comment on schema customer  is 'Bounded context customer: hồ sơ khách, sổ địa chỉ, thống kê (read model)';
comment on schema affiliate is 'Bounded context affiliate: cộng tác viên, hoa hồng, rút tiền (Chặng 3)';
comment on schema audit     is 'Nhật ký kiểm toán dùng chung (append-only)';

-- ============================== identity
comment on table identity.user_account is 'Tài khoản. Khách/CTV định danh bằng SĐT (đăng nhập OTP); admin bằng email/tên đăng nhập + mật khẩu BCrypt';
comment on column identity.user_account.phone is 'SĐT chuẩn hóa E.164 (+84xxxxxxxxx); null với admin';
comment on column identity.user_account.email is 'Email hoặc tên đăng nhập của admin';
comment on column identity.user_account.password_hash is 'BCrypt – chỉ admin có';
comment on column identity.user_account.status is 'ACTIVE | LOCKED';
comment on column identity.user_account.version is 'Optimistic locking';
comment on table identity.user_role is 'Vai trò của tài khoản (nhiều-nhiều): CUSTOMER | AFFILIATE | ADMIN';
comment on table identity.refresh_token is 'Refresh token (lưu hash SHA-256). Xoay vòng mỗi lần dùng; dùng lại token đã thu hồi -> thu hồi cả family';
comment on column identity.refresh_token.token_hash is 'SHA-256 của token – không lưu token gốc';
comment on column identity.refresh_token.family_id is 'Chuỗi token sinh ra từ cùng một lần đăng nhập';
comment on column identity.refresh_token.replaced_by_id is 'Token kế tiếp sau khi xoay vòng';
comment on column identity.refresh_token.ip_hash is 'SHA-256 của IP – không lưu IP gốc';

-- ============================== catalog
comment on table catalog.category is 'Danh mục sản phẩm (menu icon trang chủ)';
comment on column catalog.category.active is 'false = ẩn (không xóa cứng)';
comment on table catalog.product is 'Sản phẩm – không có biến thể (1 sản phẩm = 1 giá). Tiền tính bằng VND';
comment on column catalog.product.category_id is 'Danh mục (cùng schema – có FK)';
comment on column catalog.product.price is 'Giá bán (VND)';
comment on column catalog.product.compare_at_price is 'Giá gốc để gạch ngang; null nếu không giảm giá';
comment on column catalog.product.stock is 'Tồn kho hiện tại – trừ khi đặt hàng, hoàn khi hủy/trả';
comment on column catalog.product.sold_count is 'Số lượng đã bán – dùng sắp xếp "bán chạy"';
comment on column catalog.product.bestseller is 'Cờ hiển thị khối Bán chạy';
comment on column catalog.product.manufacturer is 'Nhà sản xuất (NSX)';
comment on column catalog.product.shelf_life is 'Hạn sử dụng / thời hạn sử dụng';
comment on column catalog.product.storage_instructions is 'Hướng dẫn bảo quản';
comment on column catalog.product.declaration_number is 'Số giấy tự công bố sản phẩm';
comment on column catalog.product.food_safety_cert_number is 'Số giấy chứng nhận cơ sở đủ điều kiện ATTP';
comment on column catalog.product.search_text is 'Tự sinh: f_unaccent(lower(tên + mô tả ngắn)) – tìm kiếm không dấu';
comment on table catalog.product_image is 'Ảnh sản phẩm (thuộc aggregate Product)';
comment on table catalog.stock_movement is 'Nhật ký trừ/hoàn kho theo đơn. Unique (order_id, product_id, type) giúp xử lý event idempotent';
comment on column catalog.stock_movement.order_id is 'ID đơn bên ordering.orders – chỉ lưu ID, không FK xuyên schema';
comment on column catalog.stock_movement.type is 'DEDUCT (trừ khi đặt) | RESTORE (hoàn khi hủy/trả)';

-- ============================== ordering
comment on table ordering.cart is 'Giỏ hàng lưu server – mỗi user một giỏ';
comment on column ordering.cart.user_id is 'ID tài khoản (identity) – không FK xuyên schema';
comment on table ordering.cart_item is 'Dòng giỏ hàng: chỉ productId + số lượng, giá luôn lấy mới từ catalog';
comment on table ordering.orders is 'Đơn hàng (aggregate root). Vòng đời: PENDING > CONFIRMED > SHIPPING > DELIVERED > COMPLETED; CANCELLED; RETURNED';
comment on column ordering.orders.order_code is 'Mã đơn hiển thị cho khách: HW + yyMMdd + 4 ký tự ngẫu nhiên';
comment on column ordering.orders.customer_id is 'ID khách (= id tài khoản) – không FK xuyên schema';
comment on column ordering.orders.referral_code is 'Mã CTV đọc từ cookie hwin_ref lúc đặt hàng';
comment on column ordering.orders.payment_method is 'COD | BANK_QR (chuyển khoản VietQR, admin xác nhận)';
comment on column ordering.orders.payment_status is 'UNPAID | PAID (COD tự PAID khi giao thành công)';
comment on column ordering.orders.subtotal is 'Tạm tính = Σ đơn giá x số lượng (VND)';
comment on column ordering.orders.discount is 'Giảm giá – demo luôn 0';
comment on column ordering.orders.total is 'Tổng thanh toán = subtotal - discount + shipping_fee';
comment on column ordering.orders.recipient_name is 'Địa chỉ giao (bản chụp lúc đặt, không phụ thuộc sổ địa chỉ)';
comment on column ordering.orders.vat_requested is 'Khách có yêu cầu xuất hóa đơn VAT';
comment on column ordering.orders.payment_ref is 'Mã giao dịch chuyển khoản admin nhập khi xác nhận đã nhận tiền';
comment on table ordering.order_item is 'Dòng đơn – chụp lại tên và giá tại thời điểm đặt';
comment on column ordering.order_item.product_id is 'ID sản phẩm bên catalog – không FK xuyên schema';
comment on table ordering.order_status_history is 'Lịch sử chuyển trạng thái đơn (ai, lúc nào, ghi chú)';
comment on column ordering.order_status_history.actor_id is 'Người thực hiện (id tài khoản); null = hệ thống/job';

-- ============================== customer
comment on table customer.customer is 'Hồ sơ khách. id = identity.user_account.id (tạo khi nhận event UserRegistered)';
comment on table customer.customer_address is 'Sổ địa chỉ (tối đa 10, đúng 1 địa chỉ mặc định)';
comment on table customer.customer_stats is 'Read model: thống kê mua hàng, cập nhật từ event ordering (không tính đơn hủy/trả)';
comment on column customer.customer_stats.last_order_at is 'Dùng phân nhóm "lâu chưa quay lại"';
comment on table customer.customer_product_stat is 'Read model: khách đã mua sản phẩm nào bao nhiêu – "Sản phẩm bạn hay mua"';
comment on table customer.processed_event is 'Event đã xử lý theo từng listener – chống cập nhật trùng khi event phát lại';

-- ============================== audit / public
comment on table audit.audit_log is 'Nhật ký thay đổi liên quan tới tiền. Chỉ INSERT – trigger chặn UPDATE/DELETE';
comment on table public.event_publication is 'Spring Modulith: event nội bộ giữa các module; completion_date null = chưa xử lý xong (sẽ phát lại)';

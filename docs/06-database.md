# 06 – Database (sinh tự động)

> **Không sửa tay file này.** Sinh từ database đang chạy bằng `python docs/tools/gen_db_doc.py`.
> Mô tả bảng/cột lấy từ `COMMENT` trong DB (migration `V2_9_0__table_comments.sql`) – xem được trong DBeaver.

## Quy ước

- Mỗi bounded context một **schema**; **không có foreign key xuyên schema** – cột tham chiếu module khác chỉ lưu ID.
- Tiền: `bigint` VND. Thời gian: `timestamptz` (UTC). Aggregate root có `version` (optimistic locking), `created_at`, `updated_at`.
- Migration Flyway đặt theo module: `backend/src/main/resources/db/migration/<module>/V<chặng>_<thứ tự>_<lần sửa>__<mô tả>.sql`.
  Không sửa migration đã chạy – muốn đổi cấu trúc thì thêm file mới với version lớn hơn.

## Tổng quan

| Schema | Bảng | Mô tả |
|---|---|---|
| `identity` | [`refresh_tokens`](#identityrefresh_tokens) | Refresh token (lưu hash SHA-256). Xoay vòng mỗi lần dùng; dùng lại token đã thu hồi -> thu hồi cả family |
| `identity` | [`user_accounts`](#identityuser_accounts) | Tài khoản. Khách/CTV định danh bằng SĐT (đăng nhập OTP); admin bằng email/tên đăng nhập + mật khẩu BCrypt |
| `identity` | [`user_roles`](#identityuser_roles) | Vai trò của tài khoản (nhiều-nhiều): CUSTOMER \| AFFILIATE \| ADMIN |
| `catalog` | [`categories`](#catalogcategories) | Danh mục sản phẩm (menu icon trang chủ) |
| `catalog` | [`product_images`](#catalogproduct_images) | Ảnh sản phẩm (thuộc aggregate Product) |
| `catalog` | [`products`](#catalogproducts) | Sản phẩm – không có biến thể (1 sản phẩm = 1 giá). Tiền tính bằng VND |
| `catalog` | [`stock_movements`](#catalogstock_movements) | Nhật ký trừ/hoàn kho theo đơn. Unique (order_id, product_id, type) giúp xử lý event idempotent |
| `ordering` | [`cart_items`](#orderingcart_items) | Dòng giỏ hàng: chỉ productId + số lượng, giá luôn lấy mới từ catalog |
| `ordering` | [`carts`](#orderingcarts) | Giỏ hàng lưu server – mỗi user một giỏ |
| `ordering` | [`order_items`](#orderingorder_items) | Dòng đơn – chụp lại tên và giá tại thời điểm đặt |
| `ordering` | [`order_status_histories`](#orderingorder_status_histories) | Lịch sử chuyển trạng thái đơn (ai, lúc nào, ghi chú) |
| `ordering` | [`orders`](#orderingorders) | Đơn hàng (aggregate root). Vòng đời: PENDING > CONFIRMED > SHIPPING > DELIVERED > COMPLETED; CANCELLED; RETURNED |
| `customer` | [`customer_addresses`](#customercustomer_addresses) | Sổ địa chỉ (tối đa 10, đúng 1 địa chỉ mặc định) |
| `customer` | [`customer_product_stats`](#customercustomer_product_stats) | Read model: khách đã mua sản phẩm nào bao nhiêu – "Sản phẩm bạn hay mua" |
| `customer` | [`customer_stats`](#customercustomer_stats) | Read model: thống kê mua hàng, cập nhật từ event ordering (không tính đơn hủy/trả) |
| `customer` | [`customers`](#customercustomers) | Hồ sơ khách. id = identity.user_accounts.id (tạo khi nhận event UserRegistered) |
| `customer` | [`processed_events`](#customerprocessed_events) | Event đã xử lý theo từng listener – chống cập nhật trùng khi event phát lại |
| `affiliate` | [`affiliates`](#affiliateaffiliates) | Cộng tác viên (CTV). PENDING -> APPROVED / REJECTED; APPROVED <-> SUSPENDED. Chỉ APPROVED có link hoạt động |
| `affiliate` | [`commissions`](#affiliatecommissions) | Hoa hồng: rate x (subtotal - discount), không tính phí ship, 1 cấp. PENDING -> APPROVED (giao + 7 ngày) / CANCELLED (hủy, trả hàng) |
| `affiliate` | [`customer_bindings`](#affiliatecustomer_bindings) | Gắn khách vĩnh viễn (first-touch): đơn đầu tiên có ref hợp lệ -> mọi đơn sau của khách tính hoa hồng cho CTV này |
| `affiliate` | [`payouts`](#affiliatepayouts) | Yêu cầu rút tiền: REQUESTED -> APPROVED -> PAID; REJECTED (tiền tự trở lại số dư). Tối thiểu 200.000đ |
| `affiliate` | [`referral_clicks`](#affiliatereferral_clicks) | Lượt click link CTV. Không đếm trùng cùng IP + mã trong 24 giờ (Redis) |
| `audit` | [`audit_logs`](#auditaudit_logs) | Nhật ký thay đổi liên quan tới tiền. Chỉ INSERT – trigger chặn UPDATE/DELETE |
| `public` | [`event_publication`](#publicevent_publication) | Spring Modulith: event nội bộ giữa các module; completion_date null = chưa xử lý xong (sẽ phát lại) |

## Schema `identity`



### identity.refresh_tokens

Refresh token (lưu hash SHA-256). Xoay vòng mỗi lần dùng; dùng lại token đã thu hồi -> thu hồi cả family

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| user_id | `uuid` |  |  |  |
| token_hash | `character varying(64)` |  |  | SHA-256 của token – không lưu token gốc |
| family_id | `uuid` |  |  | Chuỗi token sinh ra từ cùng một lần đăng nhập |
| expires_at | `timestamp with time zone` |  |  |  |
| revoked_at | `timestamp with time zone` | ✓ |  |  |
| replaced_by_id | `uuid` | ✓ |  | Token kế tiếp sau khi xoay vòng |
| user_agent | `character varying(255)` | ✓ |  |  |
| ip_hash | `character varying(64)` | ✓ |  | SHA-256 của IP – không lưu IP gốc |
| created_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `refresh_tokens_user_id_fkey` – FOREIGN KEY `FOREIGN KEY (user_id) REFERENCES identity.user_accounts(id) ON DELETE CASCADE`
- `refresh_tokens_token_hash_key` – UNIQUE `UNIQUE (token_hash)`

Index:

- `idx_refresh_token_family` – `btree (family_id)`
- `idx_refresh_token_user` – `btree (user_id)`

### identity.user_accounts

Tài khoản. Khách/CTV định danh bằng SĐT (đăng nhập OTP); admin bằng email/tên đăng nhập + mật khẩu BCrypt

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| phone | `character varying(16)` | ✓ |  | SĐT chuẩn hóa E.164 (+84xxxxxxxxx); null với admin |
| email | `character varying(255)` | ✓ |  | Email hoặc tên đăng nhập của admin |
| password_hash | `character varying(100)` | ✓ |  | BCrypt – chỉ admin có |
| full_name | `character varying(100)` | ✓ |  |  |
| status | `character varying(16)` |  |  | ACTIVE \| LOCKED |
| last_login_at | `timestamp with time zone` | ✓ |  |  |
| version | `bigint` |  | 0 | Optimistic locking |
| created_at | `timestamp with time zone` |  | now() |  |
| updated_at | `timestamp with time zone` |  | now() |  |
| otp_exempt | `boolean` |  | false | true = đăng nhập admin không cần OTP. CHỈ dành cho tài khoản dev admin/admin; môi trường thật không cho phép |

Ràng buộc:

- `ck_user_account_identifier` – CHECK `CHECK (((phone IS NOT NULL) OR (email IS NOT NULL)))`
- `user_accounts_status_check` – CHECK `CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'LOCKED'::character varying])::text[])))`
- `user_accounts_email_key` – UNIQUE `UNIQUE (email)`
- `user_accounts_phone_key` – UNIQUE `UNIQUE (phone)`

### identity.user_roles

Vai trò của tài khoản (nhiều-nhiều): CUSTOMER \| AFFILIATE \| ADMIN

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **user_id** 🔑 | `uuid` |  |  |  |
| **role** 🔑 | `character varying(16)` |  |  |  |

Ràng buộc:

- `user_roles_role_check` – CHECK `CHECK (((role)::text = ANY ((ARRAY['CUSTOMER'::character varying, 'AFFILIATE'::character varying, 'ADMIN'::character varying])::text[])))`
- `user_roles_user_id_fkey` – FOREIGN KEY `FOREIGN KEY (user_id) REFERENCES identity.user_accounts(id) ON DELETE CASCADE`

## Schema `catalog`



### catalog.categories

Danh mục sản phẩm (menu icon trang chủ)

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| name | `character varying(100)` |  |  |  |
| slug | `character varying(120)` |  |  |  |
| icon_url | `character varying(500)` | ✓ |  |  |
| sort_order | `integer` |  | 0 |  |
| active | `boolean` |  | true | false = ẩn (không xóa cứng) |
| version | `bigint` |  | 0 |  |
| created_at | `timestamp with time zone` |  | now() |  |
| updated_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `categories_slug_key` – UNIQUE `UNIQUE (slug)`

### catalog.product_images

Ảnh sản phẩm (thuộc aggregate Product)

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| product_id | `uuid` |  |  |  |
| url | `character varying(500)` |  |  |  |
| sort_order | `integer` |  | 0 |  |

Ràng buộc:

- `product_images_product_id_fkey` – FOREIGN KEY `FOREIGN KEY (product_id) REFERENCES catalog.products(id) ON DELETE CASCADE`

Index:

- `idx_product_image_product` – `btree (product_id)`

### catalog.products

Sản phẩm – không có biến thể (1 sản phẩm = 1 giá). Tiền tính bằng VND

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| category_id | `uuid` |  |  | Danh mục (cùng schema – có FK) |
| name | `character varying(200)` |  |  |  |
| slug | `character varying(220)` |  |  |  |
| price | `bigint` |  |  | Giá bán (VND) |
| compare_at_price | `bigint` | ✓ |  | Giá gốc để gạch ngang; null nếu không giảm giá |
| short_description | `character varying(500)` | ✓ |  |  |
| description | `text` | ✓ |  |  |
| unit | `character varying(50)` | ✓ |  |  |
| stock | `integer` |  | 0 | Tồn kho hiện tại – trừ khi đặt hàng, hoàn khi hủy/trả |
| active | `boolean` |  | true |  |
| bestseller | `boolean` |  | false | Cờ hiển thị khối Bán chạy |
| sold_count | `integer` |  | 0 | Số lượng đã bán – dùng sắp xếp "bán chạy" |
| manufacturer | `character varying(200)` | ✓ |  | Nhà sản xuất (NSX) |
| shelf_life | `character varying(100)` | ✓ |  | Hạn sử dụng / thời hạn sử dụng |
| storage_instructions | `character varying(1000)` | ✓ |  | Hướng dẫn bảo quản |
| declaration_number | `character varying(100)` | ✓ |  | Số giấy tự công bố sản phẩm |
| food_safety_cert_number | `character varying(100)` | ✓ |  | Số giấy chứng nhận cơ sở đủ điều kiện ATTP |
| food_safety_cert_url | `character varying(500)` | ✓ |  |  |
| search_text | `text` | ✓ | _generated_ | Tự sinh: f_unaccent(lower(tên + mô tả ngắn)) – tìm kiếm không dấu |
| version | `bigint` |  | 0 |  |
| created_at | `timestamp with time zone` |  | now() |  |
| updated_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `products_compare_at_price_check` – CHECK `CHECK (((compare_at_price IS NULL) OR (compare_at_price >= 0)))`
- `products_price_check` – CHECK `CHECK ((price >= 0))`
- `products_stock_check` – CHECK `CHECK ((stock >= 0))`
- `products_category_id_fkey` – FOREIGN KEY `FOREIGN KEY (category_id) REFERENCES catalog.categories(id)`
- `products_slug_key` – UNIQUE `UNIQUE (slug)`

Index:

- `idx_product_bestseller` – `btree (bestseller) WHERE active`
- `idx_product_category_active` – `btree (category_id, active)`
- `idx_product_search_trgm` – `gin (search_text gin_trgm_ops)`

### catalog.stock_movements

Nhật ký trừ/hoàn kho theo đơn. Unique (order_id, product_id, type) giúp xử lý event idempotent

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| product_id | `uuid` |  |  |  |
| order_id | `uuid` |  |  | ID đơn bên ordering.orders – chỉ lưu ID, không FK xuyên schema |
| type | `character varying(16)` |  |  | DEDUCT (trừ khi đặt) \| RESTORE (hoàn khi hủy/trả) |
| quantity | `integer` |  |  |  |
| created_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `stock_movements_quantity_check` – CHECK `CHECK ((quantity > 0))`
- `stock_movements_type_check` – CHECK `CHECK (((type)::text = ANY ((ARRAY['DEDUCT'::character varying, 'RESTORE'::character varying])::text[])))`
- `stock_movements_product_id_fkey` – FOREIGN KEY `FOREIGN KEY (product_id) REFERENCES catalog.products(id)`
- `uq_stock_movement` – UNIQUE `UNIQUE (order_id, product_id, type)`

Index:

- `idx_stock_movement_order` – `btree (order_id)`

## Schema `ordering`



### ordering.cart_items

Dòng giỏ hàng: chỉ productId + số lượng, giá luôn lấy mới từ catalog

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| cart_id | `uuid` |  |  |  |
| product_id | `uuid` |  |  |  |
| quantity | `integer` |  |  |  |
| added_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `cart_items_quantity_check` – CHECK `CHECK (((quantity >= 1) AND (quantity <= 99)))`
- `cart_items_cart_id_fkey` – FOREIGN KEY `FOREIGN KEY (cart_id) REFERENCES ordering.carts(id) ON DELETE CASCADE`
- `uq_cart_item` – UNIQUE `UNIQUE (cart_id, product_id)`

### ordering.carts

Giỏ hàng lưu server – mỗi user một giỏ

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| user_id | `uuid` |  |  | ID tài khoản (identity) – không FK xuyên schema |
| version | `bigint` |  | 0 |  |
| created_at | `timestamp with time zone` |  | now() |  |
| updated_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `carts_user_id_key` – UNIQUE `UNIQUE (user_id)`

### ordering.order_items

Dòng đơn – chụp lại tên và giá tại thời điểm đặt

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| order_id | `uuid` |  |  |  |
| product_id | `uuid` |  |  | ID sản phẩm bên catalog – không FK xuyên schema |
| product_name | `character varying(200)` |  |  |  |
| product_slug | `character varying(220)` |  |  |  |
| image_url | `character varying(500)` | ✓ |  |  |
| unit_price | `bigint` |  |  |  |
| quantity | `integer` |  |  |  |
| line_total | `bigint` |  |  |  |

Ràng buộc:

- `order_items_line_total_check` – CHECK `CHECK ((line_total >= 0))`
- `order_items_quantity_check` – CHECK `CHECK ((quantity > 0))`
- `order_items_unit_price_check` – CHECK `CHECK ((unit_price >= 0))`
- `order_items_order_id_fkey` – FOREIGN KEY `FOREIGN KEY (order_id) REFERENCES ordering.orders(id) ON DELETE CASCADE`

Index:

- `idx_order_item_order` – `btree (order_id)`

### ordering.order_status_histories

Lịch sử chuyển trạng thái đơn (ai, lúc nào, ghi chú)

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| order_id | `uuid` |  |  |  |
| from_status | `character varying(16)` | ✓ |  |  |
| to_status | `character varying(16)` |  |  |  |
| actor_id | `uuid` | ✓ |  | Người thực hiện (id tài khoản); null = hệ thống/job |
| note | `character varying(255)` | ✓ |  |  |
| created_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `order_status_histories_order_id_fkey` – FOREIGN KEY `FOREIGN KEY (order_id) REFERENCES ordering.orders(id) ON DELETE CASCADE`

Index:

- `idx_order_status_history_order` – `btree (order_id)`

### ordering.orders

Đơn hàng (aggregate root). Vòng đời: PENDING > CONFIRMED > SHIPPING > DELIVERED > COMPLETED; CANCELLED; RETURNED

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| order_code | `character varying(20)` |  |  | Mã đơn hiển thị cho khách: HW + yyMMdd + 4 ký tự ngẫu nhiên |
| customer_id | `uuid` |  |  | ID khách (= id tài khoản) – không FK xuyên schema |
| referral_code | `character varying(16)` | ✓ |  | Mã CTV đọc từ cookie hwin_ref lúc đặt hàng |
| status | `character varying(16)` |  |  |  |
| payment_method | `character varying(16)` |  |  | COD \| BANK_QR (chuyển khoản VietQR, admin xác nhận) |
| payment_status | `character varying(16)` |  |  | UNPAID \| PAID (COD tự PAID khi giao thành công) |
| subtotal | `bigint` |  |  | Tạm tính = Σ đơn giá x số lượng (VND) |
| discount | `bigint` |  | 0 | Giảm giá – demo luôn 0 |
| shipping_fee | `bigint` |  |  |  |
| total | `bigint` |  |  | Tổng thanh toán = subtotal - discount + shipping_fee |
| recipient_name | `character varying(100)` |  |  | Địa chỉ giao (bản chụp lúc đặt, không phụ thuộc sổ địa chỉ) |
| recipient_phone | `character varying(16)` |  |  |  |
| province | `character varying(100)` |  |  |  |
| district | `character varying(100)` |  |  |  |
| ward | `character varying(100)` |  |  |  |
| street | `character varying(255)` |  |  |  |
| note | `character varying(500)` | ✓ |  |  |
| vat_requested | `boolean` |  | false | Khách có yêu cầu xuất hóa đơn VAT |
| vat_company_name | `character varying(255)` | ✓ |  |  |
| vat_tax_code | `character varying(20)` | ✓ |  |  |
| vat_address | `character varying(500)` | ✓ |  |  |
| vat_email | `character varying(255)` | ✓ |  |  |
| cancel_reason | `character varying(32)` | ✓ |  |  |
| payment_ref | `character varying(100)` | ✓ |  | Mã giao dịch chuyển khoản admin nhập khi xác nhận đã nhận tiền |
| placed_at | `timestamp with time zone` |  |  |  |
| confirmed_at | `timestamp with time zone` | ✓ |  |  |
| shipped_at | `timestamp with time zone` | ✓ |  |  |
| delivered_at | `timestamp with time zone` | ✓ |  |  |
| completed_at | `timestamp with time zone` | ✓ |  |  |
| cancelled_at | `timestamp with time zone` | ✓ |  |  |
| returned_at | `timestamp with time zone` | ✓ |  |  |
| version | `bigint` |  | 0 |  |
| created_at | `timestamp with time zone` |  | now() |  |
| updated_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `ck_orders_total` – CHECK `CHECK ((total = ((subtotal - discount) + shipping_fee)))`
- `orders_discount_check` – CHECK `CHECK ((discount >= 0))`
- `orders_payment_method_check` – CHECK `CHECK (((payment_method)::text = ANY ((ARRAY['COD'::character varying, 'BANK_QR'::character varying])::text[])))`
- `orders_payment_status_check` – CHECK `CHECK (((payment_status)::text = ANY ((ARRAY['UNPAID'::character varying, 'PAID'::character varying])::text[])))`
- `orders_shipping_fee_check` – CHECK `CHECK ((shipping_fee >= 0))`
- `orders_status_check` – CHECK `CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'SHIPPING'::character varying, 'DELIVERED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying, 'RETURNED'::character varying])::text[])))`
- `orders_subtotal_check` – CHECK `CHECK ((subtotal >= 0))`
- `orders_total_check` – CHECK `CHECK ((total >= 0))`
- `orders_order_code_key` – UNIQUE `UNIQUE (order_code)`

Index:

- `idx_orders_customer` – `btree (customer_id, placed_at DESC)`
- `idx_orders_status` – `btree (status, placed_at)`

## Schema `customer`



### customer.customer_addresses

Sổ địa chỉ (tối đa 10, đúng 1 địa chỉ mặc định)

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| customer_id | `uuid` |  |  |  |
| recipient_name | `character varying(100)` |  |  |  |
| recipient_phone | `character varying(16)` |  |  |  |
| province | `character varying(100)` |  |  |  |
| district | `character varying(100)` |  |  |  |
| ward | `character varying(100)` |  |  |  |
| street | `character varying(255)` |  |  |  |
| is_default | `boolean` |  | false |  |
| created_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `customer_addresses_customer_id_fkey` – FOREIGN KEY `FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE`

Index:

- `idx_customer_address_customer` – `btree (customer_id)`

### customer.customer_product_stats

Read model: khách đã mua sản phẩm nào bao nhiêu – "Sản phẩm bạn hay mua"

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **customer_id** 🔑 | `uuid` |  |  |  |
| **product_id** 🔑 | `uuid` |  |  |  |
| total_quantity | `integer` |  | 0 |  |
| order_count | `integer` |  | 0 |  |
| last_ordered_at | `timestamp with time zone` | ✓ |  |  |

Ràng buộc:

- `customer_product_stats_customer_id_fkey` – FOREIGN KEY `FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE`

### customer.customer_stats

Read model: thống kê mua hàng, cập nhật từ event ordering (không tính đơn hủy/trả)

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **customer_id** 🔑 | `uuid` |  |  |  |
| total_orders | `integer` |  | 0 |  |
| total_spent | `bigint` |  | 0 |  |
| first_order_at | `timestamp with time zone` | ✓ |  |  |
| last_order_at | `timestamp with time zone` | ✓ |  | Dùng phân nhóm "lâu chưa quay lại" |
| updated_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `customer_stats_customer_id_fkey` – FOREIGN KEY `FOREIGN KEY (customer_id) REFERENCES customer.customers(id) ON DELETE CASCADE`

Index:

- `idx_customer_stats_last_order` – `btree (last_order_at)`

### customer.customers

Hồ sơ khách. id = identity.user_accounts.id (tạo khi nhận event UserRegistered)

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  |  |  |
| phone | `character varying(16)` | ✓ |  | SĐT đăng nhập (+84...) – null nếu khách đăng nhập bằng email |
| full_name | `character varying(100)` | ✓ |  |  |
| version | `bigint` |  | 0 |  |
| created_at | `timestamp with time zone` |  | now() |  |
| updated_at | `timestamp with time zone` |  | now() |  |
| email | `character varying(255)` | ✓ |  | Email đăng nhập (chữ thường) – null nếu khách đăng nhập bằng SĐT |

Ràng buộc:

- `ck_customer_contact` – CHECK `CHECK (((phone IS NOT NULL) OR (email IS NOT NULL)))`
- `customers_email_key` – UNIQUE `UNIQUE (email)`
- `customers_phone_key` – UNIQUE `UNIQUE (phone)`

### customer.processed_events

Event đã xử lý theo từng listener – chống cập nhật trùng khi event phát lại

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **event_id** 🔑 | `uuid` |  |  |  |
| **listener** 🔑 | `character varying(100)` |  |  |  |
| processed_at | `timestamp with time zone` |  | now() |  |

## Schema `affiliate`



### affiliate.affiliates

Cộng tác viên (CTV). PENDING -> APPROVED / REJECTED; APPROVED <-> SUSPENDED. Chỉ APPROVED có link hoạt động

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| user_id | `uuid` |  |  | Tài khoản identity của CTV (một người vừa là khách vừa là CTV) |
| phone | `character varying(16)` |  |  | SĐT của CTV (bản chụp) – dùng chặn tự giới thiệu |
| full_name | `character varying(100)` |  |  |  |
| referral_code | `character varying(16)` | ✓ |  | Mã giới thiệu duy nhất, sinh khi được duyệt. Link: /?ref=CODE hoặc /p/slug?ref=CODE |
| status | `character varying(16)` |  |  |  |
| social_link | `character varying(500)` | ✓ |  |  |
| note | `character varying(1000)` | ✓ |  |  |
| bank_name | `character varying(100)` | ✓ |  |  |
| bank_account_no_enc | `character varying(255)` | ✓ |  | Số tài khoản – mã hóa AES-GCM (khóa AFFILIATE_BANK_KEY) |
| bank_account_holder_enc | `character varying(255)` | ✓ |  | Chủ tài khoản – mã hóa AES-GCM |
| bank_account_no_last4 | `character varying(4)` | ✓ |  | 4 số cuối để hiển thị ****1234 |
| bank_changed_at | `timestamp with time zone` | ✓ |  | Lần đổi tài khoản ngân hàng gần nhất – khóa rút tiền 48 giờ sau khi đổi (lần thiết lập đầu tiên không khóa) |
| reviewed_by | `uuid` | ✓ |  |  |
| reviewed_at | `timestamp with time zone` | ✓ |  |  |
| status_reason | `character varying(500)` | ✓ |  | Lý do từ chối / tạm khóa |
| version | `bigint` |  | 0 |  |
| created_at | `timestamp with time zone` |  | now() |  |
| updated_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `affiliates_status_check` – CHECK `CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'SUSPENDED'::character varying])::text[])))`
- `affiliates_referral_code_key` – UNIQUE `UNIQUE (referral_code)`
- `affiliates_user_id_key` – UNIQUE `UNIQUE (user_id)`

Index:

- `idx_affiliate_status` – `btree (status, created_at DESC)`

### affiliate.commissions

Hoa hồng: rate x (subtotal - discount), không tính phí ship, 1 cấp. PENDING -> APPROVED (giao + 7 ngày) / CANCELLED (hủy, trả hàng)

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| order_id | `uuid` |  |  |  |
| order_code | `character varying(20)` |  |  |  |
| affiliate_id | `uuid` |  |  |  |
| customer_id | `uuid` |  |  |  |
| base_amount | `bigint` |  |  | Cơ sở tính = subtotal - discount (VND) |
| rate | `numeric(5,4)` |  |  |  |
| amount | `bigint` |  |  | floor(base_amount x rate) (VND) |
| status | `character varying(16)` |  |  |  |
| eligible_at | `timestamp with time zone` | ✓ |  | Thời điểm được duyệt = ngày giao + hold-days; null khi đơn chưa giao |
| approved_at | `timestamp with time zone` | ✓ |  |  |
| cancelled_at | `timestamp with time zone` | ✓ |  |  |
| version | `bigint` |  | 0 |  |
| created_at | `timestamp with time zone` |  | now() |  |
| updated_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `commissions_amount_check` – CHECK `CHECK ((amount >= 0))`
- `commissions_base_amount_check` – CHECK `CHECK ((base_amount >= 0))`
- `commissions_rate_check` – CHECK `CHECK (((rate >= (0)::numeric) AND (rate <= (1)::numeric)))`
- `commissions_status_check` – CHECK `CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'CANCELLED'::character varying])::text[])))`
- `commissions_affiliate_id_fkey` – FOREIGN KEY `FOREIGN KEY (affiliate_id) REFERENCES affiliate.affiliates(id)`
- `commissions_order_id_key` – UNIQUE `UNIQUE (order_id)`

Index:

- `idx_commission_affiliate` – `btree (affiliate_id, created_at DESC)`
- `idx_commission_status_eligible` – `btree (status, eligible_at)`

### affiliate.customer_bindings

Gắn khách vĩnh viễn (first-touch): đơn đầu tiên có ref hợp lệ -> mọi đơn sau của khách tính hoa hồng cho CTV này

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| customer_id | `uuid` |  |  |  |
| affiliate_id | `uuid` |  |  |  |
| first_order_id | `uuid` |  |  |  |
| referral_code | `character varying(16)` |  |  |  |
| bound_at | `timestamp with time zone` |  |  |  |

Ràng buộc:

- `customer_bindings_affiliate_id_fkey` – FOREIGN KEY `FOREIGN KEY (affiliate_id) REFERENCES affiliate.affiliates(id)`
- `customer_bindings_customer_id_key` – UNIQUE `UNIQUE (customer_id)`

Index:

- `idx_customer_binding_affiliate` – `btree (affiliate_id)`

### affiliate.payouts

Yêu cầu rút tiền: REQUESTED -> APPROVED -> PAID; REJECTED (tiền tự trở lại số dư). Tối thiểu 200.000đ

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| affiliate_id | `uuid` |  |  |  |
| amount | `bigint` |  |  |  |
| status | `character varying(16)` |  |  |  |
| bank_name | `character varying(100)` |  |  |  |
| bank_account_no_enc | `character varying(255)` |  |  | Bản chụp tài khoản nhận tiền tại thời điểm yêu cầu (mã hóa) |
| bank_account_holder_enc | `character varying(255)` |  |  |  |
| transaction_ref | `character varying(100)` | ✓ |  | Mã giao dịch chuyển khoản admin nhập khi chi trả |
| reject_reason | `character varying(500)` | ✓ |  |  |
| processed_by | `uuid` | ✓ |  |  |
| requested_at | `timestamp with time zone` |  |  |  |
| approved_at | `timestamp with time zone` | ✓ |  |  |
| paid_at | `timestamp with time zone` | ✓ |  |  |
| rejected_at | `timestamp with time zone` | ✓ |  |  |
| version | `bigint` |  | 0 |  |
| created_at | `timestamp with time zone` |  | now() |  |
| updated_at | `timestamp with time zone` |  | now() |  |

Ràng buộc:

- `payouts_amount_check` – CHECK `CHECK ((amount > 0))`
- `payouts_status_check` – CHECK `CHECK (((status)::text = ANY ((ARRAY['REQUESTED'::character varying, 'APPROVED'::character varying, 'PAID'::character varying, 'REJECTED'::character varying])::text[])))`
- `payouts_affiliate_id_fkey` – FOREIGN KEY `FOREIGN KEY (affiliate_id) REFERENCES affiliate.affiliates(id)`

Index:

- `idx_payout_affiliate` – `btree (affiliate_id, requested_at DESC)`
- `idx_payout_status` – `btree (status, requested_at)`
- `uq_payout_open` – `btree (affiliate_id) WHERE ((status)::text = ANY ((ARRAY['REQUESTED'::character varying, 'APPROVED'::character varying])::text[]))`

### affiliate.referral_clicks

Lượt click link CTV. Không đếm trùng cùng IP + mã trong 24 giờ (Redis)

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| affiliate_id | `uuid` |  |  |  |
| referral_code | `character varying(16)` |  |  |  |
| ip_hash | `character varying(64)` |  |  | SHA-256 của IP – không lưu IP gốc |
| user_agent | `character varying(255)` | ✓ |  |  |
| landing_path | `character varying(500)` | ✓ |  |  |
| clicked_at | `timestamp with time zone` |  |  |  |

Ràng buộc:

- `referral_clicks_affiliate_id_fkey` – FOREIGN KEY `FOREIGN KEY (affiliate_id) REFERENCES affiliate.affiliates(id)`

Index:

- `idx_referral_click_affiliate_time` – `btree (affiliate_id, clicked_at)`

## Schema `audit`



### audit.audit_logs

Nhật ký thay đổi liên quan tới tiền. Chỉ INSERT – trigger chặn UPDATE/DELETE

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  | uuid_generate_v7() |  |
| module | `character varying(32)` |  |  |  |
| aggregate_type | `character varying(64)` |  |  |  |
| aggregate_id | `character varying(64)` |  |  |  |
| action | `character varying(64)` |  |  |  |
| actor_id | `uuid` | ✓ |  |  |
| amount | `bigint` | ✓ |  |  |
| detail | `jsonb` |  | '{}'::jsonb |  |
| created_at | `timestamp with time zone` |  | now() |  |

Index:

- `idx_audit_log_aggregate` – `btree (aggregate_type, aggregate_id)`

## Schema `public`

standard public schema

### public.event_publication

Spring Modulith: event nội bộ giữa các module; completion_date null = chưa xử lý xong (sẽ phát lại)

| Cột | Kiểu | Null | Mặc định | Mô tả |
|---|---|:-:|---|---|
| **id** 🔑 | `uuid` |  |  |  |
| listener_id | `character varying(512)` |  |  |  |
| event_type | `character varying(512)` |  |  |  |
| serialized_event | `text` |  |  |  |
| publication_date | `timestamp with time zone` |  |  |  |
| completion_date | `timestamp with time zone` | ✓ |  |  |
| last_resubmission_date | `timestamp with time zone` | ✓ |  |  |
| completion_attempts | `integer` |  | 0 |  |
| status | `character varying(32)` | ✓ |  |  |

Index:

- `idx_event_publication_incomplete` – `btree (completion_date) WHERE (completion_date IS NULL)`

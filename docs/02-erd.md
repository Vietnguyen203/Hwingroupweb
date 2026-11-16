# 02 – Mô hình dữ liệu (ERD)

> Sơ đồ quan hệ ở mức thiết kế. **Danh sách cột chính xác (sinh từ DB thật) xem [06-database.md](06-database.md).**

## Quy ước chung

- Mỗi bounded context một **schema PostgreSQL**: `identity`, `catalog`, `ordering`, `customer`, `affiliate`; thêm `audit` (do `common` quản lý) và `public` (bảng `event_publication` của Spring Modulith, bảng lịch sử Flyway).
- **Không có foreign key xuyên schema.** Cột tham chiếu sang module khác chỉ lưu ID và được đánh dấu `"ref → schema.table (ID, không FK)"` trong sơ đồ.
- Khóa chính: `uuid` – ứng dụng sinh **UUID v7** (có thứ tự theo thời gian, index B-tree gọn như số tăng dần; không đoán được số lượng bản ghi). DB có `default gen_random_uuid()` cho dữ liệu chèn tay. Riêng `customer.customer.id` **= `identity.user_account.id`** (không tự sinh).
- Tiền: `bigint` đơn vị **VND** (value object `Money`), ràng buộc `CHECK (>= 0)`.
- Thời gian: `timestamptz` (UTC). Mọi bảng có `created_at`, `updated_at`; aggregate root có thêm `version bigint` cho optimistic locking.
- Enum lưu dạng `varchar` + `CHECK` (dễ đọc, dễ đổi hơn enum PostgreSQL).
- Mermaid `erDiagram` không hỗ trợ độ dài kiểu – độ dài/ràng buộc ghi ở phần comment.

---

## 1. Schema `identity`

![02-erd-identity](images/02-erd-identity.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
erDiagram
    user_account ||--o{ user_role : "có"
    user_account ||--o{ refresh_token : "sở hữu"

    user_account {
        uuid id PK
        varchar phone UK "E.164 chuẩn hóa +849xxxxxxxx, nullable với admin"
        varchar email UK "chỉ admin, nullable"
        varchar password_hash "BCrypt, chỉ admin"
        varchar full_name "nullable"
        varchar status "ACTIVE | LOCKED"
        timestamptz last_login_at
        bigint version
        timestamptz created_at
        timestamptz updated_at
    }

    user_role {
        uuid user_id PK, FK
        varchar role PK "CUSTOMER | AFFILIATE | ADMIN"
    }

    refresh_token {
        uuid id PK
        uuid user_id FK "index"
        varchar token_hash UK "SHA-256 của token, không lưu token gốc"
        uuid family_id "index – chuỗi xoay vòng"
        timestamptz expires_at
        timestamptz revoked_at "nullable"
        uuid replaced_by_id "nullable – token kế tiếp"
        varchar user_agent
        varchar ip_hash
        timestamptz created_at
    }
```

</details>

| Ràng buộc / index | Mục đích |
|---|---|
| `CHECK (phone IS NOT NULL OR email IS NOT NULL)` | Mỗi user có ít nhất 1 định danh |
| `idx_refresh_token_family (family_id)` | Thu hồi cả chuỗi khi phát hiện dùng lại token đã xoay |

**Redis (không phải bảng)** – identity dùng các key:

| Key | Giá trị | TTL |
|---|---|---|
| `otp:{purpose}:{phone}` | hash(OTP + pepper), `attempts` | 5 phút |
| `otp:lock:{phone}` | 1 | 15 phút (sau 5 lần sai) |
| `rl:otp:phone:{phone}` | bộ đếm | 10 phút (tối đa 3) |
| `rl:otp:ip:{ipHash}` | bộ đếm | 10 phút (tối đa 3) |

`purpose` = `LOGIN` | `BANK_CHANGE`.

---

## 2. Schema `catalog`

![02-erd-catalog](images/02-erd-catalog.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
erDiagram
    category ||--o{ product : "chứa"
    product ||--o{ product_image : "có"
    product ||--o{ stock_movement : "biến động"

    category {
        uuid id PK
        varchar name "<= 100"
        varchar slug UK
        varchar icon_url
        int sort_order
        boolean active
        bigint version
        timestamptz created_at
        timestamptz updated_at
    }

    product {
        uuid id PK
        uuid category_id FK "index"
        varchar name "<= 200"
        varchar slug UK
        bigint price "CHECK >= 0"
        bigint compare_at_price "nullable, giá gốc gạch ngang"
        text short_description
        text description
        varchar unit "gói, hộp, kg..."
        int stock "CHECK >= 0"
        boolean active "index"
        boolean bestseller "index"
        int sold_count "phục vụ sắp xếp bán chạy"
        varchar manufacturer "FoodInfo – nhà sản xuất"
        varchar shelf_life "FoodInfo – HSD"
        text storage_instructions "FoodInfo"
        varchar declaration_number "FoodInfo – số công bố"
        varchar food_safety_cert_number "FoodInfo – GCN ATTP"
        varchar food_safety_cert_url "FoodInfo – ảnh GCN"
        varchar search_text "f_unaccent(lower(name)), generated stored"
        bigint version
        timestamptz created_at
        timestamptz updated_at
    }

    product_image {
        uuid id PK
        uuid product_id FK "index"
        varchar url
        int sort_order
    }

    stock_movement {
        uuid id PK
        uuid product_id FK
        uuid order_id "ref → ordering.orders (ID, không FK)"
        varchar type "DEDUCT | RESTORE"
        int quantity
        timestamptz created_at
    }
```

</details>

| Ràng buộc / index | Mục đích |
|---|---|
| `CREATE EXTENSION unaccent, pg_trgm` + hàm `immutable f_unaccent(text)` | Tìm kiếm không dấu |
| `idx_product_search_trgm GIN (search_text gin_trgm_ops)` | Tăng tốc `ILIKE '%...%'` |
| `idx_product_category_active (category_id, active)` | Lọc theo danh mục |
| `uq_stock_movement (order_id, product_id, type)` | **Idempotent**: listener chạy lại không trừ/hoàn kho 2 lần |
| `UPDATE product SET stock = stock - :q WHERE id = :id AND stock >= :q` | Trừ kho nguyên tử, không bán âm |

`stock_movement` thuộc aggregate `Product` (ghi qua `Product`/`InventoryService`), không có repository riêng.

---

## 3. Schema `ordering`

![02-erd-ordering](images/02-erd-ordering.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
erDiagram
    cart ||--o{ cart_item : "chứa"
    orders ||--|{ order_item : "gồm"
    orders ||--o{ order_status_history : "lịch sử"

    cart {
        uuid id PK
        uuid user_id UK "ref → identity.user_account (ID, không FK)"
        bigint version
        timestamptz updated_at
    }

    cart_item {
        uuid id PK
        uuid cart_id FK
        uuid product_id "ref → catalog.product (ID, không FK)"
        int quantity "1..99"
        timestamptz added_at
    }

    orders {
        uuid id PK
        varchar order_code UK "HW + yyMMdd + 4 ký tự, hiển thị cho khách"
        uuid customer_id "ref → customer.customer, index"
        varchar referral_code "nullable, lấy từ cookie hwin_ref"
        varchar status "PENDING..COMPLETED | CANCELLED | RETURNED, index"
        varchar payment_method "COD | BANK_QR"
        varchar payment_status "UNPAID | PAID"
        bigint subtotal
        bigint discount "demo = 0"
        bigint shipping_fee
        bigint total
        varchar recipient_name "ShippingAddress"
        varchar recipient_phone "ShippingAddress"
        varchar province "ShippingAddress"
        varchar district "ShippingAddress"
        varchar ward "ShippingAddress"
        varchar street "ShippingAddress"
        text note
        boolean vat_requested
        varchar vat_company_name "VatInvoiceInfo, nullable"
        varchar vat_tax_code "VatInvoiceInfo, 10 hoặc 13 số"
        varchar vat_address "VatInvoiceInfo"
        varchar vat_email "VatInvoiceInfo"
        varchar cancel_reason "nullable"
        varchar payment_ref "nullable, admin nhập khi xác nhận QR"
        timestamptz placed_at "index"
        timestamptz confirmed_at
        timestamptz shipped_at
        timestamptz delivered_at
        timestamptz completed_at
        timestamptz cancelled_at
        timestamptz returned_at
        bigint version
        timestamptz created_at
        timestamptz updated_at
    }

    order_item {
        uuid id PK
        uuid order_id FK
        uuid product_id "ref → catalog.product (ID, không FK)"
        varchar product_name "snapshot"
        varchar product_slug "snapshot"
        varchar image_url "snapshot"
        bigint unit_price "snapshot"
        int quantity
        bigint line_total
    }

    order_status_history {
        uuid id PK
        uuid order_id FK
        varchar from_status
        varchar to_status
        uuid actor_id "ref → identity.user_account, nullable với job"
        varchar note
        timestamptz created_at
    }
```

</details>

| Ràng buộc / index | Mục đích |
|---|---|
| Bảng tên `orders` (tránh từ khóa `order`) | |
| `uq_cart_item (cart_id, product_id)` | Mỗi sản phẩm 1 dòng trong giỏ |
| `idx_orders_customer (customer_id, placed_at desc)` | "Đơn của tôi" |
| `idx_orders_status (status, placed_at)` | Admin lọc đơn, job hoàn tất |
| `CHECK (total = subtotal - discount + shipping_fee)` | Bất biến tiền |

---

## 4. Schema `customer`

![02-erd-customer](images/02-erd-customer.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
erDiagram
    customer ||--o{ customer_address : "sổ địa chỉ"
    customer ||--|| customer_stats : "read model"
    customer ||--o{ customer_product_stat : "read model"

    customer {
        uuid id PK "= identity.user_account.id (ID, không FK)"
        varchar phone UK "snapshot từ UserRegistered"
        varchar full_name
        bigint version
        timestamptz created_at
        timestamptz updated_at
    }

    customer_address {
        uuid id PK
        uuid customer_id FK "index"
        varchar recipient_name
        varchar recipient_phone
        varchar province
        varchar district
        varchar ward
        varchar street
        boolean is_default
        timestamptz created_at
    }

    customer_stats {
        uuid customer_id PK, FK
        int total_orders "không tính CANCELLED/RETURNED"
        bigint total_spent
        timestamptz first_order_at
        timestamptz last_order_at "index – lọc DORMANT"
        timestamptz updated_at
    }

    customer_product_stat {
        uuid customer_id PK, FK
        uuid product_id PK "ref → catalog.product (ID, không FK)"
        int total_quantity
        int order_count
        timestamptz last_ordered_at
    }

    processed_event {
        uuid event_id PK
        varchar listener PK
        timestamptz processed_at
    }
```

</details>

| Ràng buộc / index | Mục đích |
|---|---|
| (quy tắc trong aggregate `Customer`) | Đúng 1 địa chỉ mặc định – không dùng partial unique index vì Hibernate flush UPDATE theo thứ tự không xác định |
| `processed_event (event_id, listener)` | Listener cập nhật read model **idempotent** khi event được phát lại |
| Phân nhóm (`NEW` / `LOYAL` / `DORMANT`) | Tính lúc truy vấn từ `customer_stats` + ngưỡng `hwin.customer.*`, không lưu |

---

## 5. Schema `affiliate`

![02-erd-affiliate](images/02-erd-affiliate.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
erDiagram
    affiliate ||--o{ referral_click : "nhận click"
    affiliate ||--o{ customer_binding : "gắn khách"
    affiliate ||--o{ commission : "hưởng"
    affiliate ||--o{ payout : "rút tiền"

    affiliate {
        uuid id PK
        uuid user_id UK "ref → identity.user_account (ID, không FK)"
        varchar phone "snapshot, dùng chống tự giới thiệu"
        varchar full_name
        varchar referral_code UK "A-Z0-9, 6-10 ký tự"
        varchar status "PENDING | APPROVED | REJECTED | SUSPENDED"
        varchar social_link "kênh bán của CTV"
        text note
        varchar bank_name "BankAccount"
        varchar bank_account_no_enc "BankAccount – AES-GCM base64"
        varchar bank_account_holder_enc "BankAccount – AES-GCM base64"
        varchar bank_account_no_last4 "hiển thị ****1234"
        timestamptz bank_changed_at "khóa rút 48h"
        uuid reviewed_by "ref → identity.user_account"
        timestamptz reviewed_at
        varchar reject_reason
        bigint version
        timestamptz created_at
        timestamptz updated_at
    }

    referral_click {
        uuid id PK
        uuid affiliate_id FK "index"
        varchar referral_code
        varchar ip_hash "SHA-256(ip + salt)"
        varchar user_agent
        varchar landing_path
        timestamptz clicked_at "index"
    }

    customer_binding {
        uuid id PK
        uuid customer_id UK "ref → customer.customer – GẮN VĨNH VIỄN"
        uuid affiliate_id FK "index"
        uuid first_order_id "ref → ordering.orders"
        varchar referral_code
        timestamptz bound_at
    }

    commission {
        uuid id PK
        uuid order_id UK "ref → ordering.orders (ID, không FK)"
        varchar order_code
        uuid affiliate_id FK "index"
        uuid customer_id "ref → customer.customer"
        bigint base_amount "subtotal - discount"
        numeric rate "0.10"
        bigint amount "floor(base * rate)"
        varchar status "PENDING | APPROVED | CANCELLED"
        timestamptz eligible_at "deliveredAt + holdDays, nullable"
        timestamptz approved_at
        timestamptz cancelled_at
        bigint version
        timestamptz created_at
        timestamptz updated_at
    }

    payout {
        uuid id PK
        uuid affiliate_id FK "index"
        bigint amount "CHECK >= min-payout"
        varchar status "REQUESTED | APPROVED | PAID | REJECTED"
        varchar bank_name "snapshot"
        varchar bank_account_no_enc "snapshot mã hóa"
        varchar bank_account_holder_enc "snapshot mã hóa"
        varchar transaction_ref "nhập khi PAID"
        varchar reject_reason
        uuid processed_by "ref → identity.user_account"
        timestamptz requested_at
        timestamptz approved_at
        timestamptz paid_at
        timestamptz rejected_at
        bigint version
    }
```

</details>

| Ràng buộc / index | Mục đích |
|---|---|
| `uq_customer_binding_customer (customer_id)` | **Gắn khách vĩnh viễn** – lần thứ 2 insert sẽ fail |
| `uq_commission_order (order_id)` | Mỗi đơn tối đa 1 hoa hồng; listener chạy lại an toàn |
| `uq_payout_open (affiliate_id) WHERE status IN ('REQUESTED','APPROVED')` | Mỗi CTV tối đa 1 yêu cầu rút đang mở → chống rút trùng do race |
| `idx_commission_status_eligible (status, eligible_at)` | Job duyệt hoa hồng |
| `idx_referral_click_affiliate_time (affiliate_id, clicked_at)` | Dashboard |
| Dedupe click 24h | Redis `click:{code}:{ipHash}` `SET NX EX 86400` (không phải unique DB) |

---

## 6. Schema `audit` và `public`

![02-erd-audit](images/02-erd-audit.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
erDiagram
    audit_log {
        uuid id PK
        varchar module "ordering | affiliate | ..."
        varchar aggregate_type "Commission, Payout, Order, Affiliate"
        varchar aggregate_id
        varchar action "COMMISSION_CREATED, PAYOUT_PAID, BANK_CHANGED, ORDER_PAID..."
        uuid actor_id "nullable với job / system"
        bigint amount "nullable"
        jsonb detail "trạng thái trước/sau (đã che dữ liệu nhạy cảm)"
        timestamptz created_at
    }

    event_publication {
        uuid id PK
        varchar listener_id
        varchar event_type
        text serialized_event
        timestamptz publication_date
        timestamptz completion_date "null = chưa xử lý xong"
    }
```

</details>

- `audit.audit_log` **chỉ ghi thêm**: trigger `BEFORE UPDATE OR DELETE … RAISE EXCEPTION`, và user ứng dụng chỉ có quyền `INSERT, SELECT`.
- `public.event_publication`: bảng chuẩn của Spring Modulith (cột chính xác theo phiên bản Modulith 2.x, tạo bằng Flyway).

---

## 7. Tổng hợp tham chiếu xuyên schema (chỉ ID, KHÔNG FK)

| Cột | Trỏ tới | Tính nhất quán đảm bảo bởi |
|---|---|---|
| `ordering.cart.user_id` | `identity.user_account.id` | JWT (chỉ user đã đăng nhập mới có cart) |
| `ordering.cart_item.product_id`, `order_item.product_id` | `catalog.product.id` | `ProductQueryService` khi thêm/đặt |
| `ordering.orders.customer_id` | `customer.customer.id` (= userId) | JWT |
| `catalog.stock_movement.order_id` | `ordering.orders.id` | Event `OrderPlaced/Cancelled/Returned` |
| `customer.customer.id` | `identity.user_account.id` | Event `UserRegistered` |
| `customer.customer_product_stat.product_id` | `catalog.product.id` | Event `OrderPlaced` |
| `affiliate.affiliate.user_id`, `reviewed_by`, `payout.processed_by` | `identity.user_account.id` | JWT |
| `affiliate.customer_binding.customer_id`, `commission.customer_id` | `customer.customer.id` | Event `OrderPlaced` |
| `affiliate.commission.order_id`, `customer_binding.first_order_id` | `ordering.orders.id` | Event `OrderPlaced` |
| `audit.audit_log.aggregate_id`, `actor_id` | nhiều bảng | Ghi bởi service |

# 05 – Danh sách API

## Quy ước

- Base path: `/api`. JSON, `camelCase`. Tiền là số nguyên VND.
- Xác thực bằng cookie `hwin_at` (access JWT 15 phút) và `hwin_rt` (refresh 7 ngày, `Path=/api/auth`). Cả hai `HttpOnly; Secure; SameSite=Lax`.
- Quyền: `public` · `auth` (đã đăng nhập, mọi role) · `CUSTOMER` · `AFFILIATE` · `ADMIN`.
- `me` / `ctv` = tài nguyên của chính user trong JWT → **không bao giờ nhận userId từ client** (chống IDOR). Tài nguyên có mã (đơn hàng) luôn lọc thêm `customerId = currentUser`, không khớp trả **404**.
- Endpoint admin có tiền tố `/api/admin/**` và nằm trong module sở hữu dữ liệu.
- Phân trang: `?page=0&size=20&sort=field,dir` → `{content, page, size, totalElements, totalPages}`.
- Cách viết API (theo `ai/skills/spring-boot-core`, áp dụng có chọn lọc):
  - Controller trả `ResponseEntity<T>` (`ok`, `status(CREATED)`, `status(ACCEPTED)`, `noContent()`); controller chỉ gọi service, không chứa nghiệp vụ.
  - DTO là class Lombok `@Data @Builder @NoArgsConstructor @AllArgsConstructor`: đặt ở `<module>/api/dto/`, tên `<Action><Resource>Request` / `<Resource>Response` (quy ước đặt tên: `CLAUDE.md`).
  - Validate bằng `@NotBlankValidator(field = "Tên")`, `@NotNullValidator`, `@LengthValidator(max, field)` (`common/validation`) – thông báo tiếng Việt tự sinh theo tên trường; nhóm `OnCreate` cho trường chỉ bắt buộc khi tạo mới. Các ràng buộc khác dùng Jakarta (`@Pattern`, `@Email`, `@Min`...).
  - KHÔNG dùng `IBaseApi` / CRUD chung: nghiệp vụ đi qua aggregate (DDD) bằng từng lệnh riêng (`confirm`, `ship`, `approve`...). Enum lưu dạng chữ (không TINYINT).
- Danh sách phân trang: tham số `page` (bắt đầu từ **1**), `page_size`; trả `PageResponse {content, page, pageSize, totalElements, totalPages}`.
- Lỗi chuẩn `ErrorResponse` (theo `ai/skills/spring-boot-core`): `{traceId, timestamp, status, statusCode, messageCode, message, path, method, errors?[{field, message, rejectedValue?}], details?}`.
  - `messageCode`: mã ổn định cho frontend, ví dụ `OTP_INVALID`, `ACCOUNT_NOT_FOUND`, `CART_INVALID`; `message`: câu tiếng Việt hiển thị luôn được.
  - Code ném `ResponseException(HttpStatus, XxxErrorMessage)`; mã + câu thông báo khai báo ở enum `ExceptionMessage` của từng module (`<module>/entity/ExceptionMessage.java`), lỗi dùng chung ở `common/exception/CommonErrorMessage.java`. Placeholder `#key#` trong câu được thay bằng dữ liệu truyền kèm.
  - HTTP: 400 dữ liệu sai (`VALIDATION_FAILED`), 401 chưa đăng nhập, 403 không đủ quyền, 404 không tìm thấy, 409 trùng / sửa đồng thời, 422 vi phạm nghiệp vụ, 429 quá giới hạn, 500 lỗi hệ thống (không lộ stack trace, tra log bằng `traceId`).
- Swagger UI: `/swagger-ui.html` (springdoc), chỉ bật ở profile `dev`.

---

## identity

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/auth/otp` | public | Gửi OTP: `{phone}` (SMS – hiện giả lập, chỉ dev) **hoặc** `{email}` (email thật), `purpose`: `LOGIN` (mặc định – tài khoản phải có, không thì `ACCOUNT_NOT_FOUND`) \| `REGISTER` (phải chưa có, không thì `ACCOUNT_EXISTS`). Trả `{channel, sentTo, expiresInSeconds}`. Rate limit 3/10 phút theo nơi nhận và IP; kiểm tra tài khoản 20 lần/10 phút/IP |
| POST | `/api/auth/otp/verify` | public | Đăng nhập: `{phone\|email, otp}` (OTP purpose LOGIN) → set cookie JWT |
| POST | `/api/auth/register` | public | Đăng ký: `{phone\|email, otp, fullName}` (OTP purpose REGISTER) → tạo tài khoản CUSTOMER, set cookie JWT (201) |
| POST | `/api/auth/refresh` | cookie `hwin_rt` | Xoay vòng refresh token, set cookie mới |
| POST | `/api/auth/logout` | auth | Thu hồi refresh token hiện tại, xóa cookie |
| GET | `/api/auth/me` | auth | `{id, phone (che), fullName, roles}` – frontend & proxy.ts dùng |
| POST | `/api/admin/auth/login` | public | Bước 1: `{email, password}`. Tài khoản thường → `{otpRequired: true, challengeId}` (OTP gửi tới email của admin, không có email thật thì tới SĐT; `sentTo` = nơi nhận đã che); riêng tài khoản dev `admin` miễn OTP → cookie JWT ngay. Chỉ đếm lần sai: 5/10 phút/IP |
| POST | `/api/admin/auth/login/verify` | public | Bước 2: `{challengeId, otp}` → cookie JWT |
| GET | `/api/admin/admins` | ADMIN | Danh sách tài khoản quản trị |
| POST | `/api/admin/admins` | ADMIN | Tạo admin `{email, password, fullName, phone?}` – mật khẩu ≥ 12 ký tự có chữ + số; cần email thật hoặc SĐT để nhận OTP (`ADMIN_CONTACT_REQUIRED`); luôn đăng nhập 2 bước |

## catalog

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/categories` | public | Danh mục active theo `sortOrder` (menu icon) |
| GET | `/api/products` | public | `?q=&category=slug&sort=NEWEST\|PRICE_ASC\|PRICE_DESC\|BESTSELLER&page=&size=` – tìm không dấu |
| GET | `/api/products/bestsellers` | public | Sản phẩm cờ `bestseller` (trang chủ) |
| GET | `/api/products/{slug}` | public | Chi tiết: thương hiệu, khối lượng, đóng gói, xuất xứ, thành phần, đặc điểm, HDSD, 1–5 ảnh, `soldCount`, thông tin thực phẩm |
| GET | `/api/product-reviews` | public | `?productId=&page=&page_size=` – đánh giá hiển thị (tên che bớt) |
| GET | `/api/product-reviews/summary` | public | `?productId=` – điểm trung bình + số đánh giá theo sao |
| GET | `/api/me/product-reviews/eligibility` | CUSTOMER | `?productId=` – đã nhận hàng chưa, đã đánh giá chưa |
| POST | `/api/me/product-reviews` | CUSTOMER | `{productId, rating 1–5, comment}` – chỉ khi đã nhận hàng, 1 đánh giá/sản phẩm |
| GET | `/api/admin/categories` | ADMIN | Tất cả danh mục (kể cả ẩn) |
| POST | `/api/admin/categories` | ADMIN | Tạo danh mục |
| PUT | `/api/admin/categories/{id}` | ADMIN | Sửa danh mục |
| DELETE | `/api/admin/categories/{id}` | ADMIN | Ẩn danh mục (chặn nếu còn sản phẩm active) |
| GET | `/api/admin/products` | ADMIN | Danh sách + lọc `q, category, active, lowStock` |
| GET | `/api/admin/products/{id}` | ADMIN | Chi tiết để sửa |
| POST | `/api/admin/products` | ADMIN | Tạo sản phẩm (bắt buộc `brand, weight, packaging, origin`, `images` 1–5 ảnh) |
| PUT | `/api/admin/products/{id}` | ADMIN | Sửa sản phẩm (giá, thông tin thực phẩm, ảnh, cờ) |
| PATCH | `/api/admin/products/{id}/stock` | ADMIN | Điều chỉnh tồn kho `{delta, note}` |
| PATCH | `/api/admin/products/{id}/active` | ADMIN | Bật/tắt bán |
| POST | `/api/admin/uploads` | ADMIN | Upload ảnh (multipart, ≤ 5MB, jpg/png/webp) → `{url}` |
| GET | `/uploads/**` | public | File tĩnh từ `LocalStorageService` |

## ordering

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/me/cart` | CUSTOMER | Giỏ server, giá/tồn kho tính lại từ catalog |
| POST | `/api/me/cart/items` | CUSTOMER | Thêm `{productId, quantity}` |
| PATCH | `/api/me/cart/items/{productId}` | CUSTOMER | Đổi số lượng |
| DELETE | `/api/me/cart/items/{productId}` | CUSTOMER | Xóa dòng |
| POST | `/api/me/cart/merge` | CUSTOMER | Gộp giỏ localStorage `{items:[{productId, quantity}]}` sau đăng nhập |
| POST | `/api/me/cart-quotes` | public | Tính giá giỏ ẩn danh (giỏ localStorage) – trả subtotal, phí ship, total do backend tính |
| GET | `/api/checkout/config` | public | `{shippingFee, paymentMethods}` |
| POST | `/api/checkout/orders` | CUSTOMER | Đặt hàng `{shippingAddress, paymentMethod, vatInvoice?, note, idempotencyKey}`; ref đọc từ cookie `hwin_ref`. Rate limit 5/10 phút |
| GET | `/api/me/orders` | CUSTOMER | Đơn của tôi (phân trang, lọc trạng thái) |
| GET | `/api/me/orders/{code}` | CUSTOMER | Chi tiết đơn của tôi (+ `qrUrl` nếu BANK_QR chưa trả) |
| POST | `/api/me/orders/{code}/cancel` | CUSTOMER | Tự hủy khi còn PENDING |
| GET | `/api/admin/orders` | ADMIN | Lọc `status, paymentMethod, paymentStatus, q (mã/SĐT), from, to` |
| GET | `/api/admin/orders/{id}` | ADMIN | Chi tiết + lịch sử trạng thái + VAT |
| POST | `/api/admin/orders/{id}/mark-paid` | ADMIN | `{paymentRef}` – xác nhận đã nhận chuyển khoản |
| POST | `/api/admin/orders/{id}/confirm` | ADMIN | PENDING → CONFIRMED |
| POST | `/api/admin/orders/{id}/ship` | ADMIN | CONFIRMED → SHIPPING |
| POST | `/api/admin/orders/{id}/deliver` | ADMIN | SHIPPING → DELIVERED |
| POST | `/api/admin/orders/{id}/return` | ADMIN | DELIVERED → RETURNED |
| POST | `/api/admin/orders/{id}/cancel` | ADMIN | `{reason}` |
| POST | `/api/admin/orders/run-payment-timeout-job` | ADMIN | Chạy ngay job hủy đơn chuyển khoản quá hạn. `?asOf=` (giả lập thời điểm) chỉ ở profile dev |

## customer

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/me/profile` | CUSTOMER | Hồ sơ + thống kê (tổng đơn, tổng chi tiêu) |
| PUT | `/api/me/profile` | CUSTOMER | Cập nhật họ tên |
| GET | `/api/me/addresses` | CUSTOMER | Sổ địa chỉ |
| POST | `/api/me/addresses` | CUSTOMER | Thêm địa chỉ |
| PUT | `/api/me/addresses/{id}` | CUSTOMER | Sửa (kiểm tra sở hữu) |
| DELETE | `/api/me/addresses/{id}` | CUSTOMER | Xóa (kiểm tra sở hữu) |
| POST | `/api/me/addresses/{id}/default` | CUSTOMER | Đặt mặc định |
| GET | `/api/me/favorite-products` | CUSTOMER | Top sản phẩm hay mua (`?limit=8`) |
| POST | `/api/me/orders/{code}/reorder` | CUSTOMER | Mua lại → `{added[], skipped[{productId, name, reason}]}` |
| GET | `/api/admin/customers` | ADMIN | `?q=&segment=NEW\|LOYAL\|DORMANT&page=` |
| GET | `/api/admin/customers/{id}` | ADMIN | Chi tiết + địa chỉ + thống kê |
| GET | `/api/admin/customers/export.csv` | ADMIN | Xuất CSV theo bộ lọc hiện tại (UTF-8 BOM cho Excel) |

## affiliate

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/referral-clicks` | public | `{code, landingPath}` → ghi click (không đếm trùng IP + mã trong 24h), mã hợp lệ thì set cookie `hwin_ref` 30 ngày. Luôn 204 |
| POST | `/api/affiliates/id-card-uploads` | CUSTOMER | Tải 1 ảnh CCCD (multipart `file`, JPG/PNG/WebP ≤ 5MB) vào kho riêng tư, trả `{key}`; gọi 2 lần (mặt trước, mặt sau) |
| POST | `/api/affiliates/me` | CUSTOMER | Đăng ký CTV `{fullName, socialLink, note, acceptTerms, phone?, idCardFrontKey, idCardBackKey}` (2 khóa ảnh bắt buộc, phải do chính mình tải lên: `ID_CARD_REQUIRED` / `ID_CARD_INVALID`) – `phone` bắt buộc nếu tài khoản đăng nhập bằng email (`PHONE_REQUIRED`); đăng ký lại nếu đã bị từ chối |
| GET | `/api/affiliates/me` | CUSTOMER | Hồ sơ CTV + trạng thái + lý do (404 nếu chưa đăng ký) |
| GET | `/api/affiliates/me/dashboard` | AFFILIATE | Mã, link chia sẻ, click (tổng / 30 ngày), khách đã gắn, hoa hồng theo trạng thái, số dư khả dụng, đã rút, khóa rút đến |
| GET | `/api/affiliates/me/commissions` | AFFILIATE | Hoa hồng của tôi (mã đơn, cơ sở tính, số tiền, trạng thái, mốc duyệt) |
| GET | `/api/affiliates/me/customers` | AFFILIATE | Khách đã gắn (SĐT đã che, ngày gắn) |
| GET | `/api/affiliates/me/bank-account` | AFFILIATE | Ngân hàng (chỉ 4 số cuối) + `withdrawLockedUntil` |
| POST | `/api/affiliates/me/bank-account/otp` | AFFILIATE | Gửi OTP `BANK_CHANGE` tới email của tài khoản (không có thì SĐT) |
| PUT | `/api/affiliates/me/bank-account` | AFFILIATE | `{bankName, accountNo, accountHolder, otp}` – mã hóa AES-GCM; đổi (không phải lần đầu) khóa rút 48h |
| GET | `/api/affiliates/me/payouts` | AFFILIATE | Lịch sử rút tiền |
| POST | `/api/affiliates/me/payouts` | AFFILIATE | Yêu cầu rút `{amount}` (≥ 200.000, ≤ số dư, 1 yêu cầu mở / CTV) |
| GET | `/api/admin/affiliates` | ADMIN | Lọc `status`, `q` (SĐT / tên / mã) |
| GET | `/api/admin/affiliates/{id}` | ADMIN | Chi tiết (`hasIdCard`) |
| GET | `/api/admin/affiliates/{id}/id-card/{front\|back}` | ADMIN | Ảnh CCCD (trả ảnh, `Cache-Control: no-store`); mỗi lần xem ghi audit `ID_CARD_VIEWED` |
| POST | `/api/admin/affiliates/{id}/approve` | ADMIN | Duyệt → sinh mã giới thiệu, cấp vai trò AFFILIATE |
| POST | `/api/admin/affiliates/{id}/reject` | ADMIN | `{reason}` |
| POST | `/api/admin/affiliates/{id}/suspend` | ADMIN | `{reason}` – link ngừng hoạt động, gỡ vai trò |
| POST | `/api/admin/affiliates/{id}/reinstate` | ADMIN | Mở khóa (giữ nguyên mã) |
| GET | `/api/admin/commissions` | ADMIN | Lọc `status, affiliateId, orderCode` |
| POST | `/api/admin/commissions/run-approval-job` | ADMIN | Chạy ngay job duyệt hoa hồng. `?asOf=` (giả lập thời điểm) chỉ dùng được ở profile dev |
| GET | `/api/admin/payouts` | ADMIN | Lọc `status` |
| GET | `/api/admin/payouts/{id}` | ADMIN | Chi tiết + số tài khoản **giải mã** (ghi audit `BANK_VIEWED`) |
| POST | `/api/admin/payouts/{id}/approve` | ADMIN | REQUESTED → APPROVED |
| POST | `/api/admin/payouts/{id}/pay` | ADMIN | `{transactionRef}` → PAID |
| POST | `/api/admin/payouts/{id}/reject` | ADMIN | `{reason}` → REJECTED (tiền tự trở lại số dư) |

## Chỉ có ở profile dev

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/dev/otp/latest?phone=\|email=&purpose=LOGIN\|BANK_CHANGE\|ADMIN_LOGIN` | OTP vừa gửi – để Postman/test tự đăng nhập. Môi trường khác không có endpoint này (404) |

## common / vận hành

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/actuator/health` | public | Health check |
| GET | `/actuator/modulith` | ADMIN | Cấu trúc module (Spring Modulith) |
| GET | `/api/admin/audit-logs` | ADMIN | Nhật ký thay đổi liên quan tới tiền. Lọc `module, aggregateType, aggregateId, action, actorId, from, to` |

---

## Trang frontend tương ứng

| Route | Render | Quyền (proxy.ts) |
|---|---|---|
| `/`, `/danh-muc`, `/danh-muc/[slug]`, `/san-pham/[slug]`, `/tim-kiem` | SSR | public |
| `/gio-hang` | CSR | public |
| `/thanh-toan` | CSR | cần đăng nhập (chuyển `/dang-nhap?next=/thanh-toan`) |
| `/dang-nhap`, `/dang-ky` | CSR | public |
| `/tai-khoan`, `/tai-khoan/don-hang`, `/tai-khoan/don-hang/[code]` | CSR | đăng nhập (kiểm ở client) |
| `/ctv` | CSR | public (giới thiệu) / dashboard khi là CTV đã duyệt |
| `/ctv/dang-ky` | CSR | đăng nhập |
| `/admin/login` | CSR | public (đăng nhập 2 bước) |
| `/admin/orders`, `/admin/orders/[id]`, `/admin/products`, `/admin/customers`, `/admin/affiliates`, `/admin/commissions`, `/admin/payouts` | CSR | ADMIN |

`src/proxy.ts` (Next.js 16 đổi tên `middleware.ts` thành `proxy.ts`) đọc cookie `hwin_at`, giải mã payload JWT (chỉ để điều hướng UX – backend vẫn là nơi kiểm quyền thật) và chuyển hướng về đăng nhập nếu thiếu role.

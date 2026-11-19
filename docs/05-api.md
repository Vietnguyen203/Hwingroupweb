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
| POST | `/api/auth/login` | public | Bước 1: `{identifier (SĐT hoặc email), password}`. Thiết bị lạ → `{otpRequired: true, challengeId, sentTo}` và gửi OTP; thiết bị đã ghi nhớ → `{otpRequired: false, user}` + cookie JWT. Chống dò tài khoản: không tồn tại / chưa có mật khẩu / là admin / sai mật khẩu đều trả chung `401 INVALID_LOGIN` (cùng thời gian phản hồi); chỉ khi nhập ĐÚNG mật khẩu admin mới trả `422 ADMIN_USE_ADMIN_LOGIN` (dùng `/api/admin/auth/login`) |
| POST | `/api/auth/login/verify` | public | Bước 2: `{challengeId, otp, rememberDevice}` → cookie JWT; `rememberDevice=true` ghi nhớ thiết bị 30 ngày (không hỏi OTP lại) |
| POST | `/api/auth/register` | public | Đăng ký: `{phone\|email, otp, fullName, dateOfBirth (quá khứ), address, citizenId (12 số), password}` (OTP purpose REGISTER; mật khẩu theo chính sách: 8–64 ký tự, hoa + thường + số + ký tự đặc biệt, không chứa email/SĐT) → tạo tài khoản CUSTOMER, set cookie JWT (201) |
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
| GET | `/api/categories` | public | Danh mục active theo `sortOrder` (menu icon), kèm `productCount` (số sản phẩm đang bán) – trang chủ ẩn danh mục rỗng |
| GET | `/api/products` | public | `?q=&category=slug&sort=NEWEST\|PRICE_ASC\|PRICE_DESC\|BESTSELLER&page=&size=` – tìm không dấu |
| GET | `/api/products/bestsellers` | public | Sản phẩm cờ `bestseller` (trang chủ) |
| GET | `/api/products/{slug}` | public | Giá: `price` (khách thực trả), `basePrice` (niêm yết), `salePercent`, `compareAtPrice`, `discountPercent`. Chi tiết: thương hiệu, khối lượng, đóng gói, xuất xứ, thành phần, đặc điểm, HDSD, 1–5 ảnh, `soldCount`, thông tin thực phẩm |
| GET | `/api/product-reviews` | public | `?productId=&page=&page_size=` – đánh giá hiển thị (tên che bớt) |
| GET | `/api/product-reviews/summary` | public | `?productId=` – điểm trung bình + số đánh giá theo sao |
| GET | `/api/me/product-reviews/eligibility` | CUSTOMER | `?productId=` – đã nhận hàng chưa, đã đánh giá chưa |
| GET | `/api/admin/product-reviews` | ADMIN | Kiểm duyệt: lọc `visible`, `rating`, `productId`, `q` (nội dung / tên), phân trang; thấy cả đánh giá đã ẩn |
| PATCH | `/api/admin/product-reviews/{id}/visibility` | ADMIN | `{visible, reason?}` ẩn / hiện đánh giá; ghi audit `REVIEW_HIDDEN` / `REVIEW_SHOWN` |
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
| PATCH | `/api/admin/products/{id}/sale` | ADMIN | Giảm giá thêm `{salePercent}` 0–90 (cả combo), 0 = bỏ; ghi audit `SALE_CHANGED`. Lỗi `SALE_PERCENT_INVALID` |
| PATCH | `/api/admin/products/{id}/category` | ADMIN | Đổi danh mục `{"categoryId": uuid}` |
| DELETE | `/api/admin/products/{id}` | ADMIN | Xóa sản phẩm |
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
| POST | `/api/cart-quotes` | public | Tính giá giỏ ẩn danh (giỏ localStorage) – trả subtotal, phí ship, total do backend tính |
| POST | `/api/me/phone/otp` | CUSTOMER | Gửi OTP tới SĐT muốn thêm vào tài khoản `{phone}` |
| PUT | `/api/me/phone` | CUSTOMER | Thêm SĐT cho tài khoản đăng ký bằng email `{phone, otp}` |
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
| POST | `/api/affiliates/id-card-uploads` | CUSTOMER | Tải 1 ảnh CCCD (multipart `file`, JPG/PNG/WebP ≤ 5MB) vào kho riêng tư, trả `{key}`; gọi 2 lần (mặt trước, mặt sau). Tối đa 10 lần/giờ/người (quá hạn mức: 429 `ID_CARD_UPLOAD_LIMIT`) |
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

## notification

Thông báo trong ứng dụng (chuông). Mọi vai trò đã đăng nhập đều dùng được; luôn theo `userId` trong token, KHÔNG nhận `userId` từ client.
Backend chỉ trả `type` (enum `NotificationType`) + `data`; giao diện dịch sang tiếng Việt theo `type`.

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/api/notifications` | đăng nhập | Phân trang `page` (từ 1), `page_size` (≤ 50), `unread=true` chỉ lấy chưa đọc. Mỗi dòng: `{id, type, data, link, createdAt, read}`, mới nhất trước |
| GET | `/api/notifications/unread-count` | đăng nhập | `{unread}` |
| POST | `/api/notifications/{id}/read` | đăng nhập | Đánh dấu đã đọc (chỉ thông báo của mình) → `{unread}` |
| POST | `/api/notifications/read-all` | đăng nhập | Đánh dấu đã đọc tất cả → `{unread}` |
| WS | `/api/realtime` | đăng nhập (cookie `hwin_at`) | WebSocket đẩy tin xuống trình duyệt. Chưa đăng nhập: 401; origin ngoài danh sách CORS: 403 |

Tin WebSocket (JSON, chỉ server → client; client gửi chuỗi `ping` mỗi 30 giây để giữ kết nối):

| `type` | Nội dung |
|---|---|
| `hello` | Vừa kết nối (client tải lại số chưa đọc phòng lỡ tin lúc mất kết nối) |
| `notification` | `{notification: {id, type, data, link, createdAt, read}, unreadCount}` – có thông báo mới |
| `unread` | `{unreadCount}` – số chưa đọc đổi (đọc ở tab khác) |
| `pong` | Trả lời `ping` |

Loại thông báo và người nhận:

| `type` | Người nhận | `data` | Nguồn |
|---|---|---|---|
| `ORDER_PLACED` | tất cả admin | `orderCode, total` | `OrderPlacedEvent` |
| `AFFILIATE_APPLIED` | tất cả admin | `fullName` | CTV gửi hồ sơ |
| `PAYOUT_REQUESTED` | tất cả admin | `amount, fullName` | CTV yêu cầu rút tiền |
| `ORDER_CONFIRMED` / `ORDER_SHIPPED` / `ORDER_DELIVERED` / `ORDER_RETURNED` | khách của đơn | `orderCode` | `OrderConfirmedEvent` / `OrderShippedEvent` / `OrderDeliveredEvent` / `OrderReturnedEvent` |
| `ORDER_CANCELLED` | khách của đơn (không báo khi chính khách hủy) | `orderCode, reason` | `OrderCancelledEvent` |
| `COMMISSION_EARNED` / `COMMISSION_APPROVED` | CTV | `orderCode, amount` | đơn qua link CTV / job duyệt hoa hồng |
| `PAYOUT_APPROVED` / `PAYOUT_PAID` / `PAYOUT_REJECTED` | CTV | `amount` | admin xử lý yêu cầu rút |
| `AFFILIATE_APPROVED` / `AFFILIATE_REJECTED` | người đăng ký CTV | `reason?` | admin duyệt / từ chối hồ sơ |

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
| `/`, `/categories`, `/categories/[slug]`, `/products/[slug]`, `/search` | SSR | public |
| `/cart` | CSR | public |
| `/checkout` | CSR | cần đăng nhập (chuyển `/login?next=/checkout`) |
| `/login`, `/register` | CSR | public |
| `/account`, `/account/[id]`, `/account/orders`, `/account/orders/[code]` | CSR | đăng nhập (kiểm ở client) |
| `/affiliate` | CSR | public (giới thiệu) / dashboard cũ khi là CTV đã duyệt |
| `/affiliate/register` | CSR | đăng nhập |
| `/affiliate/[id]/dashboard`, `/affiliate/[id]/links`, `/affiliate/[id]/earnings`, `/affiliate/[id]/performance` | CSR | đăng nhập (proxy.ts) + CTV đã duyệt (kiểm ở client, backend kiểm role AFFILIATE) |
| `/affiliate/[id]/campaigns`, `/affiliate/[id]/products` | CSR | như trên; chưa có chức năng (trang "Sắp ra mắt") |

`/affiliate/[id]/performance` (Hiệu suất) chỉ dùng API có sẵn: `GET /api/affiliates/me/dashboard` (tổng click, click 30 ngày) và `GET /api/affiliates/me/commissions` (đơn và hoa hồng theo ngày, 30 ngày so với 30 ngày trước). Chưa có click theo ngày / theo nền tảng vì backend chưa lưu nguồn click.

**`[id]` trên URL (`/account/[id]`, `/affiliate/[id]/…`) là ID tài khoản (`MeResponse.id`), chỉ để hiển thị**: dữ liệu luôn lấy theo phiên đăng nhập (`/api/me/...`, `/api/affiliates/me/...`), không dùng id trên URL. Component `OwnIdRedirect` giữ id trên URL luôn là id của chính người đang đăng nhập: `/account` và link cũ `/affiliate/<mục>` (vd `/affiliate/links`, kể cả `?tab=bank`) tự chuyển sang link có id; id của người khác tự chuyển về id của mình. Cổng CTV nằm ở `app/affiliate/[id]/`; dựng link bằng `PortalLink` / `portalPath` (`lib/portal-path.ts`).
| `/admin/login` | CSR | public (đăng nhập 2 bước) |
| `/admin/orders`, `/admin/orders/[id]`, `/admin/products`, `/admin/customers`, `/admin/affiliates`, `/admin/commissions`, `/admin/payouts` | CSR | ADMIN |

**Cache phía server (`lib/catalog.ts`):** danh mục (header, menu, trang chủ) và các danh sách ở trang chủ (mới nhất, bán chạy, giảm giá, combo, banner) được nhớ 60 giây trong bộ nhớ server Next.js, lỗi không được nhớ; trang chi tiết sản phẩm, tìm kiếm và trang danh mục vẫn gọi backend mỗi lần. Giá khi đặt hàng luôn do backend tính lại. Không dùng `use cache` của Next vì nó buộc backend phải chạy lúc `next build`.

`src/proxy.ts` (Next.js 16 đổi tên `middleware.ts` thành `proxy.ts`) đọc cookie `hwin_at`, giải mã payload JWT (chỉ để điều hướng UX – backend vẫn là nơi kiểm quyền thật) và chuyển hướng về đăng nhập nếu thiếu role.

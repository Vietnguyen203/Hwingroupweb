# HWIN – Website bán thực phẩm chế biến + chương trình CTV (bản demo)

Monorepo:

| Thư mục | Nội dung |
|---|---|
| `backend/` | Backend Spring Boot 4.1 · Java 21 · Modular Monolith (Spring Modulith, DDD) |
| `frontend/` | Next.js 16 (App Router, TypeScript, Tailwind 4, shadcn/ui) |
| `docs/` | Thiết kế: kiến trúc, ERD, sơ đồ tuần tự, workflow, API |
| `postman/` | Collection + environment để test API backend bằng Postman (xem `postman/README.md`) |
| `dbeaver/` | Thông tin kết nối DB + câu SQL kiểm tra dữ liệu (xem `dbeaver/README.md`) |

Tài liệu database đầy đủ (sinh tự động từ DB): [`docs/06-database.md`](docs/06-database.md) – chạy lại `python docs/tools/gen_db_doc.py` khi đổi cấu trúc DB.

## Tiến độ

| Chặng | Nội dung | Trạng thái |
|---|---|---|
| 0 | Thiết kế (`docs/`) | Xong |
| 1 | Nền tảng, identity (OTP + JWT), catalog, frontend: trang chủ / danh mục / chi tiết / tìm kiếm | Xong |
| 2 | ordering + customer: giỏ server, thanh toán kèm OTP, đơn hàng, Mua lại, địa chỉ | Backend xong (Postman 90 request đạt); frontend chưa |
| 3 | affiliate, trang CTV, trang admin, test domain | Backend xong (49 test đạt); frontend CTV / admin chưa |

## Yêu cầu

- JDK 21 (Gradle toolchain tự tìm; nếu `java` mặc định là bản khác, đặt `JAVA_HOME` trỏ tới JDK 21)
- Docker Desktop (PostgreSQL 17 + Redis 7 chạy qua `backend/compose.yaml`)
- Node.js 20+ và npm

## Chạy thử

**1. Backend** (cổng 8088) – PowerShell trên Windows:

```powershell
cd backend
.\run-dev.ps1
```

Script tự chuyển cửa sổ sang UTF-8 (log tiếng Việt không bị vỡ chữ), dùng JDK 21 và tạo `.env` nếu chưa có.
Nếu PowerShell chặn chạy script: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (chạy một lần).

(bash/macOS: `cd backend && cp -n .env.example .env && ./gradlew bootRun`)

- Spring Boot tự bật Postgres (cổng 15432) và Redis (cổng 16379) bằng Docker Compose.
- Flyway tạo schema `identity`, `catalog`, `ordering`, `customer`, `affiliate`, `audit` và nạp dữ liệu mẫu (6 danh mục, 12 sản phẩm).
- Swagger UI: http://localhost:8088/swagger-ui.html (chỉ ở profile `dev`, mặc định).

**2. Frontend** (cổng 3100)

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:3100 (nên bật chế độ điện thoại trong DevTools).

**Tài khoản mẫu (profile dev)** – đăng nhập OTP, mã in ra log backend hoặc lấy qua `GET /api/dev/otp/latest?phone=...`:

| Vai trò | Đăng nhập | Dữ liệu sẵn có |
|---|---|---|
| Admin (dev) | `admin` / `admin` – **miễn OTP, chỉ có ở profile dev** | – |
| CTV đã duyệt | SĐT `0901000001` (mã giới thiệu `HWINDEMO`) | 12 click, 1 khách đã gắn, hoa hồng 31.000 đã duyệt + 11.500 đang chờ |
| Khách 1 | SĐT `0901000002` | Đã gắn với CTV, 2 đơn (`HWDEMO0001` đã giao, `HWDEMO0002` đã xác nhận) |
| Khách 2 | SĐT `0901000003` | 1 đơn chuyển khoản chờ thanh toán (`HWDEMO0003`), 1 đơn đã hủy (`HWDEMO0004`) |

Dữ liệu mẫu nằm ở `backend/src/main/resources/db/demo/V9_0_0__demo_data.sql`, chỉ nạp ở profile dev.

**3. Thử đăng nhập OTP** (chưa có giao diện – dùng Swagger hoặc curl)

```bash
curl -X POST localhost:8088/api/auth/otp -H "Content-Type: application/json" -d '{"phone":"0912345678"}'
```

OTP được in ra log backend: `[DEV OTP] LOGIN 09******78 -> 123456`. Sau đó gọi `POST /api/auth/otp/verify` với `{"phone","otp"}` – backend đặt cookie `hwin_at` + `hwin_rt`.

**Admin**: `POST /api/admin/auth/login` với `{"email":"admin","password":"admin"}` (mặc định dev, đổi trong `backend/.env`: `ADMIN_EMAIL`, `ADMIN_PASSWORD`).

## Kiểm thử

```powershell
cd backend; .\gradlew.bat build        # unit test + test tích hợp (Testcontainers, cần Docker) + Modulith verify
cd ..\frontend; npm run build; npm run lint
```

## Giả định

- **Khóa chính là UUID v7** (sinh bởi Hibernate `@UuidGenerator(style = VERSION_7)`): có thứ tự theo thời gian nên index gọn, không đoán được số bản ghi, sau này tách microservice không lo trùng id. Database cũng mặc định sinh UUID v7 cho mọi cột `id` (hàm `public.uuid_generate_v7()` – Postgres 17 chưa có `uuidv7()` sẵn).
- **Cổng**: backend 8088, frontend 3100, Postgres 15432, Redis 16379 – tránh trùng các dịch vụ đã chạy sẵn trên máy dev (8080, 3000, 5432, 6379 đang bận).
- **Next.js 16** đổi tên `middleware.ts` thành `proxy.ts`; file chặn quyền nằm ở `frontend/src/proxy.ts`.
- **Next.js gọi backend qua rewrite** `/api/*` → cookie JWT là first-party, không cần cấu hình cookie cross-site.
- **CSRF**: tắt CSRF token vì cookie `SameSite=Lax` + CORS chỉ cho domain frontend.
- **Cookie Secure**: bật ở mọi profile trừ `dev` (`COOKIE_SECURE=false`) để chạy được trên `http://localhost`.
- **Refresh token** cookie có `Path=/api/auth` → chỉ gửi kèm API xác thực. Khi access token hết hạn, trang đăng nhập gọi `/api/auth/refresh` trước.
- **Đăng ký và đăng nhập tách riêng** (`/register`, `/login`): đăng ký cần họ tên + OTP, tài khoản đã có thì báo `ACCOUNT_EXISTS`; đăng nhập tài khoản chưa có báo `ACCOUNT_NOT_FOUND`. Việc báo trước "đã có / chưa có tài khoản" làm lộ email/SĐT nào đã đăng ký – chấp nhận vì dễ dùng, giới hạn 20 lần kiểm tra / 10 phút / IP. Đăng ký xong phát event `UserRegistered` để module customer tạo hồ sơ (kèm họ tên).
- **NSX / HSD** hiểu là `manufacturer` (nhà sản xuất) và `shelfLife` (thời hạn sử dụng) ở mức sản phẩm, không quản lý theo lô.
- **Tìm kiếm không dấu**: cột sinh tự động `search_text = f_unaccent(lower(tên + mô tả ngắn))` + index GIN trigram; từ khóa luôn bind tham số.
- **Ảnh mẫu** là SVG trong `frontend/public/sample/`; ảnh admin upload lưu `backend/uploads/` và phục vụ qua `/uploads/**`.
- **Trang chi tiết sản phẩm không tồn tại** hiển thị giao diện 404 nhưng mã HTTP là 200 (giới hạn của streaming SSR khi dùng Suspense).
- **Giỏ hàng**: khách chưa đăng nhập lưu localStorage (giá chỉ để hiển thị, `POST /api/cart/quote` tính giá thật); sau đăng nhập gộp lên giỏ server (`POST /api/cart/merge`).
- **Trừ kho** khi nhận event `OrderPlaced` (listener ở ordering gọi `InventoryService` của catalog – giữ phụ thuộc một chiều). Bán đồng thời thiếu hàng → hệ thống tự hủy đơn (`OUT_OF_STOCK`).
- **Chống đặt trùng**: client gửi `idempotencyKey` cho mỗi lần bấm "Đặt hàng"; gửi lại cùng key trong 24 giờ nhận lại đúng đơn cũ. Giới hạn 5 đơn / 10 phút / người.
- **Nhóm khách**: DORMANT (lần mua cuối > 60 ngày) ưu tiên, rồi LOYAL (≥ 3 đơn), còn lại NEW. Thống kê không tính đơn hủy / trả hàng.
- **Hạn trả hàng** 7 ngày sau khi giao; job mỗi giờ chuyển đơn quá hạn sang COMPLETED.
- **Đơn chuyển khoản quá hạn**: BANK_QR còn chờ, chưa nhận tiền sau 24 giờ (`hwin.ordering.bank-qr-payment-timeout-hours`) → job 15 phút/lần tự hủy (`PAYMENT_TIMEOUT`), hoàn kho, hủy hoa hồng.
- **Dọn dữ liệu kỹ thuật** hằng đêm: refresh token hết hạn / đã thu hồi > 7 ngày, event nội bộ đã xử lý > 7 ngày, dấu event đã xử lý của customer > 30 ngày.
- **CTV**: hoa hồng = floor(10% × (tạm tính − giảm giá)), không tính ship, 1 cấp. Gắn khách vĩnh viễn ở đơn đầu tiên có mã hợp lệ (`customer_binding.customer_id` UNIQUE); đơn sau luôn tính cho CTV đó kể cả khi mở link CTV khác. Tự giới thiệu (cùng tài khoản hoặc cùng SĐT) không có binding / hoa hồng.
- **Vai trò AFFILIATE** cấp qua event khi admin duyệt; có hiệu lực từ access token kế tiếp (`POST /api/auth/refresh` hoặc đăng nhập lại).
- **Số dư CTV** được tính (hoa hồng APPROVED − rút tiền chưa bị từ chối), không lưu cột số dư → từ chối rút tiền tự trả tiền về. Mỗi CTV tối đa 1 yêu cầu rút đang mở (unique index).
- **Ngân hàng CTV** mã hóa AES-256-GCM (khóa `AFFILIATE_BANK_KEY`); CTV chỉ thấy 4 số cuối; admin xem bản giải mã khi chi trả (ghi audit). Lần thiết lập đầu không khóa rút, các lần đổi sau khóa 48 giờ.
- **Đăng nhập khách / CTV bằng SĐT hoặc email**: OTP gửi tới đúng nơi đã nhập. **Email gửi thật** qua SMTP (dev: Mailpit, xem thư tại http://localhost:18025); **SMS hiện là giả lập** – chỉ dùng được ở dev, môi trường thật báo "vui lòng dùng email". Kế hoạch SMS brandname: `docs/07-otp.md`.
- **Tài khoản đăng nhập bằng email chưa có SĐT**: đăng ký CTV phải nhập SĐT liên hệ; OTP đổi ngân hàng / đăng nhập admin gửi tới email (không có email thì SĐT).
- **Đăng nhập admin 2 bước**: mọi tài khoản role ADMIN phải nhập mật khẩu rồi OTP gửi tới email (hoặc SĐT) của admin. Miễn OTP gắn theo **tài khoản** (cột `otp_exempt`), chỉ tài khoản dev `admin`/`admin` có và chỉ ở profile dev.
- **Admin ở môi trường thật**: backend **từ chối khởi động** nếu `ADMIN_PASSWORD` yếu (< 12 ký tự, thiếu chữ/số, chứa "admin"), không có nơi nhận OTP (`ADMIN_EMAIL` không phải email thật và thiếu `ADMIN_PHONE`), thiếu SMTP (`MAIL_HOST`), bật miễn OTP, hoặc trong DB còn tài khoản miễn OTP.
- **Tài khoản admin không đăng nhập được bằng OTP khách** (`ADMIN_USE_ADMIN_LOGIN`) – tránh bỏ qua bước mật khẩu.
- **Chống dò mật khẩu admin**: chỉ đếm lần đăng nhập **sai** (5 lần / 10 phút / IP).
- **Chỉ ở profile dev**: dữ liệu mẫu (`db/demo`), `GET /api/dev/otp/latest` (lấy OTP cho Postman/test), chạy job duyệt hoa hồng / hủy đơn quá hạn với thời điểm giả lập (`asOf`), nới giới hạn để chạy Postman nhiều lần (OTP theo IP: 50, đặt hàng: 30 đơn / 10 phút).
- **Ảnh VietQR** sinh theo cấu hình `BANK_QR_*` trong `.env` (mặc định là tài khoản giả).
- **Jackson 3** (Spring Boot 4) mặc định báo lỗi khi JSON thiếu field `boolean`/`int` – đã tắt (`spring.jackson.deserialization.fail-on-null-for-primitives=false`), field thiếu nhận giá trị mặc định.
- Màu thương hiệu tạm đặt ở `frontend/src/app/globals.css` (`--brand`, `--brand-accent`).

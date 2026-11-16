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
| 3 | affiliate, trang CTV, trang admin, test domain | Chưa |

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

- **Khóa chính là UUID v7** (sinh bởi Hibernate `@UuidGenerator(style = VERSION_7)`): có thứ tự theo thời gian nên index gọn, không đoán được số bản ghi, sau này tách microservice không lo trùng id. Dữ liệu mẫu chèn bằng SQL dùng `gen_random_uuid()`.
- **Cổng**: backend 8088, frontend 3100, Postgres 15432, Redis 16379 – tránh trùng các dịch vụ đã chạy sẵn trên máy dev (8080, 3000, 5432, 6379 đang bận).
- **Next.js 16** đổi tên `middleware.ts` thành `proxy.ts`; file chặn quyền nằm ở `frontend/src/proxy.ts`.
- **Next.js gọi backend qua rewrite** `/api/*` → cookie JWT là first-party, không cần cấu hình cookie cross-site.
- **CSRF**: tắt CSRF token vì cookie `SameSite=Lax` + CORS chỉ cho domain frontend.
- **Cookie Secure**: bật ở mọi profile trừ `dev` (`COOKIE_SECURE=false`) để chạy được trên `http://localhost`.
- **Refresh token** cookie có `Path=/api/auth` → chỉ gửi kèm API xác thực. Khi access token hết hạn, trang đăng nhập gọi `/api/auth/refresh` trước.
- **Đăng nhập OTP lần đầu** tự tạo tài khoản `CUSTOMER` và phát event `UserRegistered` (module customer sẽ nghe ở Chặng 2).
- **NSX / HSD** hiểu là `manufacturer` (nhà sản xuất) và `shelfLife` (thời hạn sử dụng) ở mức sản phẩm, không quản lý theo lô.
- **Tìm kiếm không dấu**: cột sinh tự động `search_text = f_unaccent(lower(tên + mô tả ngắn))` + index GIN trigram; từ khóa luôn bind tham số.
- **Ảnh mẫu** là SVG trong `frontend/public/sample/`; ảnh admin upload lưu `backend/uploads/` và phục vụ qua `/uploads/**`.
- **Trang chi tiết sản phẩm không tồn tại** hiển thị giao diện 404 nhưng mã HTTP là 200 (giới hạn của streaming SSR khi dùng Suspense).
- **Giỏ hàng**: khách chưa đăng nhập lưu localStorage (giá chỉ để hiển thị, `POST /api/cart/quote` tính giá thật); sau đăng nhập gộp lên giỏ server (`POST /api/cart/merge`).
- **Trừ kho** khi nhận event `OrderPlaced` (listener ở ordering gọi `InventoryService` của catalog – giữ phụ thuộc một chiều). Bán đồng thời thiếu hàng → hệ thống tự hủy đơn (`OUT_OF_STOCK`).
- **Chống đặt trùng**: client gửi `idempotencyKey` cho mỗi lần bấm "Đặt hàng"; gửi lại cùng key trong 24 giờ nhận lại đúng đơn cũ. Giới hạn 5 đơn / 10 phút / người.
- **Nhóm khách**: DORMANT (lần mua cuối > 60 ngày) ưu tiên, rồi LOYAL (≥ 3 đơn), còn lại NEW. Thống kê không tính đơn hủy / trả hàng.
- **Hạn trả hàng** 7 ngày sau khi giao; job mỗi giờ chuyển đơn quá hạn sang COMPLETED.
- **Ảnh VietQR** sinh theo cấu hình `BANK_QR_*` trong `.env` (mặc định là tài khoản giả).
- **Jackson 3** (Spring Boot 4) mặc định báo lỗi khi JSON thiếu field `boolean`/`int` – đã tắt (`spring.jackson.deserialization.fail-on-null-for-primitives=false`), field thiếu nhận giá trị mặc định.
- Màu thương hiệu tạm đặt ở `frontend/src/app/globals.css` (`--brand`, `--brand-accent`).

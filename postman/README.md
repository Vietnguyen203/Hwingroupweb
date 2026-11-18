# Test backend bằng Postman

| File | Nội dung |
|---|---|
| `HWIN.postman_collection.json` | Collection **Hwin Food – API**: mọi API backend, xếp theo luồng sử dụng, mỗi request có test tự kiểm tra |
| `HWIN-local.postman_environment.json` | Environment **Hwin Food – Local**: `baseUrl`, `adminEmail`, `adminPassword` |

## Cách dùng

1. Chạy backend (`backend\run-dev.ps1`) – chờ log `Started HwinApplication`.
2. Postman → **Import** cả 2 file (import lại mỗi khi file thay đổi).
3. Góc trên bên phải chọn environment **Hwin Food – Local** (không chọn sẽ lỗi `ENOTFOUND {{baseUrl}}`).
4. Chạy **theo thứ tự folder 01 → 16** (Run collection, hoặc bấm tay từng request).

### Chạy bằng Postman CLI (không cần mở app)

```bash
postman collection run HWIN.postman_collection.json -e HWIN-local.postman_environment.json --working-dir <thư mục gốc dự án>
```

`--working-dir` cần thiết vì các request tải ảnh dùng tệp mẫu `postman/files/sample.png` (đường dẫn tính từ thư mục gốc dự án).
Chạy cục bộ không cần `postman login`. Lần chạy gần nhất: 191 request, 338 kiểm tra, 0 lỗi.

> Đăng nhập khách/CTV dùng `POST /api/auth/login` (mật khẩu, OTP chỉ khi bật `otpOnLogin`). `POST /api/auth/otp` chỉ dành cho **đăng ký**.

Không cần thao tác tay:

- **SĐT khách và CTV sinh ngẫu nhiên** mỗi lần chạy folder 02.
- **OTP tự lấy** qua `GET /api/dev/otp/latest` – endpoint **chỉ có ở profile dev**.
- **3 phiên đăng nhập song song**: khách = `localhost`, admin = `127.0.0.1`, CTV = `[::1]` (Postman lưu cookie theo host).
- **Hoa hồng không phải chờ 7 ngày**: admin chạy job duyệt với `asOf` = +8 ngày (chỉ dev).

> Phiên đăng nhập (access token) hết hạn sau **15 phút**. Bấm tay chậm mà gặp 401 thì chạy lại request
> "làm mới phiên" trong folder 02 (hoặc chạy lại cả folder 02).

## Thứ tự các folder

| Folder | Nội dung |
|---|---|
| 01. Hệ thống – kiểm tra backend | Health check |
| 02. Đăng nhập / đăng ký (khách, CTV, admin) | Chưa đăng nhập bị 401; khách đăng ký bằng email và bằng SĐT (OTP + họ tên), đăng ký trùng bị chặn, đăng nhập tài khoản chưa có bị chặn, đăng nhập lại; CTV đăng ký tài khoản; admin/admin (dev, miễn OTP) |
| 03. Khách – xem sản phẩm | Danh mục, tìm không dấu, lọc, bán chạy, chi tiết, tính giá giỏ |
| 04. Khách – giỏ hàng | Gộp giỏ, thêm / sửa / xóa, lỗi |
| 05. Khách – đặt hàng & đơn của tôi | COD, idempotencyKey, trừ kho, BANK_QR + VAT, tự hủy, lọc đơn |
| 06. Khách – hồ sơ, sổ địa chỉ, mua lại | Hồ sơ, sổ địa chỉ, sản phẩm hay mua, mua lại |
| 07. Admin – sản phẩm & danh mục | CRUD danh mục / sản phẩm, kho, upload ảnh |
| 08. Admin – xử lý đơn & khách hàng | Vòng đời đơn COD / QR, lọc khách, xuất CSV |
| 09. CTV – đăng ký làm cộng tác viên | Đăng ký, chưa duyệt bị 403 |
| 10. Admin – duyệt CTV | Duyệt → sinh mã giới thiệu |
| 11. CTV – nhận quyền & tài khoản ngân hàng | Nhận vai trò AFFILIATE, dashboard, đổi ngân hàng bằng OTP, lỗi rút tiền |
| 12. CTV – link giới thiệu → hoa hồng → rút tiền | Click link (cookie ref), khách đặt đơn ~2 triệu, hoa hồng 10%, chặn tự giới thiệu, job duyệt +8 ngày, rút 200.000, admin duyệt + chi trả |
| 13. Admin – nhật ký & đơn chuyển khoản quá hạn | Nhật ký kiểm toán; đơn QR chưa thanh toán bị hủy sau 24h (giả lập +25h) |
| 14. Admin – khóa / mở khóa CTV | Link bị khóa không đặt cookie, CTV mất vai trò, mở khóa giữ mã |
| 15. Admin – tài khoản quản trị & đăng nhập 2 bước | Tạo admin (chặn mật khẩu yếu, thiếu SĐT), đăng nhập mật khẩu → OTP, admin không vào được bằng OTP khách |
| 16. Phân quyền & đăng xuất | Khách gọi API admin bị 403, đăng xuất, 401 |

## Chạy bằng Postman CLI

```powershell
postman collection run postman/HWIN.postman_collection.json -e postman/HWIN-local.postman_environment.json
```

> Folder 13 giả lập +25 giờ nên hủy MỌI đơn chuyển khoản chưa thanh toán, kể cả đơn mẫu `HWDEMO0003`.
> Mỗi lần chạy tạo thêm dữ liệu test (khách, CTV, đơn, hoa hồng, rút tiền) trong DB dev.

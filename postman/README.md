# Test backend bằng Postman

| File | Nội dung |
|---|---|
| `HWIN.postman_collection.json` | Tất cả API backend đã có, chia theo nhóm, mỗi request có test tự kiểm tra |
| `HWIN-local.postman_environment.json` | Biến môi trường: `baseUrl`, `phone`, `otp`, `adminEmail`, `adminPassword` |

## Cách dùng

1. Chạy backend (`backend\run-dev.ps1`) – chờ log `Started HwinApplication`.
2. Postman → **Import** cả 2 file trong thư mục này (import lại mỗi khi file thay đổi).
3. Chọn environment **HWIN Local** → chuột phải collection → **Run collection** (chạy folder 0 → 14).

Không cần thao tác tay:

- **SĐT khách và CTV sinh ngẫu nhiên** mỗi lần chạy (không dính giới hạn 3 OTP / 10 phút / SĐT).
- **OTP tự lấy** qua `GET /api/dev/otp/latest` – endpoint **chỉ có ở profile dev**.
- **3 phiên đăng nhập song song**: khách = `localhost`, admin = `127.0.0.1`, CTV = `[::1]` (Postman lưu cookie theo host).
- **Hoa hồng không phải chờ 7 ngày**: admin chạy job duyệt với `asOf` = +8 ngày (chỉ dev).

## Các nhóm request

| Folder | Nội dung |
|---|---|
| 0. Hệ thống | Health check |
| 1. Catalog (công khai) | Danh mục, tìm không dấu, chi tiết, tính giá giỏ ẩn danh |
| 2. Chuẩn bị & gửi OTP | Sinh SĐT ngẫu nhiên, gửi OTP cho khách và CTV |
| 3. Đăng nhập & phiên | OTP sai / đúng, thông tin của tôi, xoay vòng refresh token |
| 4. Giỏ hàng | Gộp giỏ, thêm / sửa / xóa, lỗi |
| 5. Đặt hàng & đơn của tôi | COD, idempotencyKey, trừ kho, BANK_QR + VAT, tự hủy, lọc đơn |
| 6. Tài khoản khách | Hồ sơ, sổ địa chỉ, sản phẩm hay mua, Mua lại |
| 7. Admin – catalog | Đăng nhập admin, CRUD danh mục / sản phẩm, kho, upload |
| 8. Admin – đơn hàng & khách hàng | Vòng đời đơn COD / QR, lọc khách, xuất CSV |
| 9. CTV – đăng ký | Đăng nhập CTV, đăng ký, chưa duyệt bị 403 |
| 10. Admin – duyệt CTV | Duyệt → sinh mã giới thiệu |
| 11. CTV – sau khi duyệt & tài khoản ngân hàng | Nhận vai trò AFFILIATE, dashboard, đổi ngân hàng bằng OTP, các lỗi rút tiền |
| 12. Đơn qua link CTV → hoa hồng → rút tiền | Click link (cookie ref), khách đặt đơn ~2 triệu, hoa hồng 10%, chặn tự giới thiệu, giao hàng, job duyệt +8 ngày, rút 200.000, admin duyệt + chi trả |
| 13. Admin – tạm khóa / mở khóa CTV | Link bị khóa không đặt cookie, CTV mất vai trò, mở khóa giữ mã |
| 14. Đăng xuất & phân quyền (khách) | Khách gọi API admin bị 403, đăng xuất, 401 |

## Chạy bằng Postman CLI

```powershell
postman collection run postman/HWIN.postman_collection.json -e postman/HWIN-local.postman_environment.json
```

Lần chạy gần nhất: **147 request, 263 kiểm tra, 0 lỗi** (chạy lặp lại nhiều lần liên tiếp vẫn đạt).

> Mỗi lần chạy tạo thêm dữ liệu test (khách, CTV, đơn, hoa hồng, rút tiền) trong DB dev.

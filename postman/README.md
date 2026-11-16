# Test backend bằng Postman

| File | Nội dung |
|---|---|
| `HWIN.postman_collection.json` | Tất cả API backend đã có, chia theo nhóm, mỗi request có test tự kiểm tra |
| `HWIN-local.postman_environment.json` | Biến môi trường: `baseUrl`, `phone`, `otp`, `adminEmail`, `adminPassword` |

## Cách dùng

1. Chạy backend (xem README gốc) – chờ log `Started HwinApplication`.
2. Postman → **Import** → chọn cả 2 file trong thư mục này.
3. Góc trên bên phải chọn environment **HWIN Local**.
4. Chạy từng request, hoặc chuột phải một folder → **Run folder**.

## Các nhóm request (chạy theo thứ tự 0 → 9)

| Folder | Nội dung |
|---|---|
| 0. Hệ thống | Health check |
| 1. Catalog (công khai) | Danh mục, tìm kiếm không dấu, chi tiết, tính giá giỏ ẩn danh; lưu id sản phẩm dùng cho các folder sau |
| 2. Gửi OTP | Gửi OTP – lấy mã ở log backend, điền vào biến `otp` |
| 3. Đăng nhập & phiên | OTP sai / đúng, thông tin của tôi, xoay vòng refresh token |
| 4. Giỏ hàng | Gộp giỏ localStorage, thêm / đổi số lượng / xóa, các trường hợp lỗi |
| 5. Đặt hàng & đơn của tôi | Đặt COD, gửi lại cùng idempotencyKey, kiểm tra trừ kho, đặt BANK_QR + VAT (ảnh VietQR), khách tự hủy, xem / lọc đơn |
| 6. Tài khoản khách | Hồ sơ + thống kê, sổ địa chỉ (mặc định), sản phẩm hay mua, Mua lại |
| 7. Đăng xuất & phân quyền | Khách gọi API admin bị 403, đăng xuất, sau đăng xuất 401 |
| 8. Admin – catalog | CRUD danh mục / sản phẩm, tồn kho, upload ảnh (mặc định dev: `admin` / `admin`) |
| 9. Admin – đơn hàng & khách hàng | Trọn vòng đời đơn COD (xác nhận → giao → trả hàng), đơn QR (xác nhận tiền → xác nhận → hủy), lọc khách theo nhóm, xuất CSV |

## Chạy bằng Postman CLI

Chạy cả collection (lệnh chạy ở thư mục gốc dự án). Lần chạy gần nhất: 90 request, 160 kiểm tra, 0 lỗi.

```powershell
# Bước 1: gửi OTP (đổi phone nếu đã gửi quá 3 lần / 10 phút)
postman collection run postman/HWIN.postman_collection.json -e postman/HWIN-local.postman_environment.json -i "2. Gửi OTP"

# Bước 2: lấy mã trong log backend rồi chạy phần còn lại (thay 123456 bằng mã thật)
postman collection run postman/HWIN.postman_collection.json -e postman/HWIN-local.postman_environment.json --env-var otp=123456 -i "0. Hệ thống" -i "1. Catalog (công khai)" -i "3. Đăng nhập & phiên" -i "4. Giỏ hàng" -i "5. Đặt hàng & đơn của tôi" -i "6. Tài khoản khách" -i "7. Đăng xuất & phân quyền" -i "8. Admin – catalog" -i "9. Admin – đơn hàng & khách hàng"
```

> Request "Upload ảnh" dùng file mẫu `postman/files/sample.png` (đường dẫn tính từ thư mục gốc dự án). Trong Postman app, nếu báo thiếu file thì chọn lại ở tab Body.

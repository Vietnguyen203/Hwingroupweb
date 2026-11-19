# OTP qua email và SMS brandname

## Hiện trạng

| Kênh | Trạng thái | Dev | Môi trường thật |
|---|---|---|---|
| **Email** | Gửi thật qua SMTP | Mailpit (`compose.yaml`) – xem thư tại http://localhost:18025 | Bắt buộc cấu hình `MAIL_*`, thiếu thì backend từ chối khởi động |
| **SMS** | **Giả lập** | Mã in ra log + lấy qua `GET /api/dev/otp/latest` | Báo lỗi `OTP_CHANNEL_UNAVAILABLE` ("vui lòng dùng email") |

- Khách / CTV chọn **SĐT hoặc email** khi đăng nhập; OTP gửi tới đúng nơi đã nhập.
- OTP bảo mật (đăng nhập admin, đổi tài khoản ngân hàng CTV) gửi tới **email** của tài khoản nếu có, không thì SĐT.
- Code: port `OtpSender` (`identity/service/integration`) – mỗi kênh một implementation:
  `EmailOtpSender`, `SimulatedSmsOtpSender`. Thêm SMS thật = viết implementation mới cho kênh `SMS`,
  không sửa `OtpService`.

- **Email được gửi nền**: `EmailOtpSender` đưa việc gửi SMTP sang luồng ảo nên API `/api/auth/otp` trả lời ngay sau khi lưu mã vào Redis (kết nối Gmail mất vài giây). Web sang bước nhập OTP ngay, thư đến sau. Gửi thư lỗi chỉ ghi log (`Gửi email OTP tới ... thất bại`), không còn trả lỗi `OTP_SEND_FAILED` cho người dùng; mã vẫn hợp lệ và người dùng bấm gửi lại được.

### Cấu hình SMTP (môi trường thật)

```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...            # Gmail: dùng App Password, không dùng mật khẩu đăng nhập
MAIL_FROM=Hwin Food <no-reply@hwin.vn>
```

Có thể thay bằng SendGrid / Amazon SES / Mailgun (đều có SMTP). Nên cấu hình SPF + DKIM cho domain gửi
để email không vào thư rác.

## Kế hoạch SMS brandname (làm sau)

### 1. Thủ tục với nhà cung cấp (eSMS, SpeedSMS, VietGuys…)

1. Mở tài khoản doanh nghiệp.
2. Chọn brandname: tối đa 11 ký tự, không dấu, ví dụ `HWINFOOD`.
3. Hồ sơ: giấy phép kinh doanh, giấy tờ chứng minh quyền dùng tên (logo / website / nhãn hiệu), công văn đăng ký.
4. Đăng ký **mẫu tin OTP** để nhà mạng duyệt – nội dung gửi phải khớp mẫu, ví dụ:
   `Ma xac thuc HWIN cua ban la {code}. Hieu luc 5 phut. Khong chia se ma nay cho bat ky ai.`
5. Chờ nhà mạng duyệt (thường 1–3 tuần, từng nhà mạng có thể duyệt riêng).
6. Nạp tiền (mỗi tin OTP vài trăm đồng – **chưa xác minh giá cụ thể**).

Trong lúc chờ duyệt: hỏi nhà cung cấp về tài khoản thử nghiệm / đầu số mặc định (tùy hãng, chưa kiểm chứng).

### 2. Cấu hình dự kiến

```
SMS_PROVIDER=esms
SMS_API_KEY=...
SMS_SECRET_KEY=...
SMS_BRANDNAME=HWINFOOD
SMS_OTP_TEMPLATE=Ma xac thuc HWIN cua ban la {code}. Hieu luc 5 phut. Khong chia se ma nay cho bat ky ai.
```

Tên biến sẽ chốt theo API của nhà cung cấp được chọn (đọc tài liệu API của hãng trước khi code).

### 3. Việc cần làm trong code

- Viết `XxxSmsOtpSender implements OtpSender` (kênh `SMS`), thay `SimulatedSmsOtpSender` khi có cấu hình.
- Dev vẫn giữ giả lập (in mã ra log).
- Gửi lỗi / hết tiền → báo lỗi rõ ràng, không coi như đã gửi.
- Môi trường thật thiếu khóa API → backend từ chối khởi động (như SMTP).
- Không log mã OTP, không log khóa API.

# CLAUDE.md

## Phong cách trả lời (mặc định cho mọi phản hồi)

1. **Đi thẳng vào vấn đề**: trả lời trực tiếp, không mở đầu dài dòng.
2. **Chỉ nêu ý chính**: bỏ thông tin thừa, lặp lại, giải thích không cần thiết.
3. **Dễ hiểu**: ngôn ngữ đơn giản; thuật ngữ chuyên ngành bắt buộc dùng thì giải thích ngắn.
4. **Có cấu trúc**: ưu tiên gạch đầu dòng, bảng, các bước ngắn.
5. **Giới hạn độ dài**: mặc định 3–7 gạch đầu dòng hoặc 1–3 đoạn ngắn.
6. **Không lan man**: không mở rộng sang chủ đề khác ngoài phạm vi câu hỏi.
7. **Không nhắc lại yêu cầu** của người dùng.
8. **Ưu tiên hành động**: hướng dẫn bằng các bước cụ thể, làm theo được ngay.
9. **Chỉ phân tích sâu khi cần**: khi được yêu cầu hoặc khi vấn đề phức tạp dễ hiểu sai.
10. **Trung thực**: không chắc thì nói rõ; không trình bày điều chưa xác minh như sự thật.

**Quy tắc quan trọng**

- Ngắn gọn nhưng không thiếu ý quan trọng; không đánh đổi độ chính xác lấy sự ngắn gọn.
- Không viết thành bài luận khi chỉ cần câu trả lời.
- Hỏi một vấn đề thì đưa một phương án, không tự liệt kê nhiều phương án.

## Dự án

- Thiết kế hệ thống: xem `docs/01`–`05`. Code lệch thiết kế thì cập nhật docs cho khớp.
- Comment và tài liệu viết tiếng Việt; tên class, biến, bảng, API viết tiếng Anh.

## Quy ước đặt tên (BẮT BUỘC)

### Backend (Java)
- Tên class / biến / bảng / API bằng tiếng Anh; không viết tắt tiếng Việt (Ctv → Affiliate).
- Mỗi file một class / record / enum; không gom kiểu `*Dtos.java`, `*Enums.java`.
- Một khái niệm = một tên, khớp bảng thuật ngữ `docs/01`: `OrderItem` (không dùng OrderLine), `ProductSnapshot` (dữ liệu catalog trả cho module khác), `FoodInfo`, `common.domain.Address`.
- Hậu tố theo vai trò:

| Loại | Mẫu tên | Thư mục |
|---|---|---|
| Controller khách | `<Resource>Controller` | `api/` |
| Controller admin | `Admin<Resource>Controller` | `api/` |
| Request / Response | `<Action><Resource>Request` / `<Resource>Response` | `api/dto/` |
| Mapper | `<Resource>Mapper` | `api/mapper/` |
| Aggregate / Entity / VO | danh từ: `Order`, `Commission`, `Money` | `entity/` |
| Enum | `<Concept>Status`, `<Concept>Type`... | `entity/` |
| Domain event | `<Aggregate><PastVerb>Event` | `entity/event/` |
| Repository | `<Aggregate>Repository` | `repository/` |
| Use case | `<Resource>Service`, `<Resource>QueryService` (đọc), `<Resource>AdminService` (admin) | `service/` |
| Lắng nghe event | `<Concept>EventListener` | `service/listener/` |
| Job định kỳ | `<Action>Job` | `service/job/` |
| `@ConfigurationProperties` | `<Module>Properties` | `service/config/` |
| Command / kết quả nội bộ | `<Action>Command` / `<Action>Result` | `service/model/` |
| Port + adapter ngoài | `<Port>` (interface), `<Impl><Port>` | `service/integration/` |

- URL: `/api/<resource-số-nhiều>` (khách), `/api/admin/<resource-số-nhiều>` (admin), `/api/me/...` (dữ liệu của chính user), `/api/affiliates/me/...` (CTV), `/api/dev/...` (chỉ dev). Mỗi controller một prefix riêng.
- Bảng DB: snake_case, số nhiều (`orders`, `order_items`); cột snake_case.
- Flyway: `V<module>_<thứ-tự 3 số>__<mô_tả>.sql`; module: common=1, identity=2, catalog=3, customer=4, ordering=5, affiliate=6, demo=9.

### Frontend (Next.js)
- File / thư mục kebab-case; component PascalCase; hook `use-*.ts`; store `*-store.ts`.
- URL trang khách tiếng Việt không dấu, không viết tắt: `/danh-muc/[slug]`, `/san-pham/[slug]`, `/gio-hang`, `/tim-kiem`, `/thanh-toan`, `/tai-khoan/don-hang`, `/dang-nhap`, `/dang-ky`, `/ctv`, `/admin`.
- Type / field khớp đúng tên DTO backend.

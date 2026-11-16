# Xem database bằng DBeaver

## Kết nối

Database → New Database Connection → **PostgreSQL**:

| Trường | Giá trị |
|---|---|
| Host | `localhost` |
| Port | `15432` |
| Database | `hwin` |
| Username | `hwin` |
| Password | giá trị `DB_PASSWORD` trong `backend/.env` (mặc định dev: `hwin_dev`) |

Tab **PostgreSQL** → tick **Show all databases** không cần. Bấm **Test Connection** (lần đầu DBeaver sẽ hỏi tải driver – đồng ý).

> Postgres chạy trong Docker (`backend/compose.yaml`), tự bật khi chạy backend. Nếu backend chưa chạy:
> `cd backend; docker compose up -d`

## Cấu trúc

Danh sách đầy đủ mọi bảng/cột/ràng buộc: [`docs/06-database.md`](../docs/06-database.md) (sinh tự động từ DB).
Mỗi bảng và các cột quan trọng đều có mô tả tiếng Việt – trong DBeaver xem ở tab **Properties** của bảng hoặc cột **Comment**.

Mỗi module một schema – mở **hwin → Schemas**:

| Schema | Bảng chính |
|---|---|
| `identity` | `user_account`, `user_role`, `refresh_token` |
| `catalog` | `category`, `product`, `product_image`, `stock_movement` |
| `ordering` | `cart`, `cart_item`, `orders`, `order_item`, `order_status_history` |
| `customer` | `customer`, `customer_address`, `customer_stats`, `customer_product_stat` |
| `affiliate` | (Chặng 3) |

> `customer_stats`, `customer_product_stat` là read model – được cập nhật vài trăm mili-giây sau khi đặt/hủy đơn (qua event).
| `audit` | `audit_log` – chỉ ghi thêm, sửa/xóa sẽ báo lỗi |
| `public` | `flyway_schema_history` (lịch sử migration), `event_publication` (event nội bộ) |

Không có foreign key giữa các schema – chỉ lưu ID (thiết kế DDD, xem `docs/02-erd.md`).

## Câu SQL hay dùng

Mở `queries.sql` trong DBeaver (File → Open File) rồi chạy từng câu bằng **Ctrl+Enter**.

## Xóa sạch dữ liệu, tạo lại từ đầu

Dừng backend rồi chạy (mất toàn bộ dữ liệu dev, Flyway sẽ tạo lại + nạp dữ liệu mẫu khi backend khởi động):

```powershell
cd backend; docker compose down -v
```

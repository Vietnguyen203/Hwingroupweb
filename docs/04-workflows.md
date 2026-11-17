# 04 – Vòng đời trạng thái và quy trình nghiệp vụ

Mỗi chuyển trạng thái là **một method của aggregate root**. Chuyển sai quy tắc → `DomainException` (HTTP 409 `INVALID_STATE_TRANSITION`).

---

## 1. Order

![04-state-order](images/04-state-order.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
stateDiagram-v2
    [*] --> PENDING: place()
    PENDING --> CONFIRMED: confirm() – BANK_QR phải PAID trước
    PENDING --> CANCELLED: cancel() – khách / admin / hết hàng
    CONFIRMED --> SHIPPING: markShipping()
    CONFIRMED --> CANCELLED: cancel() – chỉ admin
    SHIPPING --> DELIVERED: markDelivered() – COD tự PAID
    DELIVERED --> COMPLETED: complete() – job, hết 7 ngày đổi trả
    DELIVERED --> RETURNED: markReturned() – trong 7 ngày
    CANCELLED --> [*]
    COMPLETED --> [*]
    RETURNED --> [*]

    note right of PENDING
        paymentStatus UNPAID/PAID là trường riêng.
        markPaid(paymentRef) cho BANK_QR do admin bấm,
        được phép ở PENDING hoặc CONFIRMED.
    end note
```

</details>

| Method | Từ | Sang | Event | Ai gọi |
|---|---|---|---|---|
| `place()` | – | PENDING | `OrderPlacedEvent` | Khách |
| `markPaid(ref)` | PENDING, CONFIRMED (UNPAID) | (payment PAID) | – (audit `ORDER_PAID`) | Admin |
| `confirm()` | PENDING | CONFIRMED | `OrderConfirmedEvent` | Admin |
| `cancel(reason)` | PENDING (khách), PENDING/CONFIRMED (admin, system) | CANCELLED | `OrderCancelledEvent` | Khách / Admin / `OrderStockEventListener` |
| `markShipping()` | CONFIRMED | SHIPPING | – | Admin |
| `markDelivered()` | SHIPPING | DELIVERED | `OrderDeliveredEvent` | Admin |
| `markReturned()` | DELIVERED (≤ 7 ngày) | RETURNED | `OrderReturnedEvent` | Admin |
| `complete()` | DELIVERED (> 7 ngày) | COMPLETED | `OrderCompletedEvent` | Job |

> Khách chỉ tự hủy được khi đơn còn `PENDING`; khi đã `CONFIRMED` phải liên hệ shop (admin hủy).

---

## 2. Affiliate

![04-state-affiliate](images/04-state-affiliate.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
stateDiagram-v2
    [*] --> PENDING: register()
    PENDING --> APPROVED: approve() – sinh ReferralCode, cấp role AFFILIATE
    PENDING --> REJECTED: reject(reason)
    APPROVED --> SUSPENDED: suspend(reason) – link ngừng hoạt động
    SUSPENDED --> APPROVED: reinstate()
    REJECTED --> PENDING: reapply() – sau khi bổ sung thông tin
```

</details>

| Trạng thái | Link `?ref` | Hoa hồng mới | Rút tiền số dư cũ |
|---|---|---|---|
| PENDING | Không | Không | – |
| APPROVED | **Có** | **Có** | Có |
| SUSPENDED | Không (click bị bỏ qua) | Không | **Không** (chờ admin xử lý) |
| REJECTED | Không | Không | – |

---

## 3. Commission

![04-state-commission](images/04-state-commission.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
stateDiagram-v2
    [*] --> PENDING: create() khi OrderPlacedEvent
    PENDING --> PENDING: markEligible(deliveredAt + 7 ngày) khi OrderDeliveredEvent
    PENDING --> APPROVED: approve() – job, eligibleAt ≤ now
    PENDING --> CANCELLED: cancel() khi OrderCancelledEvent / OrderReturnedEvent
    APPROVED --> [*]
    CANCELLED --> [*]
```

</details>

- `approve()` ném `DomainException` nếu `eligibleAt == null` (đơn chưa giao) hoặc chưa đủ 7 ngày.
- Không có trạng thái PAID ở Commission: việc chi trả được theo dõi ở `Payout`; số dư được **tính**, không cộng trừ trực tiếp → một transaction chỉ sửa một aggregate.
- Vì cửa sổ đổi trả (7 ngày) = thời gian giữ (7 ngày), một commission APPROVED không thể bị hủy do trả hàng.

---

## 4. Payout

![04-state-payout](images/04-state-payout.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
stateDiagram-v2
    [*] --> REQUESTED: request() – amount ≥ 200.000 và ≤ số dư
    REQUESTED --> APPROVED: approve()
    REQUESTED --> REJECTED: reject(reason)
    APPROVED --> PAID: markPaid(transactionRef)
    APPROVED --> REJECTED: reject(reason)
    PAID --> [*]
    REJECTED --> [*]

    note right of REJECTED
        Số tiền tự trở về số dư khả dụng
        vì công thức số dư bỏ qua payout REJECTED
    end note
```

</details>

---

## 5. Quy trình đăng ký và duyệt CTV

![04-flow-affiliate-onboarding](images/04-flow-affiliate-onboarding.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
flowchart TD
    S([Người dùng vào /affiliate]) --> L{Đã đăng nhập?}
    L -- Chưa --> OTP[Đăng nhập SĐT + OTP<br/>tự tạo tài khoản CUSTOMER]
    OTP --> HAS
    L -- Rồi --> HAS{Đã có hồ sơ CTV?}
    HAS -- Có --> ST{Trạng thái}
    ST -- PENDING --> WAIT[Hiển thị: Đang chờ duyệt]
    ST -- APPROVED --> DASH[Vào dashboard CTV]
    ST -- REJECTED --> RJ[Hiển thị lý do + nút Đăng ký lại]
    ST -- SUSPENDED --> SUS[Hiển thị: Tạm khóa, liên hệ admin]
    HAS -- Chưa --> FORM[Điền form: họ tên, link kênh bán, ghi chú<br/>đồng ý điều khoản CTV]
    FORM --> REG[POST /api/affiliates/me → Affiliate PENDING]
    RJ --> FORM
    REG --> WAIT

    WAIT -.-> ADMQ[Admin: danh sách CTV PENDING]
    ADMQ --> CHK{Admin kiểm tra<br/>kênh bán, SĐT}
    CHK -- Đạt --> APV[approve → sinh ReferralCode duy nhất<br/>AffiliateApprovedEvent]
    CHK -- Không đạt --> REJ[reject kèm lý do]
    APV --> ROLE[Listener cấp role AFFILIATE trong identity]
    ROLE --> DASH
    DASH --> BANK[CTV nhập tài khoản ngân hàng<br/>xác thực OTP]
    BANK --> SHARE[Copy link /?ref=CODE hoặc /p/slug?ref=CODE<br/>chia sẻ lên Facebook, TikTok, Zalo]
```

</details>

---

## 6. Quy trình xử lý đơn hằng ngày của admin

![04-flow-admin-daily-orders](images/04-flow-admin-daily-orders.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
flowchart TD
    A([Đầu ngày: /admin/orders lọc PENDING]) --> PM{Phương thức?}
    PM -- BANK_QR --> BQ{Đã nhận tiền?<br/>đối chiếu sao kê theo orderCode}
    BQ -- Có --> PAID[markPaid nhập mã giao dịch] --> CF
    BQ -- Chưa, quá 24h --> CX[Gọi khách, nếu không thanh toán → cancel]
    BQ -- Chưa --> NEXT[Để lại, xem sau]
    PM -- COD --> CALL{Gọi xác nhận khách?<br/>đơn lớn hoặc khách mới}
    CALL -- Khách xác nhận / không cần --> CF[confirm → CONFIRMED]
    CALL -- Khách hủy / không liên lạc được --> CX
    CF --> PACK[Đóng gói, in phiếu, kiểm HSD lô hàng]
    PACK --> SH[Bàn giao vận chuyển → markShipping]
    SH --> DL{Kết quả giao}
    DL -- Thành công --> DV[markDelivered → OrderDeliveredEvent<br/>COD tự PAID]
    DL -- Khách trả lại / hàng lỗi --> RT[Trong 7 ngày: markReturned → OrderReturnedEvent]
    DV --> WIN{Khách khiếu nại trong 7 ngày?}
    WIN -- Có, chấp nhận trả --> RT
    WIN -- Không --> CP[Job tự complete → COMPLETED]
    CX --> E([Hoàn kho + hủy hoa hồng tự động])
    RT --> E
    CP --> E2([Hoa hồng đã được job duyệt sau 7 ngày])
```

</details>

---

## 7. Quy trình đối soát và chi trả hoa hồng

![04-flow-commission-payout](images/04-flow-commission-payout.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
flowchart TD
    J([Job mỗi giờ]) --> J1[Commission PENDING có eligibleAt ≤ now → APPROVED]
    J1 --> BAL[Số dư khả dụng CTV tăng]
    BAL --> REQ{CTV yêu cầu rút}
    REQ --> V1{Số dư ≥ 200.000?}
    V1 -- Không --> NO1[Nút rút bị khóa, hiển thị còn thiếu bao nhiêu]
    V1 -- Có --> V2{Đổi ngân hàng trong 48h?}
    V2 -- Có --> NO2[Chặn, hiển thị thời điểm được rút]
    V2 -- Không --> V3{Đang có payout mở?}
    V3 -- Có --> NO3[Chặn]
    V3 -- Không --> RQ[Payout REQUESTED<br/>snapshot ngân hàng mã hóa, audit]

    RQ --> AD[Admin: /admin/payouts REQUESTED<br/>định kỳ thứ 2 và thứ 5]
    AD --> REC{Đối soát:<br/>tổng commission APPROVED của CTV<br/>khớp số dư? đơn liên quan đã COMPLETED?}
    REC -- Không khớp / nghi gian lận --> RJ[reject kèm lý do → tiền về số dư]
    REC -- Khớp --> AP[approve]
    AP --> TF[Chuyển khoản thủ công qua internet banking]
    TF --> MP[markPaid nhập transactionRef → PAID, audit]
    MP --> EXP[Xuất báo cáo chi trả tháng từ audit_logs]
    RJ --> BAL
```

</details>

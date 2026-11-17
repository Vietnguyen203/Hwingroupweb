# 03 – Sơ đồ tuần tự

Ký hiệu chung:

- `FE` = Next.js (trình duyệt hoặc server SSR). Mọi lời gọi `/api/*` đi qua rewrite của Next.js tới Spring Boot nên cookie là first-party.
- Mũi tên nét đứt `-->>` từ `Bus` = event nội bộ phát qua `ApplicationEventPublisher`, listener `@ApplicationModuleListener` chạy **async, sau commit, transaction mới**; Spring Modulith lưu vào `event_publication` để retry.

---

## a. Đăng nhập OTP + cấp và xoay vòng JWT

![03-seq-a-otp-login](images/03-seq-a-otp-login.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
sequenceDiagram
    autonumber
    actor U as Người dùng
    participant FE as Next.js
    participant AC as identity AuthController
    participant OS as OtpService
    participant R as Redis
    participant SND as OtpSender (log)
    participant AS as AuthService
    participant TS as TokenService
    participant DB as PostgreSQL identity
    participant Bus as Event bus

    U->>FE: Nhập SĐT
    FE->>AC: POST /api/auth/otp {phone}
    AC->>OS: send(phone, LOGIN, ip)
    OS->>OS: PhoneNumber.of(phone) chuẩn hóa +84
    OS->>R: Kiểm tra otp:lock, INCR rl:otp:phone, rl:otp:ip
    alt Bị khóa hoặc vượt 3 lần / 10 phút
        OS-->>AC: TooManyRequests
        AC-->>FE: 429
    else Hợp lệ
        OS->>OS: Sinh OTP 6 số (SecureRandom)
        OS->>R: SET otp:LOGIN:phone = hash(otp), attempts=0, TTL 5 phút
        OS->>SND: send(phone, otp)
        Note over SND: Demo: in OTP ra log (chỉ profile dev)
        AC-->>FE: 202 {expiresIn: 300}
    end

    U->>FE: Nhập OTP
    FE->>AC: POST /api/auth/otp/verify {phone, otp}
    AC->>OS: verify(phone, LOGIN, otp)
    OS->>R: GET otp:LOGIN:phone
    alt Sai OTP
        OS->>R: HINCRBY attempts
        opt attempts = 5
            OS->>R: SET otp:lock:phone TTL 15 phút, DEL otp
        end
        AC-->>FE: 400 OTP_INVALID {remainingAttempts}
    else Đúng OTP
        OS->>R: DEL otp:LOGIN:phone
        AC->>AS: loginOrRegister(phone)
        AS->>DB: findByPhone
        opt Chưa có tài khoản
            AS->>DB: INSERT user_accounts + role CUSTOMER
            AS->>Bus: publish UserRegisteredEvent(userId, phone)
        end
        AS->>TS: issue(user)
        TS->>TS: Ký access JWT 15 phút (sub, roles)
        TS->>DB: INSERT refresh_tokens(hash, familyId mới, 7 ngày)
        AC-->>FE: 200 + Set-Cookie hwin_at, hwin_rt (HttpOnly, Secure, SameSite=Lax)
    end

    Note over FE,AC: 15 phút sau – access token hết hạn
    FE->>AC: Gọi API bất kỳ → 401 TOKEN_EXPIRED
    FE->>AC: POST /api/auth/refresh (cookie hwin_rt, path=/api/auth)
    AC->>TS: rotate(rawRefresh)
    TS->>DB: SELECT refresh_tokens WHERE token_hash = sha256(raw)
    alt Token đã bị thu hồi (bị dùng lại)
        TS->>DB: UPDATE revoked_at cho cả family_id
        AC-->>FE: 401 + xóa cookie → đăng nhập lại
    else Hết hạn hoặc không tồn tại
        AC-->>FE: 401 + xóa cookie
    else Hợp lệ
        TS->>DB: Thu hồi token cũ, INSERT token mới cùng family, replaced_by_id
        AC-->>FE: 200 + Set-Cookie hwin_at, hwin_rt mới
        FE->>AC: Gọi lại API ban đầu
    end
```

</details>

---

## b. Ghi nhận click link CTV (?ref)

![03-seq-b-referral-click](images/03-seq-b-referral-click.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
sequenceDiagram
    autonumber
    actor K as Khách (điện thoại)
    participant FE as Next.js proxy.ts + trang
    participant RC as affiliate ReferralClickController
    participant RS as ReferralClickService
    participant R as Redis
    participant DB as PostgreSQL affiliate

    K->>FE: Mở /p/cha-lua?ref=ABC123 (link CTV chia sẻ)
    FE->>FE: proxy.ts đọc ?ref, kiểm tra định dạng A-Z0-9
    FE->>RC: POST /api/referral-clicks {code, landingPath} (kèm IP, UA)
    RC->>RS: record(code, ip, ua, path)
    RS->>DB: findByReferralCode(code)
    alt Không tồn tại hoặc CTV không APPROVED
        RS-->>RC: ignored
        RC-->>FE: 204 (không đặt cookie)
    else CTV APPROVED
        RS->>R: SET NX click:ABC123:ipHash EX 24h
        alt Key mới
            RS->>DB: INSERT referral_clicks(ipHash, ua, path)
        else Đã click trong 24h
            Note over RS: Không đếm trùng
        end
        RC-->>FE: 204 + Set-Cookie hwin_ref=ABC123 (HttpOnly, 30 ngày)
    end
    FE-->>K: Trang sản phẩm (SSR)
    Note over FE: Cookie ref mới ghi đè cookie cũ, nhưng việc GẮN KHÁCH<br/>chỉ xảy ra ở đơn đầu tiên (first-touch, xem luồng d)
```

</details>

---

## c. Thanh toán và đặt hàng (kèm tạo tài khoản bằng OTP)

![03-seq-c-checkout](images/03-seq-c-checkout.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
sequenceDiagram
    autonumber
    actor K as Khách
    participant FE as Next.js /checkout
    participant ID as identity (luồng a)
    participant CART as ordering CartController
    participant CUS as customer MyAddressController
    participant CO as ordering CheckoutController
    participant PS as PlaceOrderService
    participant PQ as catalog ProductQueryService
    participant O as Order (aggregate)
    participant DB as PostgreSQL ordering
    participant Bus as Event bus

    K->>FE: Bấm "Thanh toán" (giỏ trong localStorage)
    alt Chưa đăng nhập
        FE-->>K: Bước 1: nhập SĐT
        K->>FE: SĐT
        FE->>ID: POST /api/auth/otp
        K->>FE: Bước 2: nhập OTP
        FE->>ID: POST /api/auth/otp/verify
        ID-->>FE: Cookie JWT (tạo tài khoản CUSTOMER nếu mới)
        FE->>CART: POST /api/me/cart/merge {items từ localStorage}
        CART-->>FE: Giỏ server đã gộp, xóa localStorage
    end

    FE->>CUS: GET /api/me/addresses
    CUS-->>FE: Danh sách địa chỉ (có mặc định)
    K->>FE: Bước 3: chọn / nhập địa chỉ
    opt Lưu địa chỉ mới
        FE->>CUS: POST /api/me/addresses
    end
    K->>FE: Bước 4: COD hoặc BANK_QR
    K->>FE: Bước 5 (tùy chọn): thông tin VAT
    K->>FE: Bấm "Đặt hàng"

    FE->>CO: POST /api/checkout/orders {shippingAddress, paymentMethod, vat?, note, idempotencyKey}
    Note over CO: Cookie hwin_ref được backend đọc trực tiếp,<br/>client không gửi giá hay mã giới thiệu
    CO->>PS: place(userId, request, refCookie)
    PS->>PS: RateLimiter 5 đơn / 10 phút / user
    PS->>DB: Load Cart(userId)
    PS->>PQ: getSnapshots(productIds)
    PQ-->>PS: [id, name, slug, price, stock, active]
    PS->>O: Order.place(customerId, cartLines, snapshots, shippingFee, address, payment, vat, ref)
    alt Giỏ rỗng / sản phẩm ngừng bán / tồn kho không đủ
        O-->>PS: DomainException
        CO-->>FE: 422 + danh sách sản phẩm lỗi
    else Hợp lệ
        O->>O: Tính subtotal, discount=0, total, sinh orderCode, status PENDING
        O->>O: registerEvent(OrderPlacedEvent)
        PS->>DB: save(order)
        Note over PS: Giỏ hàng được xóa bởi listener OrderPlacedEvent (transaction riêng)
        PS->>Bus: OrderPlacedEvent (phát khi commit)
        CO-->>FE: 201 {orderCode, total, paymentMethod, qrUrl?}
    end
    FE-->>K: Trang cảm ơn /order/success/HW241116AB12
    opt BANK_QR
        FE-->>K: Ảnh VietQR img.vietqr.io (bin, số TK, amount=total, addInfo=orderCode)
    end
```

</details>

---

## d. Xử lý event sau OrderPlacedEvent

Mỗi listener là một transaction riêng, chỉ sửa **một** aggregate, idempotent.

![03-seq-d-order-placed](images/03-seq-d-order-placed.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
sequenceDiagram
    autonumber
    participant Bus as Event bus (OrderPlacedEvent)
    participant OSL as ordering OrderStockEventListener
    participant INV as catalog InventoryService
    participant CL as ordering CartClearEventListener
    participant AOL as affiliate OrderCommissionEventListener
    participant ATT as AttributionService
    participant UQ as identity UserQueryService
    participant ADB as PostgreSQL affiliate
    participant CSL as customer CustomerStatsEventListener
    participant CDB as PostgreSQL customer
    participant AUD as AuditLogger

    par Trừ kho
        Bus-->>OSL: OrderPlacedEvent
        OSL->>INV: deduct(orderId, items)
        INV->>INV: UPDATE stock = stock - q WHERE stock ≥ q<br/>INSERT stock_movements DEDUCT (unique)
        alt Đủ hàng
            INV-->>OSL: ok
        else Thiếu hàng (bán đồng thời)
            INV-->>OSL: InsufficientStockException (rollback cả lô)
            OSL->>OSL: order.cancel(OUT_OF_STOCK) → OrderCancelledEvent
        end
    and Xóa giỏ
        Bus-->>CL: OrderPlacedEvent
        CL->>CL: cart.removeProducts(orderedProductIds)
    and Hoa hồng
        Bus-->>AOL: OrderPlacedEvent
        AOL->>ATT: resolve(customerId, referralCode)
        ATT->>ADB: findBinding(customerId)
        alt Đã có binding (khách cũ)
            ATT->>ADB: load Affiliate theo binding
        else Chưa có binding và có referralCode
            ATT->>ADB: findByReferralCode(code)
            ATT->>UQ: findPhone(customerId)
            alt CTV không APPROVED hoặc SĐT khách = SĐT CTV
                ATT-->>AOL: không có CTV (tự giới thiệu bị chặn)
            else Hợp lệ
                ATT->>ADB: INSERT customer_bindings (customer_id UNIQUE)
                Note over ATT,ADB: Binding là aggregate riêng → transaction riêng<br/>trước khi tạo Commission
            end
        else Không binding, không ref
            ATT-->>AOL: không có CTV
        end
        opt Có CTV đang APPROVED
            AOL->>ADB: INSERT commission PENDING (order_id UNIQUE)<br/>amount = floor((subtotal - discount) x 0.10)
            AOL->>AUD: COMMISSION_CREATED
        end
    and Thống kê khách
        Bus-->>CSL: OrderPlacedEvent
        CSL->>CDB: Kiểm tra processed_events(eventId)
        CSL->>CDB: customer_stats: total_orders +1, total_spent + total, last_order_at
        CSL->>CDB: customer_product_stats: + quantity từng sản phẩm
    end
```

</details>

> Khách đã có binding nhưng CTV đó bị `SUSPENDED` → **không** tạo hoa hồng và **không** chuyển khách sang CTV mới (binding vĩnh viễn).

---

## e. Giao thành công → job duyệt hoa hồng sau 7 ngày

![03-seq-e-commission-approval](images/03-seq-e-commission-approval.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant AO as ordering AdminOrderController
    participant O as Order
    participant Bus as Event bus
    participant AOL as affiliate OrderCommissionEventListener
    participant C as Commission
    participant JOB as CommissionApprovalJob (@Scheduled mỗi giờ)
    participant AUD as AuditLogger
    participant OJ as OrderAutoCompleteJob

    A->>AO: POST /api/admin/orders/{id}/ship
    AO->>O: markShipping()
    A->>AO: POST /api/admin/orders/{id}/deliver
    AO->>O: markDelivered(now)
    O->>O: COD → paymentStatus = PAID
    O->>Bus: OrderDeliveredEvent(orderId, deliveredAt)
    Bus-->>AOL: OrderDeliveredEvent
    AOL->>C: markEligible(deliveredAt + 7 ngày)
    Note over C: Vẫn PENDING, eligible_at được đặt

    loop Mỗi giờ
        JOB->>C: Tìm PENDING có eligible_at ≤ now (theo lô 100)
        JOB->>C: approve(now) – mỗi commission 1 transaction
        C->>C: Chỉ PENDING và eligible_at ≤ now mới được APPROVED
        JOB->>AUD: COMMISSION_APPROVED (amount)
    end
    Note over C: Hoa hồng APPROVED cộng vào số dư khả dụng

    loop Mỗi giờ
        OJ->>O: DELIVERED quá return-window (7 ngày) → complete()
        O->>Bus: OrderCompletedEvent
    end
```

</details>

---

## f. Hủy / hoàn đơn → hoàn kho + hủy hoa hồng

![03-seq-f-cancel-return](images/03-seq-f-cancel-return.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
sequenceDiagram
    autonumber
    actor X as Khách hoặc Admin
    participant API as ordering OrderController / AdminOrderController
    participant O as Order
    participant Bus as Event bus
    participant OSL as ordering OrderStockEventListener
    participant INV as catalog InventoryService
    participant AOL as affiliate OrderCommissionEventListener
    participant C as Commission
    participant CSL as customer CustomerStatsEventListener
    participant AUD as AuditLogger

    alt Hủy đơn
        X->>API: POST /api/me/orders/{code}/cancel hoặc /api/admin/orders/{id}/cancel
        API->>O: cancel(reason, actor)
        O->>O: Chỉ PENDING / CONFIRMED, ngược lại DomainException
        O->>Bus: OrderCancelledEvent
    else Hoàn đơn (admin)
        X->>API: POST /api/admin/orders/{id}/return
        API->>O: markReturned(now)
        O->>O: Chỉ DELIVERED và trong 7 ngày kể từ deliveredAt
        O->>Bus: OrderReturnedEvent
    end

    par Hoàn kho
        Bus-->>OSL: OrderCancelledEvent / OrderReturnedEvent
        OSL->>INV: restore(orderId)
        INV->>INV: Có DEDUCT mà chưa có RESTORE → cộng lại stock<br/>INSERT stock_movements RESTORE
    and Hủy hoa hồng
        Bus-->>AOL: OrderCancelledEvent / OrderReturnedEvent
        AOL->>C: findByOrderId → cancel()
        C->>C: PENDING → CANCELLED (không có commission thì bỏ qua)
        AOL->>AUD: COMMISSION_CANCELLED
    and Thống kê khách
        Bus-->>CSL: OrderCancelledEvent / OrderReturnedEvent
        CSL->>CSL: total_orders -1, total_spent - total, trừ product stat
    end
```

</details>

---

## g. CTV yêu cầu rút tiền → admin duyệt → chi trả

![03-seq-g-payout](images/03-seq-g-payout.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
sequenceDiagram
    autonumber
    actor CTV
    actor A as Admin
    participant PC as affiliate PayoutController
    participant PS as PayoutService
    participant BC as BalanceCalculator
    participant AF as Affiliate
    participant P as Payout
    participant DB as PostgreSQL affiliate
    participant AUD as AuditLogger

    CTV->>PC: POST /api/affiliates/me/payouts {amount}
    PC->>PS: request(userId, amount)
    PS->>DB: load Affiliate theo userId
    PS->>AF: assertCanWithdraw(now)
    Note over AF: APPROVED, đã có ngân hàng,<br/>now ≥ bankChangedAt + 48h
    PS->>BC: available(affiliateId)
    BC->>DB: SUM commission APPROVED - SUM payout REQUESTED/APPROVED/PAID
    PS->>P: Payout.request(affiliate, amount, available, minPayout, bankSnapshot)
    alt amount < 200.000 hoặc amount > available hoặc đang có payout mở
        P-->>PC: DomainException → 422
    else Hợp lệ
        PS->>DB: INSERT payout REQUESTED (unique index payout mở)
        PS->>AUD: PAYOUT_REQUESTED
        PC-->>CTV: 201
    end

    A->>PC: GET /api/admin/payouts?status=REQUESTED
    alt Duyệt
        A->>PC: POST /api/admin/payouts/{id}/approve
        PC->>P: approve(adminId)
        PS->>AUD: PAYOUT_APPROVED
        Note over A: Admin chuyển khoản thủ công theo<br/>thông tin ngân hàng đã giải mã
        A->>PC: POST /api/admin/payouts/{id}/pay {transactionRef}
        PC->>P: markPaid(transactionRef, adminId)
        PS->>AUD: PAYOUT_PAID
    else Từ chối
        A->>PC: POST /api/admin/payouts/{id}/reject {reason}
        PC->>P: reject(reason, adminId)
        Note over P,BC: Payout REJECTED không còn bị trừ trong công thức số dư<br/>→ tiền tự động trở về số dư khả dụng
        PS->>AUD: PAYOUT_REJECTED
    end
```

</details>

**Đổi tài khoản ngân hàng** (liên quan): `POST /api/affiliates/me/bank-account/otp` → OTP purpose `BANK_CHANGE` gửi tới SĐT CTV → `PUT /api/affiliates/me/bank-account {bankName, accountNo, holder, otp}` → `OtpService.verify` → `affiliate.changeBankAccount(encrypted, now)` đặt `bankChangedAt = now` (lần đầu thiết lập không khóa) → audit `BANK_CHANGED`.

---

## h. Mua lại đơn cũ

![03-seq-h-reorder](images/03-seq-h-reorder.svg)

<details>
<summary>Mã nguồn Mermaid</summary>

```mermaid
sequenceDiagram
    autonumber
    actor K as Khách
    participant FE as Next.js /account/orders
    participant RC as customer ReorderController
    participant RS as ReorderService
    participant OQ as ordering OrderQueryService
    participant PQ as catalog ProductQueryService
    participant CS as ordering CartService

    K->>FE: Bấm "Mua lại" ở đơn HW241116AB12
    FE->>RC: POST /api/me/orders/HW241116AB12/reorder
    RC->>RS: reorder(customerId từ JWT, orderCode)
    RS->>OQ: findItemsForCustomer(orderCode, customerId)
    alt Đơn không thuộc khách này
        OQ-->>RS: NotFound (không lộ đơn người khác – chống IDOR)
        RC-->>FE: 404
    else Đúng chủ
        OQ-->>RS: [productId, quantity]
        RS->>PQ: getSnapshots(productIds)
        RS->>RS: Tách: active và còn hàng → thêm, ngược lại → skipped (lý do INACTIVE / OUT_OF_STOCK)
        RS->>CS: addItems(customerId, availableItems)
        Note over CS: Số lượng tối đa = min(SL cũ, tồn kho)
        RC-->>FE: 200 {added: [...], skipped: [{productId, name, reason}]}
        FE-->>K: Chuyển tới giỏ hàng + thông báo sản phẩm bị bỏ qua
    end
```

</details>

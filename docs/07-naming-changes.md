# Bảng đổi tên (chuẩn hóa đặt tên)

Refactor theo mục **Quy ước đặt tên** trong `CLAUDE.md`. Không đổi nghiệp vụ; chỉ đổi tên, vị trí file, đường dẫn API / trang và tên bảng.

> **Phải reset DB local** vì migration được đánh số lại và bảng đổi tên: `cd backend` → `docker compose down -v` → chạy lại backend.

## 1. Java (class / package)

| Tên cũ | Tên mới | Vị trí cũ → mới |
|---|---|---|
| `CtvController` | `AffiliateController` | `affiliate.api.CtvController` → `affiliate.api.AffiliateController` |
| `BankAccountRequest` | `UpdateBankAccountRequest` | `affiliate.api.requests.BankAccountRequest` → `affiliate.api.dto.UpdateBankAccountRequest` |
| `ClickRequest` | `RecordReferralClickRequest` | `affiliate.api.requests.ClickRequest` → `affiliate.api.dto.RecordReferralClickRequest` |
| `PayRequest` | `MarkPayoutPaidRequest` | `affiliate.api.requests.PayRequest` → `affiliate.api.dto.MarkPayoutPaidRequest` |
| `PayoutRequest` | `CreatePayoutRequest` | `affiliate.api.requests.PayoutRequest` → `affiliate.api.dto.CreatePayoutRequest` |
| `ReasonRequest` | `ChangeStatusRequest` | `affiliate.api.requests.ReasonRequest` → `affiliate.api.dto.ChangeStatusRequest` |
| `RegisterRequest` | `RegisterAffiliateRequest` | `affiliate.api.requests.RegisterRequest` → `affiliate.api.dto.RegisterAffiliateRequest` |
| `AdminAffiliateResponse` | `AdminAffiliateResponse` | `affiliate.api.responses.AdminAffiliateResponse` → `affiliate.api.dto.AdminAffiliateResponse` |
| `AdminCommissionResponse` | `AdminCommissionResponse` | `affiliate.api.responses.AdminCommissionResponse` → `affiliate.api.dto.AdminCommissionResponse` |
| `AdminPayoutResponse` | `AdminPayoutResponse` | `affiliate.api.responses.AdminPayoutResponse` → `affiliate.api.dto.AdminPayoutResponse` |
| `AffiliateResponse` | `AffiliateResponse` | `affiliate.api.responses.AffiliateResponse` → `affiliate.api.dto.AffiliateResponse` |
| `ApprovalJobResponse` | `CommissionApprovalJobResponse` | `affiliate.api.responses.ApprovalJobResponse` → `affiliate.api.dto.CommissionApprovalJobResponse` |
| `CommissionResponse` | `CommissionResponse` | `affiliate.api.responses.CommissionResponse` → `affiliate.api.dto.CommissionResponse` |
| `OtpSentResponse` | `BankAccountOtpResponse` | `affiliate.api.responses.OtpSentResponse` → `affiliate.api.dto.BankAccountOtpResponse` |
| `PayoutResponse` | `PayoutResponse` | `affiliate.api.responses.PayoutResponse` → `affiliate.api.dto.PayoutResponse` |
| `AffiliateApproved` | `AffiliateApprovedEvent` | `affiliate.entity.AffiliateApproved` → `affiliate.entity.event.AffiliateApprovedEvent` |
| `AffiliateSuspended` | `AffiliateSuspendedEvent` | `affiliate.entity.AffiliateSuspended` → `affiliate.entity.event.AffiliateSuspendedEvent` |
| `AffiliateOrderListener` | `OrderCommissionEventListener` | `affiliate.service.AffiliateOrderListener` → `affiliate.service.listener.OrderCommissionEventListener` |
| `AffiliateRoleListener` | `AffiliateRoleEventListener` | `affiliate.service.AffiliateRoleListener` → `affiliate.service.listener.AffiliateRoleEventListener` |
| `AffiliateProperties` | `AffiliateProperties` | `affiliate.service.AffiliateProperties` → `affiliate.service.config.AffiliateProperties` |
| `CommissionApprovalJob` | `CommissionApprovalJob` | `affiliate.service.CommissionApprovalJob` → `affiliate.service.job.CommissionApprovalJob` |
| `ActiveRequest` | `UpdateProductStatusRequest` | `catalog.api.requests.ActiveRequest` → `catalog.api.dto.UpdateProductStatusRequest` |
| `CategoryUpsertRequest` | `SaveCategoryRequest` | `catalog.api.requests.CategoryUpsertRequest` → `catalog.api.dto.SaveCategoryRequest` |
| `ProductUpsertRequest` | `SaveProductRequest` | `catalog.api.requests.ProductUpsertRequest` → `catalog.api.dto.SaveProductRequest` |
| `StockAdjustRequest` | `AdjustStockRequest` | `catalog.api.requests.StockAdjustRequest` → `catalog.api.dto.AdjustStockRequest` |
| `AdminProductResponse` | `AdminProductResponse` | `catalog.api.responses.AdminProductResponse` → `catalog.api.dto.AdminProductResponse` |
| `CategoryResponse` | `CategoryResponse` | `catalog.api.responses.CategoryResponse` → `catalog.api.dto.CategoryResponse` |
| `FoodInfoDto` | `FoodInfoResponse` | `catalog.api.responses.FoodInfoDto` → `catalog.api.dto.FoodInfoResponse` |
| `ProductCardResponse` | `ProductCardResponse` | `catalog.api.responses.ProductCardResponse` → `catalog.api.dto.ProductCardResponse` |
| `ProductDetailResponse` | `ProductDetailResponse` | `catalog.api.responses.ProductDetailResponse` → `catalog.api.dto.ProductDetailResponse` |
| `UploadResponse` | `ImageUploadResponse` | `catalog.api.responses.UploadResponse` → `catalog.api.dto.ImageUploadResponse` |
| `CatalogMapper` | `ProductMapper` | `catalog.api.mapper.CatalogMapper` → `catalog.api.mapper.ProductMapper` |
| `ProductSearchCriteria` | `ProductSearchCriteria` | `catalog.service.ProductSearchCriteria` → `catalog.service.model.ProductSearchCriteria` |
| `ProductSnapshot` | `ProductSnapshot` | `catalog.service.ProductSnapshot` → `catalog.service.model.ProductSnapshot` |
| `AuditLogController` | `AdminAuditLogController` | `common.audit.AuditLogController` → `common.audit.AdminAuditLogController` |
| `EventPublicationCleanupJob` | `EventPublicationCleanupJob` | `common.config.EventPublicationCleanupJob` → `common.job.EventPublicationCleanupJob` |
| `MyAccountController` | `AccountController` | `customer.api.MyAccountController` → `customer.api.AccountController` |
| `AddressRequest` | `SaveAddressRequest` | `customer.api.requests.AddressRequest` → `customer.api.dto.SaveAddressRequest` |
| `UpdateProfileRequest` | `UpdateProfileRequest` | `customer.api.requests.UpdateProfileRequest` → `customer.api.dto.UpdateProfileRequest` |
| `AddressResponse` | `AddressResponse` | `customer.api.responses.AddressResponse` → `customer.api.dto.AddressResponse` |
| `FavoriteProductResponse` | `FavoriteProductResponse` | `customer.api.responses.FavoriteProductResponse` → `customer.api.dto.FavoriteProductResponse` |
| `ProfileResponse` | `ProfileResponse` | `customer.api.responses.ProfileResponse` → `customer.api.dto.ProfileResponse` |
| `CustomerProperties` | `CustomerProperties` | `customer.service.CustomerProperties` → `customer.service.config.CustomerProperties` |
| `CustomerProvisioningListener` | `CustomerProvisioningEventListener` | `customer.service.CustomerProvisioningListener` → `customer.service.listener.CustomerProvisioningEventListener` |
| `CustomerStatsListener` | `CustomerStatsEventListener` | `customer.service.CustomerStatsListener` → `customer.service.listener.CustomerStatsEventListener` |
| `ProcessedEventCleanupJob` | `ProcessedEventCleanupJob` | `customer.service.ProcessedEventCleanupJob` → `customer.service.job.ProcessedEventCleanupJob` |
| `AdminLoginRequest` | `AdminLoginRequest` | `identity.api.requests.AdminLoginRequest` → `identity.api.dto.AdminLoginRequest` |
| `AdminOtpVerifyRequest` | `VerifyAdminOtpRequest` | `identity.api.requests.AdminOtpVerifyRequest` → `identity.api.dto.VerifyAdminOtpRequest` |
| `CreateAdminRequest` | `CreateAdminRequest` | `identity.api.requests.CreateAdminRequest` → `identity.api.dto.CreateAdminRequest` |
| `OtpRequest` | `SendOtpRequest` | `identity.api.requests.OtpRequest` → `identity.api.dto.SendOtpRequest` |
| `OtpVerifyRequest` | `VerifyOtpRequest` | `identity.api.requests.OtpVerifyRequest` → `identity.api.dto.VerifyOtpRequest` |
| `RegisterRequest` | `RegisterAccountRequest` | `identity.api.requests.RegisterRequest` → `identity.api.dto.RegisterAccountRequest` |
| `AdminLoginResponse` | `AdminLoginResponse` | `identity.api.responses.AdminLoginResponse` → `identity.api.dto.AdminLoginResponse` |
| `MeResponse` | `MeResponse` | `identity.api.responses.MeResponse` → `identity.api.dto.MeResponse` |
| `OtpSentResponse` | `OtpSentResponse` | `identity.api.responses.OtpSentResponse` → `identity.api.dto.OtpSentResponse` |
| `UserRegistered` | `UserRegisteredEvent` | `identity.entity.UserRegistered` → `identity.entity.event.UserRegisteredEvent` |
| `AdminLoginResult` | `AdminLoginResult` | `identity.service.AdminLoginResult` → `identity.service.model.AdminLoginResult` |
| `IssuedTokens` | `IssuedTokens` | `identity.service.IssuedTokens` → `identity.service.model.IssuedTokens` |
| `UserContact` | `UserContact` | `identity.service.UserContact` → `identity.service.model.UserContact` |
| `OtpProperties` | `OtpProperties` | `identity.service.OtpProperties` → `identity.service.config.OtpProperties` |
| `RefreshTokenCleanupJob` | `RefreshTokenCleanupJob` | `identity.service.RefreshTokenCleanupJob` → `identity.service.job.RefreshTokenCleanupJob` |
| `AddressRequest` | `ShippingAddressRequest` | `ordering.api.requests.AddressRequest` → `ordering.api.dto.ShippingAddressRequest` |
| `AdminCancelRequest` | `CancelOrderRequest` | `ordering.api.requests.AdminCancelRequest` → `ordering.api.dto.CancelOrderRequest` |
| `CartItemRequest` | `AddCartItemRequest` | `ordering.api.requests.CartItemRequest` → `ordering.api.dto.AddCartItemRequest` |
| `CartLinesRequest` | `CartItemsRequest` | `ordering.api.requests.CartLinesRequest` → `ordering.api.dto.CartItemsRequest` |
| `MarkPaidRequest` | `MarkOrderPaidRequest` | `ordering.api.requests.MarkPaidRequest` → `ordering.api.dto.MarkOrderPaidRequest` |
| `PlaceOrderRequest` | `PlaceOrderRequest` | `ordering.api.requests.PlaceOrderRequest` → `ordering.api.dto.PlaceOrderRequest` |
| `QuantityRequest` | `UpdateCartItemRequest` | `ordering.api.requests.QuantityRequest` → `ordering.api.dto.UpdateCartItemRequest` |
| `VatInvoiceRequest` | `VatInvoiceRequest` | `ordering.api.requests.VatInvoiceRequest` → `ordering.api.dto.VatInvoiceRequest` |
| `AddressResponse` | `ShippingAddressResponse` | `ordering.api.responses.AddressResponse` → `ordering.api.dto.ShippingAddressResponse` |
| `AdminOrderResponse` | `AdminOrderResponse` | `ordering.api.responses.AdminOrderResponse` → `ordering.api.dto.AdminOrderResponse` |
| `AdminOrderRow` | `AdminOrderSummaryResponse` | `ordering.api.responses.AdminOrderRow` → `ordering.api.dto.AdminOrderSummaryResponse` |
| `CheckoutConfigResponse` | `CheckoutConfigResponse` | `ordering.api.responses.CheckoutConfigResponse` → `ordering.api.dto.CheckoutConfigResponse` |
| `HistoryResponse` | `OrderStatusHistoryResponse` | `ordering.api.responses.HistoryResponse` → `ordering.api.dto.OrderStatusHistoryResponse` |
| `OrderDetailResponse` | `OrderDetailResponse` | `ordering.api.responses.OrderDetailResponse` → `ordering.api.dto.OrderDetailResponse` |
| `OrderItemResponse` | `OrderItemResponse` | `ordering.api.responses.OrderItemResponse` → `ordering.api.dto.OrderItemResponse` |
| `OrderSummaryResponse` | `OrderSummaryResponse` | `ordering.api.responses.OrderSummaryResponse` → `ordering.api.dto.OrderSummaryResponse` |
| `PaymentInstructionResponse` | `PaymentInstructionResponse` | `ordering.api.responses.PaymentInstructionResponse` → `ordering.api.dto.PaymentInstructionResponse` |
| `VatInvoiceResponse` | `VatInvoiceResponse` | `ordering.api.responses.VatInvoiceResponse` → `ordering.api.dto.VatInvoiceResponse` |
| `OrderingMapper` | `OrderMapper` | `ordering.api.mapper.OrderingMapper` → `ordering.api.mapper.OrderMapper` |
| `OrderPlaced` | `OrderPlacedEvent` | `ordering.entity.OrderPlaced` → `ordering.entity.event.OrderPlacedEvent` |
| `OrderConfirmed` | `OrderConfirmedEvent` | `ordering.entity.OrderConfirmed` → `ordering.entity.event.OrderConfirmedEvent` |
| `OrderDelivered` | `OrderDeliveredEvent` | `ordering.entity.OrderDelivered` → `ordering.entity.event.OrderDeliveredEvent` |
| `OrderCancelled` | `OrderCancelledEvent` | `ordering.entity.OrderCancelled` → `ordering.entity.event.OrderCancelledEvent` |
| `OrderReturned` | `OrderReturnedEvent` | `ordering.entity.OrderReturned` → `ordering.entity.event.OrderReturnedEvent` |
| `OrderCompleted` | `OrderCompletedEvent` | `ordering.entity.OrderCompleted` → `ordering.entity.event.OrderCompletedEvent` |
| `OrderItemSnapshot` | `OrderItemSnapshot` | `ordering.entity.OrderItemSnapshot` → `ordering.entity.event.OrderItemSnapshot` |
| `CartClearListener` | `CartClearEventListener` | `ordering.service.CartClearListener` → `ordering.service.listener.CartClearEventListener` |
| `OrderStockListener` | `OrderStockEventListener` | `ordering.service.OrderStockListener` → `ordering.service.listener.OrderStockEventListener` |
| `OrderAutoCompleteJob` | `OrderAutoCompleteJob` | `ordering.service.OrderAutoCompleteJob` → `ordering.service.job.OrderAutoCompleteJob` |
| `OrderPaymentTimeoutJob` | `OrderPaymentTimeoutJob` | `ordering.service.OrderPaymentTimeoutJob` → `ordering.service.job.OrderPaymentTimeoutJob` |
| `OrderingProperties` | `OrderingProperties` | `ordering.service.OrderingProperties` → `ordering.service.config.OrderingProperties` |
| `CartView` | `CartView` | `ordering.service.CartView` → `ordering.service.model.CartView` |
| `AffiliateEnums.AffiliateStatus` | `AffiliateStatus` | `affiliate.entity.AffiliateEnums.AffiliateStatus` → `affiliate.entity.AffiliateStatus` |
| `AffiliateEnums.CommissionStatus` | `CommissionStatus` | `affiliate.entity.AffiliateEnums.CommissionStatus` → `affiliate.entity.CommissionStatus` |
| `AffiliateEnums.PayoutStatus` | `PayoutStatus` | `affiliate.entity.AffiliateEnums.PayoutStatus` → `affiliate.entity.PayoutStatus` |
| `OrderEnums.PaymentMethod` | `PaymentMethod` | `ordering.entity.OrderEnums.PaymentMethod` → `ordering.entity.PaymentMethod` |
| `OrderEnums.PaymentStatus` | `PaymentStatus` | `ordering.entity.OrderEnums.PaymentStatus` → `ordering.entity.PaymentStatus` |
| `OrderEnums.CancelReason` | `CancelReason` | `ordering.entity.OrderEnums.CancelReason` → `ordering.entity.CancelReason` |
| `AffiliateDashboardService.StatusSummary` | `CommissionStatusSummary` | `affiliate.service.AffiliateDashboardService.StatusSummary` → `affiliate.service.model.CommissionStatusSummary` |
| `AffiliateDashboardService.Dashboard` | `AffiliateDashboard` | `affiliate.service.AffiliateDashboardService.Dashboard` → `affiliate.service.model.AffiliateDashboard` |
| `AffiliateDashboardService.BoundCustomer` | `BoundCustomer` | `affiliate.service.AffiliateDashboardService.BoundCustomer` → `affiliate.service.model.BoundCustomer` |
| `PayoutService.PayoutWithBank` | `PayoutWithBank` | `affiliate.service.PayoutService.PayoutWithBank` → `affiliate.service.model.PayoutWithBank` |
| `ReferralClickService.ClickResult` | `RecordClickResult` | `affiliate.service.ReferralClickService.ClickResult` → `affiliate.service.model.RecordClickResult` |
| `LocalStorageService.StorageProperties` | `StorageProperties` | `catalog.service.integration.LocalStorageService.StorageProperties` → `catalog.service.config.StorageProperties` |
| `AuditLogController.AuditLogResponse` | `AuditLogResponse` | `common.audit.AuditLogController.AuditLogResponse` → `common.audit.AuditLogResponse` |
| `ErrorResponse.FieldErrorDetail` | `FieldErrorDetail` | `common.exception.ErrorResponse.FieldErrorDetail` → `common.exception.FieldErrorDetail` |
| `CustomerProductStat.Key` | `CustomerProductStatId` | `customer.entity.CustomerProductStat.Key` → `customer.entity.CustomerProductStatId` |
| `CustomerAdminService.CustomerRow` | `CustomerSummary` | `customer.service.CustomerAdminService.CustomerRow` → `customer.service.model.CustomerSummary` |
| `CustomerService.Profile` | `CustomerProfile` | `customer.service.CustomerService.Profile` → `customer.service.model.CustomerProfile` |
| `FavoriteProductService.Favorite` | `FavoriteProduct` | `customer.service.FavoriteProductService.Favorite` → `customer.service.model.FavoriteProduct` |
| `ReorderService.Added` | `ReorderAddedItem` | `customer.service.ReorderService.Added` → `customer.service.model.ReorderAddedItem` |
| `ReorderService.Skipped` | `ReorderSkippedItem` | `customer.service.ReorderService.Skipped` → `customer.service.model.ReorderSkippedItem` |
| `ReorderService.Result` | `ReorderResult` | `customer.service.ReorderService.Result` → `customer.service.model.ReorderResult` |
| `AdminSeeder.AdminSeedProperties` | `AdminSeedProperties` | `identity.service.AdminSeeder.AdminSeedProperties` → `identity.service.config.AdminSeedProperties` |
| `AuthService.OtpDispatch` | `SendOtpResult` | `identity.service.AuthService.OtpDispatch` → `identity.service.model.SendOtpResult` |
| `CartView.Line` | `CartLineView` | `ordering.service.CartView.Line` → `ordering.service.model.CartLineView` |
| `OrderAdminService.OrderFilter` | `OrderFilter` | `ordering.service.OrderAdminService.OrderFilter` → `ordering.service.model.OrderFilter` |
| `OrderingProperties.BankQr` | `BankQrProperties` | `ordering.service.OrderingProperties.BankQr` → `ordering.service.config.BankQrProperties` |
| `PlaceOrderService.PlaceOrderCommand` | `PlaceOrderCommand` | `ordering.service.PlaceOrderService.PlaceOrderCommand` → `ordering.service.model.PlaceOrderCommand` |
| `OrderLine` | `OrderItem` | `ordering.entity.OrderLine` → `ordering.entity.OrderItem (OrderItem.of)` |
| `AdminAffiliateController (/api/admin)` | `AdminAffiliateController + AdminCommissionController + AdminPayoutController` | – |
| `AdminProductController (/api/admin)` | `AdminProductController + AdminUploadController` | – |
| `CartController (POST /quote)` | `CartQuoteController` | – |
| `TextConstraints.NotBlankCheck` | `NotBlankValidatorConstraint` | – |
| `TextConstraints.NotNullCheck` | `NotNullValidatorConstraint` | – |
| `TextConstraints.LengthCheck` | `LengthValidatorConstraint` | – |

Quy ước chung đã áp dụng:

- `api/requests`, `api/responses` → `api/dto/`; event → `entity/event/` (hậu tố `Event`); listener → `service/listener/` (hậu tố `EventListener`); job → `service/job/`; `@ConfigurationProperties` → `service/config/`; command / kết quả nội bộ → `service/model/`.
- `*Enums.java` và kiểu lồng `public` được tách mỗi kiểu một file.
- Giữ nguyên có chủ đích: `OtpProperties` (prefix `hwin.otp`), `StorageProperties` (`hwin.storage`), `AdminSeedProperties` (`hwin.admin-seed`), `SecurityProperties` – tên theo nhóm cấu hình để không đổi khóa trong `application.yml`; bảng `public.event_publication` do Spring Modulith quản lý.

## 2. Bảng DB

| Cũ | Mới |
|---|---|
| `affiliate.affiliate` | `affiliate.affiliates` |
| `affiliate.commission` | `affiliate.commissions` |
| `affiliate.customer_binding` | `affiliate.customer_bindings` |
| `affiliate.payout` | `affiliate.payouts` |
| `affiliate.referral_click` | `affiliate.referral_clicks` |
| `audit.audit_log` | `audit.audit_logs` |
| `catalog.category` | `catalog.categories` |
| `catalog.product` | `catalog.products` |
| `catalog.product_image` | `catalog.product_images` |
| `catalog.stock_movement` | `catalog.stock_movements` |
| `customer.customer` | `customer.customers` |
| `customer.customer_address` | `customer.customer_addresses` |
| `customer.customer_product_stat` | `customer.customer_product_stats` |
| `customer.processed_event` | `customer.processed_events` |
| `identity.refresh_token` | `identity.refresh_tokens` |
| `identity.user_account` | `identity.user_accounts` |
| `identity.user_role` | `identity.user_roles` |
| `ordering.cart` | `ordering.carts` |
| `ordering.cart_item` | `ordering.cart_items` |
| `ordering.order_item` | `ordering.order_items` |
| `ordering.order_status_history` | `ordering.order_status_histories` |

## 3. Migration Flyway

Quy ước `V<module>_<NNN>__<mô_tả>.sql`: common=1, identity=2, catalog=3, customer=4, ordering=5, affiliate=6, demo=9. Chú thích bảng (`V2_9_0__table_comments.sql`) được gộp vào file tạo bảng của từng module.

| Cũ | Mới |
|---|---|
| `V1_0_0__schemas_and_shared.sql` | `V1_001__create_schemas_and_shared.sql` |
| `V2_9_0__table_comments.sql` | `(gộp vào file tạo bảng của từng module)` |
| `V1_1_0__identity.sql` | `V2_001__create_identity_tables.sql` |
| `V3_1_0__admin_otp.sql` | `V2_002__add_admin_otp_exempt.sql` |
| `V1_2_0__catalog.sql` | `V3_001__create_catalog_tables.sql` |
| `V1_2_1__catalog_seed.sql` | `V3_002__seed_catalog.sql` |
| `V2_0_0__catalog_stock_movement.sql` | `V3_003__create_stock_movements.sql` |
| `V2_2_0__customer.sql` | `V4_001__create_customer_tables.sql` |
| `V3_2_0__customer_email.sql` | `V4_002__add_customer_email.sql` |
| `V2_1_0__ordering.sql` | `V5_001__create_ordering_tables.sql` |
| `V3_0_0__affiliate.sql` | `V6_001__create_affiliate_tables.sql` |
| `V9_0_0__demo_data.sql` | `V9_001__demo_data.sql` |

## 4. Đường dẫn API

Mỗi controller một prefix riêng. Các đường dẫn admin giữ nguyên (chỉ tách controller).

| Cũ | Mới |
|---|---|
| `POST /api/cart/quote` | `POST /api/cart-quotes` |
| `/api/cart/**` | `/api/me/cart/**` |
| `/api/orders/**` | `/api/me/orders/**` |
| `POST /api/affiliate/clicks` | `POST /api/referral-clicks` |
| `POST /api/ctv/register` | `POST /api/affiliates/me` |
| `GET /api/ctv/me` | `GET /api/affiliates/me` |
| `/api/ctv/**` | `/api/affiliates/me/**` |

## 5. Frontend

| Cũ | Mới |
|---|---|
| `/c/[slug]` | `/danh-muc/[slug]` |
| `/p/[slug]` | `/san-pham/[slug]` |
| `/cart` | `/gio-hang` |
| `/search` | `/tim-kiem` |
| `/checkout` | `/thanh-toan` |
| `/account` | `/tai-khoan` |
| `/account/orders/[code]` | `/tai-khoan/don-hang/[code]` |
| `(mới)` | `/tai-khoan/don-hang` |
| `/login` | `/dang-nhap` |
| `/register` | `/dang-ky` |
| `/ctv/register` | `/ctv/dang-ky` |
| `stores/cart.ts` | `stores/cart-store.ts` |
| type `ProductCard`, `ProductDetail`, `Category`, `Page`, `Me`, `Profile`, `Address`, `OrderSummary`, `OrderDetail`, `OtpSent`, `ServerCart` | `ProductCardResponse`, `ProductDetailResponse`, `CategoryResponse`, `PageResponse`, `MeResponse`, `ProfileResponse`, `AddressResponse`, `OrderSummaryResponse`, `OrderDetailResponse`, `OtpSentResponse`, `CartView` (khớp DTO backend) |
| `docs/08-otp.md` | `docs/08-otp.md` |

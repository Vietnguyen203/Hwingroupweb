/**
 * Thông báo lỗi hiển thị cho người dùng (tiếng Việt), khóa theo mã lỗi `messageCode` của backend (tên hằng enum
 * ExceptionMessage). Backend chỉ trả câu tiếng Anh (cho log / lập trình viên); giao diện dịch theo mã ở đây.
 * Chỗ `#key#` là số liệu lấy từ `details` mà backend trả kèm (VD `#max#`, `#status#`).
 * Thêm mã lỗi mới ở backend thì thêm một dòng ở đây; chưa có thì giao diện hiện câu tiếng Anh của backend.
 */
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Xác minh dữ liệu thất bại",
  INVALID_PARAMS: "Tham số không hợp lệ",
  INVALID_BODY: "Dữ liệu gửi lên không đúng định dạng JSON",
  BAD_REQUEST: "Thiếu hoặc sai tham số",
  UNAUTHORIZED: "Vui lòng đăng nhập",
  FORBIDDEN: "Bạn không có quyền truy cập",
  NOT_FOUND: "Không tìm thấy dữ liệu",
  PATH_NOT_FOUND: "Không tìm thấy đường dẫn",
  METHOD_NOT_ALLOWED: "Phương thức không được hỗ trợ",
  UNSUPPORTED_MEDIA_TYPE: "Content-Type không được hỗ trợ",
  FILE_TOO_LARGE: "Tệp vượt quá dung lượng cho phép (ảnh tối đa 5MB)",
  FILE_TYPE_INVALID: "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP",
  CONCURRENT_MODIFICATION: "Dữ liệu vừa bị thay đổi, vui lòng thử lại",
  DATA_CONFLICT: "Dữ liệu bị trùng hoặc không hợp lệ",
  RATE_LIMITED: "Bạn thao tác quá nhiều lần, vui lòng thử lại sau ít phút",
  PHONE_INVALID: "Số điện thoại không hợp lệ",
  EMAIL_INVALID: "Email không hợp lệ",
  RECIPIENT_PHONE_REQUIRED: "Thiếu số điện thoại người nhận",
  FIELD_REQUIRED: "#label# không được trống",
  FIELD_TOO_LONG: "#label# quá dài",
  MONEY_NEGATIVE: "Số tiền không được âm",
  QUANTITY_NEGATIVE: "Số lượng không được âm",
  SIMULATED_TIME_DISABLED: "Không hỗ trợ giả lập thời điểm ở môi trường này",
  INTERNAL_SERVER: "Hệ thống có lỗi xảy ra, vui lòng thử lại sau",
  REFRESH_MISSING: "Chưa đăng nhập",
  DEV_OTP_NOT_FOUND: "Chưa có OTP cho nơi nhận này",
  CONTACT_REQUIRED: "Vui lòng nhập số điện thoại hoặc email",
  REFRESH_REVOKED: "Refresh token đã bị thu hồi",
  NO_OTP_CONTACT: "Tài khoản chưa có email hoặc số điện thoại để nhận OTP",
  ADMIN_CONTACT_REQUIRED: "Admin cần email thật hoặc số điện thoại để nhận OTP đăng nhập",
  ADMIN_INVALID: "Admin cần email/tên đăng nhập và mật khẩu",
  USER_LOCKED: "Tài khoản đã bị khóa",
  ROLE_REQUIRED: "Không thể gỡ vai trò CUSTOMER",
  EMAIL_IN_USE: "Email / tên đăng nhập đã được dùng",
  PHONE_IN_USE: "Số điện thoại đã gắn với tài khoản khác",
  ACCOUNT_EXISTS: "Tài khoản đã tồn tại, vui lòng đăng nhập",
  ACCOUNT_NOT_FOUND: "Chưa có tài khoản, vui lòng đăng ký",
  ADMIN_USE_ADMIN_LOGIN: "Tài khoản quản trị phải đăng nhập tại trang quản trị",
  ADMIN_LOGIN_LOCKED: "Đăng nhập sai quá nhiều lần, vui lòng thử lại sau 10 phút",
  BAD_CREDENTIALS: "Tên đăng nhập hoặc mật khẩu không đúng",
  CHALLENGE_EXPIRED: "Phiên đăng nhập đã hết hạn, vui lòng nhập lại mật khẩu",
  SMS_UNAVAILABLE: "Hiện chưa gửi được OTP qua SMS, vui lòng dùng email",
  EMAIL_UNAVAILABLE: "Hiện chưa gửi được OTP qua email",
  OTP_SEND_LIMIT: "Bạn đã yêu cầu OTP quá nhiều lần, vui lòng thử lại sau ít phút",
  OTP_EXPIRED: "Mã OTP đã hết hạn, vui lòng gửi lại",
  OTP_LOCKED: "Nhập sai OTP quá #maxAttempts# lần. Vui lòng thử lại sau #lockDuration# phút",
  OTP_INVALID: "Mã OTP không đúng. Còn #remaining# lần thử",
  CITIZEN_ID_INVALID: "Số CCCD gồm đúng 12 chữ số",
  CITIZEN_ID_IN_USE: "Số CCCD đã được dùng cho tài khoản khác",
  DATE_OF_BIRTH_INVALID: "Ngày sinh phải là ngày trong quá khứ",
  INVALID_LOGIN: "Email / số điện thoại hoặc mật khẩu không đúng. Nếu bạn chưa đặt mật khẩu, vui lòng liên hệ hỗ trợ",
  LOGIN_LOCKED: "Đăng nhập sai quá nhiều lần, vui lòng thử lại sau #minutes# phút",
  PHONE_ALREADY_SET: "Tài khoản đã có số điện thoại",
  USER_NOT_FOUND: "Không tìm thấy tài khoản",
  OTP_TEMP_LOCKED: "Tạm khóa nhận OTP do nhập sai nhiều lần, vui lòng thử lại sau",
  WEAK_PASSWORD: "Mật khẩu chưa đạt yêu cầu: #reason#",
  REFRESH_INVALID: "Phiên đăng nhập không hợp lệ",
  REFRESH_REUSED: "Phiên đăng nhập đã hết hiệu lực, vui lòng đăng nhập lại",
  REFRESH_EXPIRED: "Phiên đăng nhập đã hết hạn",
  OTP_SEND_FAILED: "Không gửi được email, vui lòng thử lại sau",
  CATEGORY_NAME_REQUIRED: "Tên danh mục không được trống",
  PRODUCT_NAME_REQUIRED: "Tên sản phẩm không được trống",
  PRODUCT_CATEGORY_REQUIRED: "Sản phẩm phải thuộc một danh mục",
  PRODUCT_PRICE_INVALID: "Giá bán phải lớn hơn 0",
  SALE_PERCENT_INVALID: "Phần trăm giảm giá phải là số nguyên từ 0 đến #max#",
  COMPARE_PRICE_INVALID: "Giá gốc phải lớn hơn giá bán",
  PRODUCT_IMAGE_REQUIRED: "Sản phẩm cần ít nhất #min# ảnh",
  TOO_MANY_IMAGES: "Tối đa #max# ảnh mỗi sản phẩm",
  PRODUCT_INFO_REQUIRED: "#field# không được trống",
  STOCK_NEGATIVE: "Tồn kho không đủ để điều chỉnh",
  CATEGORY_NOT_FOUND: "Không tìm thấy danh mục",
  SLUG_TAKEN: "Slug danh mục đã tồn tại",
  CATEGORY_IN_USE: "Danh mục còn sản phẩm đang bán, hãy ẩn sản phẩm trước",
  OUT_OF_STOCK: "Sản phẩm đã hết hàng",
  PRODUCT_SLUG_TAKEN: "Slug sản phẩm đã tồn tại",
  PRODUCT_NOT_FOUND: "Không tìm thấy sản phẩm",
  CATEGORY_NOT_EXISTS: "Danh mục không tồn tại",
  NAME_TOO_LONG: "Họ tên tối đa 100 ký tự",
  ADDRESS_LIMIT: "Tối đa #max# địa chỉ",
  ADDRESS_NOT_FOUND: "Không tìm thấy địa chỉ",
  CUSTOMER_NOT_FOUND: "Không tìm thấy khách hàng",
  ORDER_NOT_FOUND: "Không tìm thấy đơn hàng",
  REVIEW_RATING_INVALID: "Số sao đánh giá phải từ 1 đến 5",
  REVIEW_COMMENT_TOO_LONG: "Nội dung đánh giá tối đa #max# ký tự",
  REVIEW_NOT_PURCHASED: "Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng",
  REVIEW_ALREADY_EXISTS: "Bạn đã đánh giá sản phẩm này rồi",
  REVIEW_PRODUCT_NOT_FOUND: "Không tìm thấy sản phẩm để đánh giá",
  REVIEW_NOT_FOUND: "Không tìm thấy đánh giá",
  CART_FULL: "Giỏ hàng tối đa #max# sản phẩm",
  CART_ITEM_NOT_FOUND: "Sản phẩm không có trong giỏ",
  QUANTITY_INVALID: "Số lượng phải lớn hơn 0",
  CART_EMPTY: "Giỏ hàng đang trống",
  ADDRESS_INVALID: "Thiếu địa chỉ giao hàng",
  PAYMENT_METHOD_REQUIRED: "Chưa chọn phương thức thanh toán",
  PAYMENT_METHOD_INVALID: "Chỉ xác nhận thanh toán cho đơn chuyển khoản QR",
  ALREADY_PAID: "Đơn đã được xác nhận thanh toán",
  PAYMENT_REQUIRED: "Đơn chuyển khoản phải nhận được tiền trước khi xác nhận",
  CUSTOMER_CANCEL_NOT_ALLOWED: "Đơn đã được xác nhận, vui lòng liên hệ shop để hủy",
  INVALID_STATE_TRANSITION: "Không thể #action# khi đang ở trạng thái #status#",
  RETURN_WINDOW_EXPIRED: "Đã quá hạn đổi trả #days# ngày",
  RETURN_WINDOW_OPEN: "Chưa hết hạn đổi trả",
  VAT_COMPANY_REQUIRED: "Thiếu tên công ty xuất hóa đơn",
  VAT_TAX_CODE_INVALID: "Mã số thuế không hợp lệ",
  VAT_ADDRESS_REQUIRED: "Thiếu địa chỉ công ty",
  VAT_EMAIL_INVALID: "Email nhận hóa đơn không hợp lệ",
  CART_INVALID: "Một số sản phẩm trong giỏ đã hết hàng hoặc ngừng bán",
  PLACE_ORDER_TOO_FAST: "Bạn đặt hàng quá nhanh, vui lòng thử lại sau ít phút",
  CANCEL_REASON_INVALID: "Lý do hủy không hợp lệ",
  AFFILIATE_NOT_ACTIVE: "Tài khoản CTV không ở trạng thái hoạt động",
  BANK_ACCOUNT_REQUIRED: "Vui lòng cập nhật tài khoản ngân hàng trước khi rút tiền",
  WITHDRAW_LOCKED: "Vừa đổi tài khoản ngân hàng – được rút tiền sau #lockedUntil#",
  NAME_REQUIRED: "Vui lòng nhập họ tên",
  AFFILIATE_INVALID_STATE: "Không thể #action# khi CTV đang ở trạng thái #status#",
  REASON_REQUIRED: "Vui lòng nhập lý do",
  COMMISSION_RATE_INVALID: "Tỉ lệ hoa hồng không hợp lệ",
  COMMISSION_NOT_PENDING: "Chỉ duyệt được hoa hồng đang chờ",
  COMMISSION_NOT_ELIGIBLE: "Hoa hồng chưa đủ điều kiện duyệt: #reason#",
  COMMISSION_ALREADY_APPROVED: "Hoa hồng đã duyệt, không thể hủy",
  PAYOUT_BELOW_MINIMUM: "Số tiền rút tối thiểu là #minPayout#đ",
  INSUFFICIENT_BALANCE: "Số dư khả dụng không đủ",
  TRANSACTION_REF_REQUIRED: "Vui lòng nhập mã giao dịch chuyển khoản",
  REFERRAL_CODE_INVALID: "Mã giới thiệu không hợp lệ",
  AFFILIATE_NOT_FOUND: "Không tìm thấy CTV",
  AFFILIATE_NOT_REGISTERED: "Bạn chưa đăng ký cộng tác viên",
  AFFILIATE_NOT_APPROVED: "Tài khoản CTV chưa được duyệt",
  PHONE_REQUIRED: "Vui lòng nhập số điện thoại liên hệ để đăng ký CTV",
  ID_CARD_REQUIRED: "Vui lòng tải lên ảnh CCCD mặt trước và mặt sau",
  ID_CARD_INVALID: "Ảnh CCCD không hợp lệ, vui lòng tải lại",
  ID_CARD_NOT_FOUND: "CTV chưa có ảnh CCCD",
  ID_CARD_UPLOAD_LIMIT: "Bạn tải ảnh quá nhiều lần, vui lòng thử lại sau 1 giờ",
  ALREADY_REGISTERED: "Bạn đã đăng ký CTV (trạng thái #status#)",
  PAYOUT_OPEN: "Bạn đang có một yêu cầu rút tiền chưa xử lý xong",
  PAYOUT_NOT_FOUND: "Không tìm thấy yêu cầu rút tiền",
  VIDEO_NOT_FOUND: "Không tìm thấy video",
  VIDEO_TITLE_REQUIRED: "Vui lòng nhập tiêu đề video",
  VIDEO_URL_INVALID: "Link video không hợp lệ hoặc chưa được hỗ trợ. Hãy dán link của một video Facebook, TikTok hoặc YouTube",
  VIDEO_URL_HTTPS_REQUIRED: "Chỉ nhận link bắt đầu bằng https",
  VIDEO_URL_UNSUPPORTED_PLATFORM: "Chỉ hỗ trợ video Facebook, TikTok và YouTube",
  VIDEO_URL_SHORT_LINK: "Chưa hỗ trợ link rút gọn hoặc link chia sẻ. Hãy mở video rồi sao chép link đầy đủ trên thanh địa chỉ",
  VIDEO_PLATFORM_MISMATCH: "Nền tảng đã chọn không khớp với link video",
  VIDEO_ALREADY_EXISTS: "Video này đã được thêm trước đó",
  VIDEO_THUMBNAIL_INVALID: "Ảnh bìa phải là ảnh tải lên hoặc link ảnh bắt đầu bằng https",
  VIDEO_CATEGORY_NOT_FOUND: "Danh mục đã chọn không còn tồn tại",
  VIDEO_PRODUCT_NOT_FOUND: "Có sản phẩm không còn tồn tại hoặc chưa được gắn với video này",
  VIDEO_TOO_MANY_PRODUCTS: "Mỗi video gắn tối đa #max# sản phẩm",
} as const satisfies Record<string, string>;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

/** Tên trạng thái (enum backend) -> chữ hiển thị trong câu, VD "đơn đang ở trạng thái đã giao". */
const STATUS_LABELS: Record<string, string> = {
  PENDING: "chờ xử lý",
  CONFIRMED: "đã xác nhận",
  SHIPPING: "đang giao",
  DELIVERED: "đã giao",
  COMPLETED: "hoàn tất",
  CANCELLED: "đã hủy",
  RETURNED: "đã trả hàng",
  APPROVED: "đã duyệt",
  REJECTED: "bị từ chối",
  SUSPENDED: "tạm khóa",
  REQUESTED: "đang chờ duyệt",
  PAID: "đã chi trả",
};

/** Định dạng số liệu trước khi chèn vào câu. */
const FORMATTERS: Record<string, (v: unknown) => string> = {
  status: (v) => STATUS_LABELS[String(v)] ?? String(v),
  minPayout: (v) => Number(v).toLocaleString("vi-VN"),
  lockedUntil: (v) => new Date(String(v)).toLocaleString("vi-VN"),
};

const isCode = (code: string): code is ErrorCode => Object.hasOwn(ERROR_MESSAGES, code);

/**
 * Dịch lỗi backend sang tiếng Việt theo mã lỗi.
 * @param code    `messageCode` backend trả về
 * @param details `details` backend trả kèm (số liệu cho placeholder)
 * @returns câu tiếng Việt, hoặc null nếu chưa có bản dịch / thiếu số liệu (khi đó dùng câu của backend)
 */
export function translateError(code: string | undefined, details?: Record<string, unknown> | null): string | null {
  if (!code || !isCode(code)) return null;
  let missing = false;
  const text = ERROR_MESSAGES[code].replace(/#(\w+)#/g, (_, key: string) => {
    const v = details?.[key];
    if (v === undefined || v === null) {
      missing = true;
      return "";
    }
    return (FORMATTERS[key] ?? String)(v);
  });
  return missing ? null : text;
}

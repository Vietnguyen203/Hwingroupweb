package com.vietnl.hwin.common.notification;

import java.util.List;
import java.util.UUID;

/**
 * Danh sách tài khoản quản trị đang hoạt động – để gửi thông báo cho tất cả admin.
 * Interface nằm ở shared kernel, module identity cài đặt (tránh common phụ thuộc ngược vào identity).
 */
public interface AdminDirectory {

    List<UUID> activeAdminIds();
}

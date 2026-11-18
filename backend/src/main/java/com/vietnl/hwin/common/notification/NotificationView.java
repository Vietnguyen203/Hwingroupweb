package com.vietnl.hwin.common.notification;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Một thông báo gửi cho giao diện (REST và WebSocket dùng chung).
 * {@code type} là tên {@link NotificationType}; {@code data} là dữ liệu điền vào câu; {@code link} là đường dẫn khi bấm.
 */
public record NotificationView(UUID id, String type, Map<String, Object> data, String link, Instant createdAt, boolean read) {
}

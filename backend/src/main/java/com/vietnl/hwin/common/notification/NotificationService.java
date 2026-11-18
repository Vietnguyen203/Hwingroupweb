package com.vietnl.hwin.common.notification;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.vietnl.hwin.common.web.PageResponse;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * Thông báo trong ứng dụng: lưu vào notification.notifications và đẩy ngay tới trình duyệt qua WebSocket.
 *
 * <p>Các module gọi {@code notifyUser / notifyAdmins} ở bất kỳ đâu (kể cả trong transaction nghiệp vụ):
 * việc ghi + đẩy tin chỉ chạy SAU KHI transaction của người gọi commit (rollback thì không có thông báo ma),
 * chạy trong transaction riêng, lỗi chỉ ghi log và không bao giờ làm hỏng nghiệp vụ.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final TypeReference<Map<String, Object>> MAP = new TypeReference<>() {
    };

    private final JdbcTemplate jdbc;
    private final JsonMapper json;
    private final AdminDirectory admins;
    private final RealtimeHub hub;
    private final TransactionTemplate newTx;

    public NotificationService(JdbcTemplate jdbc, JsonMapper json, AdminDirectory admins, RealtimeHub hub,
                               PlatformTransactionManager txManager) {
        this.jdbc = jdbc;
        this.json = json;
        this.admins = admins;
        this.hub = hub;
        this.newTx = new TransactionTemplate(txManager);
        this.newTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // ------------------------------------------------------------------ gửi

    /**
     * @param dedupeKey khóa chống trùng khi sự kiện bị xử lý lại (duy nhất theo từng người nhận); null = không chống trùng
     */
    public void notifyUser(UUID userId, NotificationType type, Map<String, Object> data, String link, String dedupeKey) {
        if (userId == null) {
            return;
        }
        afterCommit(() -> deliver(userId, type, data, link, dedupeKey));
    }

    /** Gửi cho tất cả admin đang hoạt động. */
    public void notifyAdmins(NotificationType type, Map<String, Object> data, String link, String dedupeKey) {
        afterCommit(() -> {
            List<UUID> ids = newTx.execute(s -> admins.activeAdminIds());
            if (ids != null) {
                ids.forEach(id -> deliver(id, type, data, link, dedupeKey));
            }
        });
    }

    private void deliver(UUID userId, NotificationType type, Map<String, Object> data, String link, String dedupeKey) {
        try {
            Map<String, Object> safe = data == null ? Map.of() : data;
            UUID id = UUID.randomUUID();
            Boolean inserted = newTx.execute(s -> jdbc.update("""
                    insert into notification.notifications(id, recipient_id, type, data, link, dedupe_key)
                    values (?, ?, ?, cast(? as jsonb), ?, ?)
                    on conflict do nothing
                    """, id, userId, type.name(), json.writeValueAsString(safe), link, dedupeKey) == 1);
            if (!Boolean.TRUE.equals(inserted)) {
                return; // sự kiện được xử lý lại: đã có thông báo này rồi
            }
            NotificationView view = new NotificationView(id, type.name(), safe, link, Instant.now(), false);
            hub.push(userId, Map.of("type", "notification", "notification", view, "unreadCount", unreadCount(userId)));
        } catch (RuntimeException e) {
            log.warn("Could not deliver notification {} to user {}: {}", type, userId, e.toString());
        }
    }

    /** Chạy sau khi transaction hiện tại commit; không có transaction thì chạy ngay. */
    private static void afterCommit(Runnable work) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    work.run();
                }
            });
        } else {
            work.run();
        }
    }

    // ------------------------------------------------------------------ đọc

    public PageResponse<NotificationView> list(UUID userId, int page, int pageSize, boolean unreadOnly) {
        int size = Math.clamp(pageSize, 1, 50);
        int no = Math.max(page, 1);
        String where = "recipient_id = ?" + (unreadOnly ? " and read_at is null" : "");
        Long total = jdbc.queryForObject("select count(*) from notification.notifications where " + where, Long.class, userId);
        List<NotificationView> rows = jdbc.query("""
                select id, type, data::text as data, link, created_at, read_at
                from notification.notifications where %s
                order by created_at desc, id desc limit ? offset ?
                """.formatted(where), (rs, i) -> view(rs), userId, size, (long) (no - 1) * size);
        long count = total == null ? 0 : total;
        return new PageResponse<>(rows, no, size, count, (int) Math.ceil(count / (double) size));
    }

    public long unreadCount(UUID userId) {
        Long n = jdbc.queryForObject(
                "select count(*) from notification.notifications where recipient_id = ? and read_at is null", Long.class, userId);
        return n == null ? 0 : n;
    }

    // ------------------------------------------------------------------ đánh dấu đã đọc

    /** @return số chưa đọc sau khi đánh dấu (chỉ đánh dấu được thông báo của chính mình) */
    public long markRead(UUID userId, UUID notificationId) {
        jdbc.update("update notification.notifications set read_at = now() where id = ? and recipient_id = ? and read_at is null",
                notificationId, userId);
        return syncUnread(userId);
    }

    public long markAllRead(UUID userId) {
        jdbc.update("update notification.notifications set read_at = now() where recipient_id = ? and read_at is null", userId);
        return syncUnread(userId);
    }

    /** Báo cho các tab khác của cùng người dùng cập nhật số chưa đọc. */
    private long syncUnread(UUID userId) {
        long unread = unreadCount(userId);
        hub.push(userId, Map.of("type", "unread", "unreadCount", unread));
        return unread;
    }

    // ------------------------------------------------------------------ dọn dẹp

    /** Xóa thông báo cũ: đã đọc quá {@code readDays} ngày hoặc bất kỳ thông báo nào quá {@code anyDays} ngày. */
    public int purge(int readDays, int anyDays) {
        return jdbc.update("""
                delete from notification.notifications
                where created_at < now() - make_interval(days => ?)
                   or (read_at is not null and read_at < now() - make_interval(days => ?))
                """, anyDays, readDays);
    }

    private NotificationView view(ResultSet rs) throws SQLException {
        Map<String, Object> data = json.readValue(rs.getString("data"), MAP);
        boolean read = rs.getObject("read_at", OffsetDateTime.class) != null;
        return new NotificationView(rs.getObject("id", UUID.class), rs.getString("type"), data, rs.getString("link"),
                rs.getObject("created_at", OffsetDateTime.class).toInstant(), read);
    }
}

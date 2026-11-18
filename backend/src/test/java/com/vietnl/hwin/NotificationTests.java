package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.WebSocketHttpHeaders;

import com.vietnl.hwin.common.notification.AdminDirectory;
import com.vietnl.hwin.common.notification.NotificationService;
import com.vietnl.hwin.common.notification.NotificationType;
import com.vietnl.hwin.common.notification.NotificationView;
import com.vietnl.hwin.common.notification.RealtimeHub;
import com.vietnl.hwin.common.security.JwtService;
import com.vietnl.hwin.common.web.PageResponse;

/**
 * Thông báo trong ứng dụng + kênh WebSocket thời gian thực:
 * lưu / đọc / đánh dấu đã đọc, chống trùng, chỉ đọc được thông báo của chính mình, đẩy qua WebSocket thật,
 * từ chối kết nối chưa đăng nhập hoặc từ trang web lạ.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class NotificationTests {

    private static final String ALLOWED_ORIGIN = "http://localhost:3100";

    @LocalServerPort int port;
    @Autowired NotificationService notifications;
    @Autowired JwtService jwt;
    @Autowired RealtimeHub hub;
    @MockitoBean AdminDirectory admins;

    private static Map<String, Object> order(String code) {
        return Map.of("orderCode", code, "total", 340_000);
    }

    // ------------------------------------------------------------------ lưu / đọc

    @Test
    void storesListsAndMarksRead() {
        UUID me = UUID.randomUUID();
        notifications.notifyUser(me, NotificationType.ORDER_CONFIRMED, order("HW1"), "/account/orders/HW1", null);
        notifications.notifyUser(me, NotificationType.ORDER_SHIPPED, order("HW1"), "/account/orders/HW1", null);

        assertThat(notifications.unreadCount(me)).isEqualTo(2);
        PageResponse<NotificationView> page = notifications.list(me, 1, 20, false);
        assertThat(page.totalElements()).isEqualTo(2);
        NotificationView newest = page.content().get(0);
        assertThat(newest.type()).isEqualTo("ORDER_SHIPPED"); // mới nhất trước
        assertThat(newest.data()).containsEntry("orderCode", "HW1");
        assertThat(newest.link()).isEqualTo("/account/orders/HW1");
        assertThat(newest.read()).isFalse();

        assertThat(notifications.markRead(me, newest.id())).isEqualTo(1);
        assertThat(notifications.list(me, 1, 20, true).content()).hasSize(1); // chỉ còn chưa đọc
        assertThat(notifications.markAllRead(me)).isZero();
        assertThat(notifications.list(me, 1, 20, false).content()).allMatch(NotificationView::read);
    }

    @Test
    void sameDedupeKeyIsStoredOnlyOncePerRecipient() {
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        notifications.notifyUser(a, NotificationType.ORDER_DELIVERED, order("HW2"), null, "order-delivered:x");
        notifications.notifyUser(a, NotificationType.ORDER_DELIVERED, order("HW2"), null, "order-delivered:x"); // xử lý lại
        notifications.notifyUser(b, NotificationType.ORDER_DELIVERED, order("HW2"), null, "order-delivered:x"); // người khác vẫn nhận

        assertThat(notifications.unreadCount(a)).isEqualTo(1);
        assertThat(notifications.unreadCount(b)).isEqualTo(1);
    }

    @Test
    void cannotReadSomeoneElsesNotification() {
        UUID owner = UUID.randomUUID();
        UUID other = UUID.randomUUID();
        notifications.notifyUser(owner, NotificationType.PAYOUT_PAID, Map.of("amount", 200_000), null, null);
        UUID id = notifications.list(owner, 1, 20, false).content().get(0).id();

        assertThat(notifications.markRead(other, id)).isZero();
        assertThat(notifications.unreadCount(owner)).isEqualTo(1); // vẫn chưa đọc
        assertThat(notifications.list(other, 1, 20, false).content()).isEmpty();
    }

    @Test
    void notifiesEveryActiveAdmin() {
        UUID admin1 = UUID.randomUUID();
        UUID admin2 = UUID.randomUUID();
        when(admins.activeAdminIds()).thenReturn(List.of(admin1, admin2));

        notifications.notifyAdmins(NotificationType.ORDER_PLACED, order("HW3"), "/admin/orders/x", "order-placed:3");

        assertThat(notifications.unreadCount(admin1)).isEqualTo(1);
        assertThat(notifications.unreadCount(admin2)).isEqualTo(1);
    }

    @Test
    void purgeRemovesOnlyOldNotifications() {
        UUID me = UUID.randomUUID();
        notifications.notifyUser(me, NotificationType.ORDER_CONFIRMED, order("HW4"), null, null);

        assertThat(notifications.purge(30, 90)).isZero(); // mới tạo: giữ lại
        assertThat(notifications.list(me, 1, 20, false).totalElements()).isEqualTo(1);
    }

    // ------------------------------------------------------------------ WebSocket

    private BlockingQueue<String> connect(UUID userId) throws Exception {
        BlockingQueue<String> inbox = new LinkedBlockingQueue<>();
        WebSocketHttpHeaders headers = new WebSocketHttpHeaders();
        headers.add("Cookie", "hwin_at=" + jwt.issueAccessToken(userId, List.of("CUSTOMER"), Instant.now()));
        headers.setOrigin(ALLOWED_ORIGIN);
        new StandardWebSocketClient().execute(new TextWebSocketHandler() {
            @Override
            protected void handleTextMessage(WebSocketSession session, TextMessage message) {
                inbox.add(message.getPayload());
            }
        }, headers, URI.create("ws://localhost:" + port + "/api/realtime")).get(10, TimeUnit.SECONDS);
        assertThat(inbox.poll(5, TimeUnit.SECONDS)).contains("\"type\":\"hello\"");
        return inbox;
    }

    @Test
    void pushesNewNotificationAndUnreadSyncOverWebSocket() throws Exception {
        UUID me = UUID.randomUUID();
        BlockingQueue<String> inbox = connect(me);
        assertThat(hub.connectionCount(me)).isEqualTo(1);

        notifications.notifyUser(me, NotificationType.COMMISSION_EARNED, Map.of("orderCode", "HW5", "amount", 12_500), "/affiliate", null);
        String pushed = inbox.poll(5, TimeUnit.SECONDS);
        assertThat(pushed).contains("\"type\":\"notification\"", "\"type\":\"COMMISSION_EARNED\"", "\"unreadCount\":1", "HW5");

        notifications.markAllRead(me); // các tab khác nhận số chưa đọc mới
        assertThat(inbox.poll(5, TimeUnit.SECONDS)).contains("\"type\":\"unread\"", "\"unreadCount\":0");
    }

    @Test
    void rejectsHandshakeWithoutLogin() {
        WebSocketHttpHeaders headers = new WebSocketHttpHeaders();
        headers.setOrigin(ALLOWED_ORIGIN);
        assertThatThrownBy(() -> new StandardWebSocketClient().execute(new TextWebSocketHandler() {
        }, headers, URI.create("ws://localhost:" + port + "/api/realtime")).get(10, TimeUnit.SECONDS))
                .isInstanceOf(ExecutionException.class);
    }

    @Test
    void rejectsHandshakeFromUnknownOrigin() {
        WebSocketHttpHeaders headers = new WebSocketHttpHeaders();
        headers.add("Cookie", "hwin_at=" + jwt.issueAccessToken(UUID.randomUUID(), List.of("CUSTOMER"), Instant.now()));
        headers.setOrigin("http://evil.example.com");
        assertThatThrownBy(() -> new StandardWebSocketClient().execute(new TextWebSocketHandler() {
        }, headers, URI.create("ws://localhost:" + port + "/api/realtime")).get(10, TimeUnit.SECONDS))
                .isInstanceOf(ExecutionException.class);
    }
}

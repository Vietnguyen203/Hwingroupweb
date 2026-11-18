package com.vietnl.hwin.common.notification;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArraySet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import tools.jackson.databind.json.JsonMapper;

/**
 * Giữ các kết nối WebSocket đang mở theo từng người dùng và đẩy tin xuống trình duyệt (một người có thể mở nhiều tab).
 * Chỉ đẩy từ server xuống; client chỉ gửi "ping" để giữ kết nối. Bộ nhớ trong một tiến trình
 * (chạy nhiều bản backend thì cần thêm kênh chung như Redis pub/sub).
 */
@Component
public class RealtimeHub extends TextWebSocketHandler {

    /** Khóa thuộc tính phiên: id người dùng, do bước bắt tay (handshake) gán sau khi đọc cookie đăng nhập. */
    static final String ATTR_USER = "hwin.userId";

    private static final Logger log = LoggerFactory.getLogger(RealtimeHub.class);
    private static final int SEND_TIME_LIMIT_MS = 5_000;
    private static final int SEND_BUFFER_BYTES = 64 * 1024;
    /** Số tab tối đa mỗi người; mở thêm thì đóng kết nối cũ nhất. */
    private static final int MAX_SESSIONS_PER_USER = 8;

    private final ConcurrentMap<UUID, Set<WebSocketSession>> sessions = new ConcurrentHashMap<>();
    private final JsonMapper json;

    public RealtimeHub(JsonMapper json) {
        this.json = json;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession raw) throws Exception {
        UUID userId = userOf(raw);
        if (userId == null) {
            raw.close(CloseStatus.POLICY_VIOLATION);
            return;
        }
        WebSocketSession session = new ConcurrentWebSocketSessionDecorator(raw, SEND_TIME_LIMIT_MS, SEND_BUFFER_BYTES);
        Set<WebSocketSession> set = sessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>());
        set.add(session);
        if (set.size() > MAX_SESSIONS_PER_USER) {
            set.stream().findFirst().ifPresent(oldest -> {
                set.remove(oldest);
                closeQuietly(oldest);
            });
        }
        send(session, Map.of("type", "hello"));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        if ("ping".equals(message.getPayload())) {
            send(session, Map.of("type", "pong"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        UUID userId = userOf(session);
        if (userId != null) {
            sessions.computeIfPresent(userId, (k, set) -> {
                set.removeIf(s -> s.getId().equals(session.getId()));
                return set.isEmpty() ? null : set;
            });
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.debug("WebSocket transport error on session {}: {}", session.getId(), exception.toString());
        closeQuietly(session);
    }

    /** Đẩy một tin JSON tới mọi tab đang mở của người dùng; không có kết nối nào thì bỏ qua. */
    public void push(UUID userId, Object payload) {
        Set<WebSocketSession> set = sessions.get(userId);
        if (set == null || set.isEmpty()) {
            return;
        }
        String text = json.writeValueAsString(payload);
        for (WebSocketSession s : new ArrayList<>(set)) {
            sendText(s, text);
        }
    }

    /** Số kết nối đang mở của người dùng (dùng cho test / giám sát). */
    public int connectionCount(UUID userId) {
        Set<WebSocketSession> set = sessions.get(userId);
        return set == null ? 0 : set.size();
    }

    private void send(WebSocketSession session, Object payload) {
        sendText(session, json.writeValueAsString(payload));
    }

    private void sendText(WebSocketSession session, String text) {
        if (!session.isOpen()) {
            return;
        }
        try {
            session.sendMessage(new TextMessage(text));
        } catch (IOException | RuntimeException e) {
            log.debug("WebSocket send failed on session {}: {}", session.getId(), e.toString());
            closeQuietly(session);
        }
    }

    private static void closeQuietly(WebSocketSession session) {
        try {
            session.close(CloseStatus.SESSION_NOT_RELIABLE);
        } catch (IOException | RuntimeException ignored) {
            // đã đóng
        }
    }

    private static UUID userOf(WebSocketSession session) {
        return session.getAttributes().get(ATTR_USER) instanceof UUID id ? id : null;
    }

    /** Danh sách người đang kết nối (test). */
    List<UUID> connectedUsers() {
        return List.copyOf(sessions.keySet());
    }
}

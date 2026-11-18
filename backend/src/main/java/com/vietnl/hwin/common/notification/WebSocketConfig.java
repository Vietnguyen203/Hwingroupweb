package com.vietnl.hwin.common.notification;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.security.SecurityProperties;

/**
 * Điểm kết nối WebSocket thời gian thực: {@code /api/realtime}.
 * - Xác thực bằng cookie đăng nhập (hwin_at) qua bộ lọc Spring Security như mọi API khác; chưa đăng nhập -> 401.
 * - Chỉ chấp nhận trang web thuộc danh sách origin cho phép (cùng danh sách CORS), chống kết nối chéo trang.
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    public static final String ENDPOINT = "/api/realtime";

    private final RealtimeHub hub;
    private final SecurityProperties props;

    public WebSocketConfig(RealtimeHub hub, SecurityProperties props) {
        this.hub = hub;
        this.props = props;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        List<String> origins = new ArrayList<>(props.corsOrigins());
        origins.addAll(props.corsOriginPatterns());
        registry.addHandler(hub, ENDPOINT)
                .addInterceptors(new UserHandshakeInterceptor())
                .setAllowedOriginPatterns(origins.toArray(String[]::new));
    }

    /** Lấy người dùng từ SecurityContext (đã được JwtCookieAuthenticationFilter gán) và gắn vào phiên WebSocket. */
    static class UserHandshakeInterceptor implements HandshakeInterceptor {

        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler handler,
                                       Map<String, Object> attributes) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof AuthPrincipal principal) {
                attributes.put(RealtimeHub.ATTR_USER, principal.userId());
                return true;
            }
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler handler,
                                   Exception exception) {
            // không cần xử lý thêm
        }
    }
}

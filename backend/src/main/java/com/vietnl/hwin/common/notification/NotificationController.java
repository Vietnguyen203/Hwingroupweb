package com.vietnl.hwin.common.notification;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.common.web.PageResponse;

import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Thông báo của người đang đăng nhập (khách, CTV hay admin đều dùng). Luôn theo userId trong token, không nhận userId từ client.
 */
@Tag(name = "notification")
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PageResponse<NotificationView>> list(@AuthenticationPrincipal AuthPrincipal me,
                                                               @RequestParam(name = "page", defaultValue = "1") int page,
                                                               @RequestParam(name = "page_size", defaultValue = "20") int pageSize,
                                                               @RequestParam(name = "unread", defaultValue = "false") boolean unread) {
        return ResponseEntity.ok(service.list(me.userId(), page, pageSize, unread));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(Map.of("unread", service.unreadCount(me.userId())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Map<String, Long>> markRead(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID id) {
        return ResponseEntity.ok(Map.of("unread", service.markRead(me.userId(), id)));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Long>> markAllRead(@AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(Map.of("unread", service.markAllRead(me.userId())));
    }
}

package com.vietnl.hwin.common.audit;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.web.PageResponse;

import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Admin xem nhật ký kiểm toán (thay đổi liên quan tới tiền). Chỉ đọc – bảng audit_log không cho sửa/xóa.
 * Bộ lọc luôn bind tham số (không nối chuỗi từ input).
 */
@Tag(name = "audit-admin")
@RestController
@RequestMapping("/api/admin/audit-logs")
public class AuditLogController {

    private final JdbcTemplate jdbc;

    public AuditLogController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record AuditLogResponse(UUID id, String module, String aggregateType, String aggregateId, String action,
                                   UUID actorId, Long amount, String detail, Instant createdAt) {
    }

    /**
     * @param aggregateType Order, Commission, Payout, Affiliate
     * @param action        ví dụ ORDER_PAID, COMMISSION_APPROVED, PAYOUT_PAID, BANK_CHANGED, BANK_VIEWED
     */
    @GetMapping
    public PageResponse<AuditLogResponse> list(@RequestParam(required = false) String module,
                                               @RequestParam(required = false) String aggregateType,
                                               @RequestParam(required = false) String aggregateId,
                                               @RequestParam(required = false) String action,
                                               @RequestParam(required = false) UUID actorId,
                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
                                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
                                               @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                               @RequestParam(name = "page_size", defaultValue = "50") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        StringBuilder where = new StringBuilder(" where 1 = 1");
        List<Object> args = new ArrayList<>();
        filter(where, args, "module", module);
        filter(where, args, "aggregate_type", aggregateType);
        filter(where, args, "aggregate_id", aggregateId);
        filter(where, args, "action", action);
        if (actorId != null) {
            where.append(" and actor_id = ?");
            args.add(actorId);
        }
        if (from != null) {
            where.append(" and created_at >= ?");
            args.add(Timestamp.from(from));
        }
        if (to != null) {
            where.append(" and created_at < ?");
            args.add(Timestamp.from(to));
        }
        int p = Math.max(page, 0);
        int s = Math.clamp(size, 1, 200);
        Long total = jdbc.queryForObject("select count(*) from audit.audit_log" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(s);
        pageArgs.add((long) p * s);
        List<AuditLogResponse> rows = jdbc.query("""
                        select id, module, aggregate_type, aggregate_id, action, actor_id, amount, detail::text as detail, created_at
                          from audit.audit_log""" + where + " order by created_at desc limit ? offset ?",
                (rs, i) -> new AuditLogResponse(rs.getObject("id", UUID.class), rs.getString("module"),
                        rs.getString("aggregate_type"), rs.getString("aggregate_id"), rs.getString("action"),
                        rs.getObject("actor_id", UUID.class), (Long) rs.getObject("amount"), rs.getString("detail"),
                        rs.getTimestamp("created_at").toInstant()),
                pageArgs.toArray());
        long t = total == null ? 0 : total;
        return new PageResponse<>(rows, p + 1, s, t, (int) Math.ceil((double) t / s));
    }

    private static void filter(StringBuilder where, List<Object> args, String column, String value) {
        if (value != null && !value.isBlank()) {
            where.append(" and ").append(column).append(" = ?");
            args.add(value.trim());
        }
    }
}

package com.vietnl.hwin.common.audit;

import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ghi nhật ký kiểm toán cho thay đổi liên quan tới tiền vào audit.audit_logs.
 * Bảng chỉ cho INSERT (trigger DB chặn UPDATE/DELETE). Chạy trong transaction của người gọi.
 */
@Component
public class AuditLogger {

    private final JdbcTemplate jdbc;

    public AuditLogger(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * @param detailJson JSON mô tả trước/sau – KHÔNG chứa dữ liệu nhạy cảm (số tài khoản, OTP...)
     */
    public void log(String module, String aggregateType, Object aggregateId, String action,
                    UUID actorId, Long amount, String detailJson) {
        jdbc.update("""
                insert into audit.audit_logs(module, aggregate_type, aggregate_id, action, actor_id, amount, detail)
                values (?, ?, ?, ?, ?, ?, cast(? as jsonb))
                """, module, aggregateType, String.valueOf(aggregateId), action, actorId, amount,
                detailJson == null ? "{}" : detailJson);
    }
}

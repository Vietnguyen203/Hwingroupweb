package com.vietnl.hwin.common.audit;

import org.springframework.http.ResponseEntity;
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

public record AuditLogResponse(UUID id, String module, String aggregateType, String aggregateId, String action,
                               UUID actorId, Long amount, String detail, Instant createdAt) {
}

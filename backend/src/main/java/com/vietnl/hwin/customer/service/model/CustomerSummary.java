package com.vietnl.hwin.customer.service.model;

import com.vietnl.hwin.common.web.PageResponse;
import com.vietnl.hwin.customer.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;
import java.io.IOException;
import java.io.Writer;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.customer.entity.CustomerSegment;

public record CustomerSummary(UUID id, String phone, String email, String fullName, int totalOrders, long totalSpent,
                          Instant firstOrderAt, Instant lastOrderAt, Instant createdAt, CustomerSegment segment) {
}

package com.vietnl.hwin.customer.service;

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

/**
 * Admin: danh sách khách, lọc theo nhóm (mới / thân thiết / lâu chưa quay lại), xuất CSV.
 * Truy vấn read model bằng SQL tham số hóa (giá trị luôn bind, không nối chuỗi từ input).
 */
@Service
public class CustomerAdminService {

    private static final DateTimeFormatter CSV_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final JdbcTemplate jdbc;
    private final CustomerProperties props;
    private final Clock clock;

    public CustomerAdminService(JdbcTemplate jdbc, CustomerProperties props, Clock clock) {
        this.jdbc = jdbc;
        this.props = props;
        this.clock = clock;
    }

    public record CustomerRow(UUID id, String phone, String email, String fullName, int totalOrders, long totalSpent,
                              Instant firstOrderAt, Instant lastOrderAt, Instant createdAt, CustomerSegment segment) {
    }


    @Transactional(readOnly = true)
    public PageResponse<CustomerRow> search(String q, CustomerSegment segment, int page, int size) {
        int p = Math.max(page, 0);
        int s = Math.clamp(size, 1, 100);
        List<Object> args = new ArrayList<>();
        String where = where(q, segment, args);
        Long total = jdbc.queryForObject("select count(*) from customer.customer c "
                + "left join customer.customer_stats s on s.customer_id = c.id" + where, Long.class, args.toArray());
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(s);
        pageArgs.add((long) p * s);
        List<CustomerRow> rows = jdbc.query(select() + where + " order by c.created_at desc limit ? offset ?",
                (rs, i) -> row(rs), pageArgs.toArray());
        long t = total == null ? 0 : total;
        return new PageResponse<>(rows, p + 1, s, t, (int) Math.ceil((double) t / s));
    }

    @Transactional(readOnly = true)
    public CustomerRow get(UUID id) {
        List<CustomerRow> rows = jdbc.query(select() + " where c.id = ?", (rs, i) -> row(rs), id);
        if (rows.isEmpty()) {
            throw new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.CUSTOMER_NOT_FOUND);
        }
        return rows.get(0);
    }

    /** Xuất CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt), tối đa 10.000 dòng theo bộ lọc. */
    @Transactional(readOnly = true)
    public void exportCsv(String q, CustomerSegment segment, Writer out) throws IOException {
        List<Object> args = new ArrayList<>();
        String where = where(q, segment, args);
        List<CustomerRow> rows = jdbc.query(select() + where + " order by c.created_at desc limit 10000",
                (rs, i) -> row(rs), args.toArray());
        out.write('﻿');
        out.write("id,so_dien_thoai,email,ho_ten,nhom,tong_don,tong_chi_tieu,don_dau_tien,don_gan_nhat,ngay_tao\n");
        for (CustomerRow r : rows) {
            out.write(String.join(",", String.valueOf(r.id()), csv(r.phone()), csv(r.email()), csv(r.fullName()),
                    r.segment().name(), String.valueOf(r.totalOrders()), String.valueOf(r.totalSpent()),
                    time(r.firstOrderAt()), time(r.lastOrderAt()), time(r.createdAt())));
            out.write('\n');
        }
        out.flush();
    }

    /** Quy tắc nhóm: DORMANT ưu tiên, sau đó LOYAL, còn lại NEW. */
    public CustomerSegment segmentOf(int totalOrders, Instant lastOrderAt) {
        if (lastOrderAt != null && lastOrderAt.isBefore(dormantBefore())) {
            return CustomerSegment.DORMANT;
        }
        return totalOrders >= props.loyalMinOrders() ? CustomerSegment.LOYAL : CustomerSegment.NEW;
    }

    // ------------------------------------------------------------------ SQL

    private static String select() {
        return """
                select c.id, c.phone, c.email, c.full_name, c.created_at,
                       coalesce(s.total_orders, 0) as total_orders, coalesce(s.total_spent, 0) as total_spent,
                       s.first_order_at, s.last_order_at
                  from customer.customer c
                  left join customer.customer_stats s on s.customer_id = c.id
                """;
    }

    private String where(String q, CustomerSegment segment, List<Object> args) {
        StringBuilder w = new StringBuilder(" where 1 = 1");
        if (q != null && !q.isBlank()) {
            String digits = q.replaceAll("\\D", "");
            String name = "%" + q.trim().toLowerCase().replace("%", "") + "%";
            if (digits.length() >= 3) {
                // SĐT lưu dạng +84xxxxxxxxx: bỏ số 0 đầu của chuỗi người dùng nhập
                String phonePart = digits.startsWith("0") ? digits.substring(1) : digits;
                w.append(" and (c.phone like ? or lower(c.full_name) like ? or c.email like ?)");
                args.add("%" + phonePart + "%");
                args.add(name);
                args.add(name);
            } else {
                w.append(" and (lower(c.full_name) like ? or c.email like ?)");
                args.add(name);
                args.add(name);
            }
        }
        if (segment != null) {
            Timestamp dormant = Timestamp.from(dormantBefore());
            switch (segment) {
                case DORMANT -> {
                    w.append(" and s.last_order_at < ?");
                    args.add(dormant);
                }
                case LOYAL -> {
                    w.append(" and coalesce(s.total_orders, 0) >= ? and (s.last_order_at is null or s.last_order_at >= ?)");
                    args.add(props.loyalMinOrders());
                    args.add(dormant);
                }
                case NEW -> {
                    w.append(" and coalesce(s.total_orders, 0) < ? and (s.last_order_at is null or s.last_order_at >= ?)");
                    args.add(props.loyalMinOrders());
                    args.add(dormant);
                }
            }
        }
        return w.toString();
    }

    private CustomerRow row(java.sql.ResultSet rs) throws java.sql.SQLException {
        Instant last = instant(rs.getTimestamp("last_order_at"));
        int totalOrders = rs.getInt("total_orders");
        return new CustomerRow(rs.getObject("id", UUID.class), localPhone(rs.getString("phone")), rs.getString("email"),
                rs.getString("full_name"), totalOrders, rs.getLong("total_spent"),
                instant(rs.getTimestamp("first_order_at")), last, instant(rs.getTimestamp("created_at")),
                segmentOf(totalOrders, last));
    }

    private static String localPhone(String e164) {
        return e164 == null ? null : new PhoneNumber(e164).local();
    }

    private Instant dormantBefore() {
        return clock.instant().minusSeconds(props.dormantDays() * 86_400L);
    }

    private static Instant instant(Timestamp t) {
        return t == null ? null : t.toInstant();
    }

    private static String time(Instant i) {
        return i == null ? "" : CSV_TIME.format(i);
    }

    /** Escape CSV + chặn CSV injection (ô bắt đầu bằng = + - @ bị Excel hiểu là công thức). */
    private static String csv(String v) {
        if (v == null) {
            return "";
        }
        String s = v;
        if (!s.isEmpty() && "=+-@".indexOf(s.charAt(0)) >= 0) {
            s = "'" + s;
        }
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}

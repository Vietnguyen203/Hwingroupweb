package com.vietnl.hwin.ordering.service;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.ordering.repository.OrderRepository;

/**
 * Sinh mã đơn hiển thị cho khách: HW + yyMMdd + 4 ký tự (bỏ các ký tự dễ nhầm 0/O, 1/I).
 * Mã ngẫu nhiên nên không đoán được số lượng đơn; vẫn luôn kiểm tra quyền sở hữu khi tra cứu.
 */
@Component
public class OrderCodeGenerator {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyMMdd");
    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");

    private final SecureRandom random = new SecureRandom();
    private final OrderRepository orders;
    private final Clock clock;

    public OrderCodeGenerator(OrderRepository orders, Clock clock) {
        this.orders = orders;
        this.clock = clock;
    }

    public String next() {
        String prefix = "HW" + DATE.format(clock.instant().atZone(VN));
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(prefix);
            for (int i = 0; i < 4; i++) {
                sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
            }
            String code = sb.toString();
            if (!orders.existsByOrderCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Không sinh được mã đơn duy nhất");
    }
}

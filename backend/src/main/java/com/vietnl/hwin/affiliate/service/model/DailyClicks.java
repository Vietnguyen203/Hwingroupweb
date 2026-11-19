package com.vietnl.hwin.affiliate.service.model;

import java.time.LocalDate;

/** Số click của một ngày (giờ Việt Nam). */
public record DailyClicks(LocalDate date, long clicks) {
}

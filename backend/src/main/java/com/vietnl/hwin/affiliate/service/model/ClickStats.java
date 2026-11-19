package com.vietnl.hwin.affiliate.service.model;

import java.util.List;

/**
 * Thống kê click link CTV trong {@code days} ngày gần nhất (tính cả hôm nay, giờ Việt Nam).
 *
 * @param daily    chỉ gồm những ngày có click, cũ -> mới (phía giao diện tự điền 0 cho ngày trống)
 * @param bySource theo nền tảng, nhiều click nhất trước; chỉ gồm nền tảng có click
 */
public record ClickStats(int days, List<DailyClicks> daily, List<SourceClicks> bySource) {
}

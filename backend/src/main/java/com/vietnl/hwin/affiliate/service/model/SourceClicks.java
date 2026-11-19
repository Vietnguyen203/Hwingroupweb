package com.vietnl.hwin.affiliate.service.model;

import com.vietnl.hwin.affiliate.entity.ClickSource;

/** Số click theo nền tảng chia sẻ. */
public record SourceClicks(ClickSource source, long clicks) {
}

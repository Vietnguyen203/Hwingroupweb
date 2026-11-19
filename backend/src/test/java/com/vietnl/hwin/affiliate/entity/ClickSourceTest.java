package com.vietnl.hwin.affiliate.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ClickSourceTest {

    @Test
    void parsesKnownPlatformsIgnoringCase() {
        assertThat(ClickSource.parse("facebook")).isEqualTo(ClickSource.FACEBOOK);
        assertThat(ClickSource.parse("Zalo")).isEqualTo(ClickSource.ZALO);
        assertThat(ClickSource.parse("  TIKTOK ")).isEqualTo(ClickSource.TIKTOK);
        assertThat(ClickSource.parse("youtube")).isEqualTo(ClickSource.YOUTUBE);
        assertThat(ClickSource.parse("instagram")).isEqualTo(ClickSource.INSTAGRAM);
    }

    @Test
    void missingOrUnknownValueIsOther() {
        assertThat(ClickSource.parse(null)).isEqualTo(ClickSource.OTHER);
        assertThat(ClickSource.parse("")).isEqualTo(ClickSource.OTHER);
        assertThat(ClickSource.parse("   ")).isEqualTo(ClickSource.OTHER);
        assertThat(ClickSource.parse("myspace")).isEqualTo(ClickSource.OTHER);
        assertThat(ClickSource.parse("other")).isEqualTo(ClickSource.OTHER);
    }
}

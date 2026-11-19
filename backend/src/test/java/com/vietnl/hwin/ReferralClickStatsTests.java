package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.ClickSource;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.service.AffiliateAdminService;
import com.vietnl.hwin.affiliate.service.AffiliateDashboardService;
import com.vietnl.hwin.affiliate.service.AffiliateService;
import com.vietnl.hwin.affiliate.service.ReferralClickService;
import com.vietnl.hwin.affiliate.service.model.ClickStats;
import com.vietnl.hwin.affiliate.service.model.SourceClicks;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.service.UserAccountService;
import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Click link CTV được ghi kèm nền tảng chia sẻ (?src=) và thống kê theo ngày / theo nền tảng cho cổng CTV. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class ReferralClickStatsTests {

    private static final UUID ADMIN = UUID.randomUUID();
    private static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    /** Ảnh JPEG tối thiểu (chỉ cần đúng chữ ký file). */
    private static final byte[] FAKE_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46, 0};

    @Autowired UserAccountService users;
    @Autowired AffiliateService affiliateService;
    @Autowired AffiliateAdminService affiliateAdmin;
    @Autowired AffiliateRepository affiliates;
    @Autowired ReferralClickService clicks;
    @Autowired AffiliateDashboardService dashboards;

    private Affiliate approvedAffiliate(String phone) {
        UUID userId = users.loginByPhone(PhoneNumber.of(phone)).getId();
        String front = affiliateService.uploadIdCard(userId, new ByteArrayInputStream(FAKE_JPEG), FAKE_JPEG.length, "image/jpeg");
        String back = affiliateService.uploadIdCard(userId, new ByteArrayInputStream(FAKE_JPEG), FAKE_JPEG.length, "image/jpeg");
        UUID id = affiliateService.register(userId, "CTV " + phone, "https://fb.com/ctv", null, null, front, back, Affiliate::getId);
        affiliateAdmin.approve(id, ADMIN, a -> a);
        return affiliates.findById(id).orElseThrow();
    }

    private static ClientInfo client(int n) {
        return new ClientInfo("10.9.0." + n, "test-agent");
    }

    private static long count(ClickStats stats, ClickSource source) {
        return stats.bySource().stream().filter(s -> s.source() == source).mapToLong(SourceClicks::clicks).sum();
    }

    @Test
    void clicksAreGroupedBySourceAndDay() {
        Affiliate ctv = approvedAffiliate("0922100001");
        String code = ctv.getReferralCode();

        clicks.record(code, "/", "facebook", client(1));
        clicks.record(code, "/products/x", "FACEBOOK", client(2));
        clicks.record(code, "/", "zalo", client(3));
        clicks.record(code, "/", null, client(4));        // link không gắn src
        clicks.record(code, "/", "myspace", client(5));   // nền tảng lạ
        clicks.record(code, "/", "tiktok", client(1));    // trùng IP + mã trong 24 giờ: không đếm

        ClickStats stats = dashboards.clickStats(ctv.getUserId(), 30);

        assertThat(stats.days()).isEqualTo(30);
        assertThat(count(stats, ClickSource.FACEBOOK)).isEqualTo(2);
        assertThat(count(stats, ClickSource.ZALO)).isEqualTo(1);
        assertThat(count(stats, ClickSource.OTHER)).isEqualTo(2);
        assertThat(count(stats, ClickSource.TIKTOK)).isZero();
        assertThat(stats.bySource().get(0).clicks()).isGreaterThanOrEqualTo(stats.bySource().get(1).clicks()); // nhiều nhất trước

        assertThat(stats.daily()).hasSize(1);
        assertThat(stats.daily().get(0).date()).isEqualTo(LocalDate.now(VN));
        assertThat(stats.daily().get(0).clicks()).isEqualTo(5);
    }

    @Test
    void newAffiliateHasNoClicksAndDaysAreClamped() {
        Affiliate ctv = approvedAffiliate("0922100002");

        ClickStats empty = dashboards.clickStats(ctv.getUserId(), 30);
        assertThat(empty.daily()).isEmpty();
        assertThat(empty.bySource()).isEmpty();

        assertThat(dashboards.clickStats(ctv.getUserId(), 1000).days()).isEqualTo(90);
        assertThat(dashboards.clickStats(ctv.getUserId(), 0).days()).isEqualTo(1);
    }

    @Test
    void anotherAffiliatesClicksAreNotCounted() {
        Affiliate mine = approvedAffiliate("0922100003");
        Affiliate other = approvedAffiliate("0922100004");
        clicks.record(other.getReferralCode(), "/", "zalo", client(6));

        assertThat(dashboards.clickStats(mine.getUserId(), 30).bySource()).isEqualTo(List.of());
    }
}

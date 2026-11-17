package com.vietnl.hwin.affiliate.service;

import com.vietnl.hwin.affiliate.service.config.AffiliateProperties;
import com.vietnl.hwin.affiliate.service.model.RecordClickResult;
import java.time.Clock;
import java.util.Optional;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.ReferralClick;
import com.vietnl.hwin.affiliate.entity.ReferralCode;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.repository.ReferralClickRepository;
import com.vietnl.hwin.common.web.ClientInfo;

/**
 * Ghi nhận click link CTV (?ref=CODE).
 * - Mã sai định dạng / không tồn tại / CTV không hoạt động -> bỏ qua, không đặt cookie.
 * - Không đếm trùng cùng IP + mã trong 24 giờ (Redis SET NX EX).
 */
@Service
public class ReferralClickService {

    private final AffiliateRepository affiliates;
    private final ReferralClickRepository clicks;
    private final StringRedisTemplate redis;
    private final AffiliateProperties props;
    private final Clock clock;

    public ReferralClickService(AffiliateRepository affiliates, ReferralClickRepository clicks,
                                StringRedisTemplate redis, AffiliateProperties props, Clock clock) {
        this.affiliates = affiliates;
        this.clicks = clicks;
        this.redis = redis;
        this.props = props;
        this.clock = clock;
    }


    /** @return mã hợp lệ (để đặt cookie) nếu CTV đang hoạt động; empty nếu bỏ qua. */
    @Transactional
    public Optional<RecordClickResult> record(String rawCode, String landingPath, ClientInfo client) {
        ReferralCode code = ReferralCode.parseOrNull(rawCode);
        if (code == null) {
            return Optional.empty();
        }
        Optional<Affiliate> affiliate = affiliates.findByReferralCode(code.value()).filter(Affiliate::canEarn);
        if (affiliate.isEmpty()) {
            return Optional.empty();
        }
        String ipHash = client.ipHash();
        Boolean first = redis.opsForValue().setIfAbsent("click:" + code.value() + ":" + ipHash, "1", props.clickDedupe());
        boolean counted = Boolean.TRUE.equals(first);
        if (counted) {
            clicks.save(ReferralClick.record(affiliate.get().getId(), code.value(), ipHash, client.userAgent(),
                    landingPath, clock.instant()));
        }
        return Optional.of(new RecordClickResult(code.value(), counted));
    }
}

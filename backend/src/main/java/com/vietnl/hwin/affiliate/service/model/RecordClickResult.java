package com.vietnl.hwin.affiliate.service.model;

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

public record RecordClickResult(String referralCode, boolean counted) {
}

package com.vietnl.hwin.affiliate.service;

import java.time.Clock;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.CustomerBinding;
import com.vietnl.hwin.affiliate.entity.ReferralCode;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.repository.CustomerBindingRepository;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.service.UserQueryService;

/**
 * Xác định CTV được hưởng hoa hồng của một đơn – quy tắc GẮN KHÁCH VĨNH VIỄN (first-touch):
 * <ol>
 *   <li>Khách đã gắn với CTV -> luôn là CTV đó (bỏ qua ref mới). CTV đó không hoạt động -> không ai hưởng.</li>
 *   <li>Chưa gắn + có ref hợp lệ + CTV đang hoạt động + không tự giới thiệu -> tạo binding (đơn đầu tiên).</li>
 *   <li>Còn lại -> không có CTV.</li>
 * </ol>
 * Tự giới thiệu: khách chính là CTV (cùng tài khoản hoặc cùng SĐT) -> không binding, không hoa hồng.
 */
@Service
public class AttributionService {

    private static final Logger log = LoggerFactory.getLogger(AttributionService.class);

    private final CustomerBindingRepository bindings;
    private final AffiliateRepository affiliates;
    private final UserQueryService users;
    private final Clock clock;

    public AttributionService(CustomerBindingRepository bindings, AffiliateRepository affiliates,
                              UserQueryService users, Clock clock) {
        this.bindings = bindings;
        this.affiliates = affiliates;
        this.users = users;
        this.clock = clock;
    }

    /**
     * Chạy transaction riêng (chỉ sửa aggregate CustomerBinding) trước khi tạo Commission.
     *
     * @return CTV đang hoạt động được hưởng hoa hồng, hoặc empty
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<Affiliate> resolve(UUID customerId, String rawReferralCode, UUID orderId) {
        Optional<CustomerBinding> existing = bindings.findByCustomerId(customerId);
        if (existing.isPresent()) {
            return affiliates.findById(existing.get().getAffiliateId()).filter(Affiliate::canEarn);
        }
        ReferralCode code = ReferralCode.parseOrNull(rawReferralCode);
        if (code == null) {
            return Optional.empty();
        }
        Optional<Affiliate> affiliate = affiliates.findByReferralCode(code.value()).filter(Affiliate::canEarn);
        if (affiliate.isEmpty()) {
            return Optional.empty();
        }
        PhoneNumber customerPhone = users.findPhone(customerId).orElse(null);
        if (affiliate.get().isSelf(customerId, customerPhone)) {
            log.info("Chặn tự giới thiệu: CTV {} đặt đơn qua link của chính mình", code.value());
            return Optional.empty();
        }
        try {
            bindings.saveAndFlush(CustomerBinding.bind(customerId, affiliate.get(), orderId, clock.instant()));
        } catch (DataIntegrityViolationException e) {
            // Hai đơn đầu tiên xử lý đồng thời: binding đã được tạo bởi đơn kia -> dùng binding đó
            return bindings.findByCustomerId(customerId)
                    .flatMap(b -> affiliates.findById(b.getAffiliateId())).filter(Affiliate::canEarn);
        }
        return affiliate;
    }
}

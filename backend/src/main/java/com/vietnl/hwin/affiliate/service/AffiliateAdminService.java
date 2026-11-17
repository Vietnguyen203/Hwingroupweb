package com.vietnl.hwin.affiliate.service;

import com.vietnl.hwin.affiliate.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

import jakarta.persistence.criteria.Predicate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.AffiliateStatus;
import com.vietnl.hwin.affiliate.entity.ReferralCode;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.domain.PhoneNumber;

/** Admin duyệt / từ chối / tạm khóa / mở khóa CTV. */
@Service
public class AffiliateAdminService {

    private final AffiliateRepository affiliates;
    private final AuditLogger audit;
    private final Clock clock;

    public AffiliateAdminService(AffiliateRepository affiliates, AuditLogger audit, Clock clock) {
        this.affiliates = affiliates;
        this.audit = audit;
        this.clock = clock;
    }

    /** @param q SĐT, họ tên hoặc mã giới thiệu */
    @Transactional(readOnly = true)
    public <T> Page<T> search(AffiliateStatus status, String q, int page, int size, Function<Affiliate, T> mapper) {
        Specification<Affiliate> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null) {
                ps.add(cb.equal(root.get("status"), status));
            }
            if (q != null && !q.isBlank()) {
                String text = q.trim();
                List<Predicate> or = new ArrayList<>();
                or.add(cb.like(cb.lower(root.get("fullName")), "%" + text.toLowerCase().replace("%", "") + "%"));
                or.add(cb.equal(root.get("referralCode"), text.toUpperCase()));
                if (text.replaceAll("[\\s.+-]", "").matches("\\d{9,12}")) {
                    or.add(cb.equal(root.get("phone"), PhoneNumber.of(text)));
                }
                ps.add(cb.or(or.toArray(Predicate[]::new)));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
        return affiliates.findAll(spec, PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
                Sort.by(Sort.Order.desc("createdAt")))).map(mapper);
    }

    @Transactional(readOnly = true)
    public <T> T get(UUID id, Function<Affiliate, T> mapper) {
        return mapper.apply(load(id));
    }

    /** Duyệt: sinh mã giới thiệu duy nhất, phát AffiliateApproved (cấp vai trò AFFILIATE). */
    @Transactional
    public <T> T approve(UUID id, UUID adminId, Function<Affiliate, T> mapper) {
        Affiliate a = load(id);
        a.approve(uniqueCode(), adminId, clock.instant());
        audit.log("affiliate", "Affiliate", id, "AFFILIATE_APPROVED", adminId, null,
                "{\"referralCode\":\"" + a.getReferralCode() + "\"}");
        return mapper.apply(affiliates.save(a));
    }

    @Transactional
    public <T> T reject(UUID id, String reason, UUID adminId, Function<Affiliate, T> mapper) {
        Affiliate a = load(id);
        a.reject(reason, adminId, clock.instant());
        return mapper.apply(affiliates.save(a));
    }

    @Transactional
    public <T> T suspend(UUID id, String reason, UUID adminId, Function<Affiliate, T> mapper) {
        Affiliate a = load(id);
        a.suspend(reason, adminId, clock.instant());
        audit.log("affiliate", "Affiliate", id, "AFFILIATE_SUSPENDED", adminId, null, null);
        return mapper.apply(affiliates.save(a));
    }

    @Transactional
    public <T> T reinstate(UUID id, UUID adminId, Function<Affiliate, T> mapper) {
        Affiliate a = load(id);
        a.reinstate(adminId, clock.instant());
        audit.log("affiliate", "Affiliate", id, "AFFILIATE_REINSTATED", adminId, null, null);
        return mapper.apply(affiliates.save(a));
    }

    private ReferralCode uniqueCode() {
        for (int i = 0; i < 20; i++) {
            ReferralCode code = ReferralCode.generate();
            if (!affiliates.existsByReferralCode(code.value())) {
                return code;
            }
        }
        throw new IllegalStateException("Không sinh được mã giới thiệu duy nhất");
    }

    private Affiliate load(UUID id) {
        return affiliates.findById(id).orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.AFFILIATE_NOT_FOUND));
    }
}

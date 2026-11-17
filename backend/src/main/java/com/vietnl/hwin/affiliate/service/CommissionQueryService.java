package com.vietnl.hwin.affiliate.service;

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

import com.vietnl.hwin.affiliate.entity.CommissionStatus;
import com.vietnl.hwin.affiliate.entity.Commission;
import com.vietnl.hwin.affiliate.repository.CommissionRepository;

/** Admin tra cứu hoa hồng theo trạng thái / CTV / mã đơn. */
@Service
public class CommissionQueryService {

    private final CommissionRepository commissions;

    public CommissionQueryService(CommissionRepository commissions) {
        this.commissions = commissions;
    }

    @Transactional(readOnly = true)
    public <T> Page<T> search(CommissionStatus status, UUID affiliateId, String orderCode, int page, int size,
                              Function<Commission, T> mapper) {
        Specification<Commission> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null) {
                ps.add(cb.equal(root.get("status"), status));
            }
            if (affiliateId != null) {
                ps.add(cb.equal(root.get("affiliateId"), affiliateId));
            }
            if (orderCode != null && !orderCode.isBlank()) {
                ps.add(cb.equal(root.get("orderCode"), orderCode.trim().toUpperCase()));
            }
            return cb.and(ps.toArray(Predicate[]::new));
        };
        return commissions.findAll(spec, PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 100),
                Sort.by(Sort.Order.desc("createdAt")))).map(mapper);
    }
}

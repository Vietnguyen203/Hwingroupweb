package com.vietnl.hwin.affiliate.service.model;

import com.vietnl.hwin.affiliate.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Clock;
import java.time.Instant;
import java.util.EnumSet;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.PayoutStatus;
import com.vietnl.hwin.affiliate.entity.Payout;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.repository.CommissionRepository;
import com.vietnl.hwin.affiliate.repository.PayoutRepository;
import com.vietnl.hwin.common.audit.AuditLogger;
import com.vietnl.hwin.common.domain.Money;

public record PayoutWithBank(Payout payout, String accountNo, String accountHolder) {
}

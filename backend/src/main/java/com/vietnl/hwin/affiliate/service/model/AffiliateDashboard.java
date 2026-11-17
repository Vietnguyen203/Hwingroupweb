package com.vietnl.hwin.affiliate.service.model;

import com.vietnl.hwin.affiliate.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.entity.CommissionStatus;
import com.vietnl.hwin.affiliate.entity.Commission;
import com.vietnl.hwin.affiliate.entity.CustomerBinding;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.repository.CommissionRepository;
import com.vietnl.hwin.affiliate.repository.CustomerBindingRepository;
import com.vietnl.hwin.affiliate.repository.PayoutRepository;
import com.vietnl.hwin.affiliate.repository.ReferralClickRepository;
import com.vietnl.hwin.identity.service.model.UserContact;
import com.vietnl.hwin.identity.service.UserQueryService;

public record AffiliateDashboard(String referralCode, String shareLink, String status, long clicksTotal, long clicks30Days,
                        long boundCustomers, Map<CommissionStatus, CommissionStatusSummary> commissions,
                        long availableBalance, long paidOut, long minPayout, Instant withdrawLockedUntil,
                        boolean hasBankAccount) {
}

package com.vietnl.hwin.customer.service.model;

import com.vietnl.hwin.customer.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;
import java.time.Clock;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.customer.entity.Customer;
import com.vietnl.hwin.customer.entity.CustomerAddress;
import com.vietnl.hwin.customer.entity.CustomerStats;
import com.vietnl.hwin.customer.repository.CustomerRepository;
import com.vietnl.hwin.customer.repository.CustomerStatsRepository;
import com.vietnl.hwin.identity.service.model.UserContact;
import com.vietnl.hwin.identity.service.UserQueryService;

/** Hồ sơ + thống kê để controller map ra DTO. */
public record CustomerProfile(Customer customer, CustomerStats stats) {
}

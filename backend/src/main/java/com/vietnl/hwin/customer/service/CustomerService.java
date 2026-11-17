package com.vietnl.hwin.customer.service;

import com.vietnl.hwin.customer.service.model.CustomerProfile;
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

/**
 * Use case hồ sơ + sổ địa chỉ của khách. Mọi thao tác dùng customerId = userId lấy từ JWT.
 */
@Service
public class CustomerService {

    private static final Logger log = LoggerFactory.getLogger(CustomerService.class);

    private final CustomerRepository customers;
    private final CustomerStatsRepository stats;
    private final UserQueryService users;
    private final Clock clock;

    public CustomerService(CustomerRepository customers, CustomerStatsRepository stats, UserQueryService users,
                           Clock clock) {
        this.customers = customers;
        this.stats = stats;
        this.users = users;
        this.clock = clock;
    }

    /**
     * Đảm bảo hồ sơ khách tồn tại (thường đã tạo bởi event UserRegistered; gọi lại ở đây để phòng
     * trường hợp khách thao tác trước khi event kịp xử lý).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void ensureCustomer(UUID userId) {
        if (customers.existsById(userId)) {
            return;
        }
        UserContact contact = users.findContact(userId)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.USER_NOT_FOUND));
        Customer c = Customer.register(userId, contact.phone(),
                contact.email() == null ? null : contact.email().value()); // kiểm tra bất biến
        c.rename(contact.fullName());
        int created = customers.insertIfAbsent(c.getId(), c.getPhone() == null ? null : c.getPhone().value(),
                c.getEmail(), c.getFullName());
        customers.insertStatsIfAbsent(userId);
        if (created == 1) {
            log.info("Tạo hồ sơ khách {}", contact.masked());
        }
    }

    // Không để readOnly: load() có thể phải tạo hồ sơ khách lần đầu (INSERT)
    @Transactional
    public <T> T profile(UUID customerId, Function<CustomerProfile, T> mapper) {
        Customer c = load(customerId);
        CustomerStats s = stats.findById(customerId).orElse(CustomerStats.empty(customerId, clock.instant()));
        return mapper.apply(new CustomerProfile(c, s));
    }

    @Transactional
    public void rename(UUID customerId, String fullName) {
        load(customerId).rename(fullName);
    }

    @Transactional // không readOnly: load() có thể tạo hồ sơ khách lần đầu
    public <T> java.util.List<T> addresses(UUID customerId, Function<CustomerAddress, T> mapper) {
        return load(customerId).getAddresses().stream().map(mapper).toList();
    }

    @Transactional
    public <T> T addAddress(UUID customerId, Address address, boolean makeDefault, Function<CustomerAddress, T> mapper) {
        Customer c = load(customerId);
        CustomerAddress a = c.addAddress(address, makeDefault, clock.instant());
        // c đang được quản lý trong transaction -> flush để DB sinh id cho địa chỉ mới (không dùng save():
        // Customer có id gán sẵn nên save() sẽ merge ra bản sao, đối tượng a không nhận được id)
        customers.flush();
        return mapper.apply(a);
    }

    @Transactional
    public void updateAddress(UUID customerId, UUID addressId, Address address) {
        load(customerId).updateAddress(addressId, address);
    }

    @Transactional
    public void setDefaultAddress(UUID customerId, UUID addressId) {
        load(customerId).setDefaultAddress(addressId);
    }

    @Transactional
    public void removeAddress(UUID customerId, UUID addressId) {
        load(customerId).removeAddress(addressId);
    }

    private Customer load(UUID customerId) {
        ensureCustomer(customerId);
        return customers.findById(customerId).orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.CUSTOMER_NOT_FOUND));
    }

}

package com.vietnl.hwin.customer.service.listener;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.customer.repository.CustomerRepository;
import com.vietnl.hwin.identity.entity.event.UserPhoneAddedEvent;

/** Tài khoản thêm SĐT (identity) -> gắn SĐT vào hồ sơ khách (customer). Idempotent. */
@Component
public class UserPhoneAddedEventListener {

    private final CustomerRepository customers;

    public UserPhoneAddedEventListener(CustomerRepository customers) {
        this.customers = customers;
    }

    @ApplicationModuleListener
    void on(UserPhoneAddedEvent event) {
        customers.findById(event.userId()).ifPresent(c -> {
            c.attachPhone(new PhoneNumber(event.phone()));
            customers.save(c);
        });
    }
}

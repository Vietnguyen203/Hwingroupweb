package com.vietnl.hwin.customer.service;

import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.identity.entity.UserRegistered;

/** Tài khoản mới (identity) -> tạo hồ sơ khách (customer, id = userId). Idempotent. */
@Component
public class CustomerProvisioningListener {

    private final CustomerService customerService;

    public CustomerProvisioningListener(CustomerService customerService) {
        this.customerService = customerService;
    }

    @ApplicationModuleListener
    void on(UserRegistered event) {
        customerService.ensureCustomer(event.userId());
    }
}

package com.vietnl.hwin.customer.service.listener;

import com.vietnl.hwin.customer.service.CustomerService;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.vietnl.hwin.identity.entity.event.UserRegisteredEvent;

/** Tài khoản mới (identity) -> tạo hồ sơ khách (customer, id = userId). Idempotent. */
@Component
public class CustomerProvisioningEventListener {

    private final CustomerService customerService;

    public CustomerProvisioningEventListener(CustomerService customerService) {
        this.customerService = customerService;
    }

    @ApplicationModuleListener
    void on(UserRegisteredEvent event) {
        customerService.ensureCustomer(event.userId());
    }
}

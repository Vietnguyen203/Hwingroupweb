package com.vietnl.hwin.customer.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vietnl.hwin.customer.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}

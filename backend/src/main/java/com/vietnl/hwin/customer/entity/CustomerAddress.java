package com.vietnl.hwin.customer.entity;

import java.util.UUID;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import com.vietnl.hwin.common.domain.Address;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Một địa chỉ trong sổ địa chỉ – thuộc aggregate Customer, chỉ sửa qua Customer. */
@Entity
@Table(name = "customer_address", schema = "customer")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CustomerAddress {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Embedded
    private Address address;

    @Column(name = "is_default")
    private boolean defaultAddress;

    @Column(nullable = false)
    private Instant createdAt;

    CustomerAddress(Address address, boolean defaultAddress, Instant createdAt) {
        this.address = address;
        this.defaultAddress = defaultAddress;
        this.createdAt = createdAt;
    }

    void change(Address address) {
        this.address = address;
    }

    void markDefault(boolean value) {
        this.defaultAddress = value;
    }
}

package com.vietnl.hwin.common.domain;

import jakarta.persistence.Embeddable;

import com.vietnl.hwin.common.exception.DomainException;

/**
 * Value object địa chỉ nhận hàng (bất biến, tự validate).
 * Dùng chung cho sổ địa chỉ của khách (customer) và địa chỉ giao trong đơn (ordering – bản chụp).
 */
@Embeddable
public record Address(
        String recipientName,
        PhoneNumber recipientPhone,
        String province,
        String district,
        String ward,
        String street) {

    public Address {
        recipientName = require(recipientName, "Tên người nhận", 100);
        if (recipientPhone == null) {
            throw new DomainException("ADDRESS_INVALID", "Thiếu số điện thoại người nhận");
        }
        province = require(province, "Tỉnh/Thành phố", 100);
        district = require(district, "Quận/Huyện", 100);
        ward = require(ward, "Phường/Xã", 100);
        street = require(street, "Số nhà, tên đường", 255);
    }

    public String fullText() {
        return String.join(", ", street, ward, district, province);
    }

    private static String require(String value, String label, int max) {
        if (value == null || value.isBlank()) {
            throw new DomainException("ADDRESS_INVALID", label + " không được trống");
        }
        String v = value.trim();
        if (v.length() > max) {
            throw new DomainException("ADDRESS_INVALID", label + " quá dài");
        }
        return v;
    }
}

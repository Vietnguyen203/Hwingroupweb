package com.vietnl.hwin.common.domain;

import java.util.Map;
import com.vietnl.hwin.common.exception.CommonErrorMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import jakarta.persistence.Embeddable;


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
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.RECIPIENT_PHONE_REQUIRED);
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
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.FIELD_REQUIRED, Map.of("label", String.valueOf(label)));
        }
        String v = value.trim();
        if (v.length() > max) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.FIELD_TOO_LONG, Map.of("label", String.valueOf(label)));
        }
        return v;
    }
}

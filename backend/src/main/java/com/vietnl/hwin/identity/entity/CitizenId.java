package com.vietnl.hwin.identity.entity;

import org.springframework.http.HttpStatus;

import com.vietnl.hwin.common.exception.ResponseException;

/** Số căn cước công dân (CCCD): đúng 12 chữ số. Chỉ tồn tại trong bộ nhớ – DB lưu bản mã hóa + hash + 4 số cuối. */
public record CitizenId(String value) {

    public CitizenId {
        if (value == null || !value.matches("\\d{12}")) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CITIZEN_ID_INVALID);
        }
    }

    public static CitizenId of(String raw) {
        return new CitizenId(raw == null ? null : raw.replaceAll("\\s", ""));
    }

    public String last4() {
        return value.substring(8);
    }

    @Override
    public String toString() {
        return "********" + last4();
    }
}

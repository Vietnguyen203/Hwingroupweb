package com.vietnl.hwin.identity.api.dto;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Thông tin người dùng hiện tại. SĐT và CCCD luôn được che. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeResponse {

    private UUID id;
    private String phoneMasked;
    private String email;
    private String fullName;
    private LocalDate dateOfBirth;
    private String address;
    private String citizenIdMasked;
    private boolean hasPassword;
    private Set<String> roles;
}

package com.vietnl.hwin.identity.api.responses;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Thông tin người dùng hiện tại. SĐT luôn được che. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeResponse {

    private UUID id;
    private String phoneMasked;
    private String email;
    private String fullName;
    private Set<String> roles;
}

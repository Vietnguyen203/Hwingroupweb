package com.vietnl.hwin.customer.api.responses;

import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private UUID id;
    private String phone;
    private String email;
    private String fullName;
    private int totalOrders;
    private long totalSpent;
    private Instant firstOrderAt;
    private Instant lastOrderAt;
}

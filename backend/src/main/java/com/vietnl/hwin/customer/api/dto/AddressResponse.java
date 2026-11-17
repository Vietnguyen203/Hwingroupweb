package com.vietnl.hwin.customer.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class AddressResponse {

    private UUID id;
    private String recipientName;
    private String recipientPhone;
    private String province;
    private String district;
    private String ward;
    private String street;
    private String fullText;
    @JsonProperty("isDefault")
    private boolean isDefault;
}

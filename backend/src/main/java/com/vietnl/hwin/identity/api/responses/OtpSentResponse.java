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

/** @param channel SMS | EMAIL; @param sentTo nơi nhận đã che */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpSentResponse {

    private String channel;
    private String sentTo;
    private long expiresInSeconds;
}

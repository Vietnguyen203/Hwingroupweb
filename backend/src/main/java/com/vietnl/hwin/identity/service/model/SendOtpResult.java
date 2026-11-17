package com.vietnl.hwin.identity.service.model;

import com.vietnl.hwin.identity.entity.ExceptionMessage;
import com.vietnl.hwin.common.exception.CommonErrorMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.time.Duration;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.vietnl.hwin.common.ratelimit.RateLimiter;
import com.vietnl.hwin.common.util.Hashing;
import com.vietnl.hwin.common.web.ClientInfo;
import com.vietnl.hwin.identity.entity.OtpChannel;
import com.vietnl.hwin.identity.entity.OtpPurpose;
import com.vietnl.hwin.identity.entity.OtpTarget;
import com.vietnl.hwin.identity.entity.UserAccount;
import com.vietnl.hwin.identity.repository.UserAccountRepository;

/** OTP đã gửi: kênh, nơi nhận (đã che), thời gian hiệu lực (giây). */
public record SendOtpResult(OtpChannel channel, String sentTo, long expiresInSeconds) {
}

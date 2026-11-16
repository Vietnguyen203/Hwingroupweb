package com.vietnl.hwin.common.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Component;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

/**
 * Ký và kiểm tra access token (JWT HS256). Token chỉ chứa userId (sub) và roles.
 */
@Component
public class JwtService {

    private static final String ISSUER = "hwin";

    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final SecurityProperties props;

    public JwtService(SecurityProperties props) {
        this.props = props;
        SecretKey key = new SecretKeySpec(props.jwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        this.decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    public String issueAccessToken(Long userId, Collection<String> roles, Instant now) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .subject(String.valueOf(userId))
                .issuedAt(now)
                .expiresAt(now.plus(props.accessTokenTtl()))
                .claim("roles", List.copyOf(roles))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    /** @return principal nếu token hợp lệ và chưa hết hạn. */
    public Optional<AuthPrincipal> verify(String token) {
        try {
            Jwt jwt = decoder.decode(token);
            List<String> roles = jwt.getClaimAsStringList("roles");
            Set<String> roleSet = roles == null ? Set.of() : new HashSet<>(roles);
            return Optional.of(new AuthPrincipal(Long.valueOf(jwt.getSubject()), roleSet));
        } catch (JwtException | NumberFormatException e) {
            return Optional.empty();
        }
    }
}

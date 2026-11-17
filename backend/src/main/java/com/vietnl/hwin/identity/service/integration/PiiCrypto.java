package com.vietnl.hwin.identity.service.integration;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.common.security.AesGcmCipher;
import com.vietnl.hwin.common.util.Hashing;
import com.vietnl.hwin.identity.entity.CitizenId;
import com.vietnl.hwin.identity.service.config.IdentityProperties;

/**
 * Mã hóa / băm dữ liệu cá nhân nhạy cảm của tài khoản (CCCD).
 * - encrypt: AES-GCM, chỉ giải mã khi thật cần (admin xem hồ sơ CTV).
 * - hash: HMAC-SHA256 để kiểm tra trùng CCCD mà không phải giải mã.
 */
@Component
public class PiiCrypto {

    private final AesGcmCipher cipher;
    private final String hmacKey;

    public PiiCrypto(IdentityProperties props) {
        this.cipher = new AesGcmCipher(props.piiEncryptionKey(), "IDENTITY_PII_KEY");
        this.hmacKey = "cccd:" + props.piiEncryptionKey();
    }

    public String encrypt(CitizenId id) {
        return cipher.encrypt(id.value());
    }

    public String decrypt(String encrypted) {
        return cipher.decrypt(encrypted);
    }

    public String hash(CitizenId id) {
        return Hashing.hmacSha256Hex(hmacKey, id.value());
    }
}

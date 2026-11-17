package com.vietnl.hwin.affiliate.service;

import com.vietnl.hwin.affiliate.service.config.AffiliateProperties;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

import com.vietnl.hwin.affiliate.entity.BankAccount;

/**
 * Mã hóa thông tin ngân hàng CTV bằng AES-256-GCM (có xác thực toàn vẹn).
 * Dữ liệu lưu: base64( IV 12 byte || ciphertext+tag ). Khóa lấy từ biến môi trường AFFILIATE_BANK_KEY.
 */
@Component
public class BankAccountCrypto {

    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;

    private final SecretKey key;
    private final SecureRandom random = new SecureRandom();

    public BankAccountCrypto(AffiliateProperties props) {
        byte[] raw = Base64.getDecoder().decode(props.bankEncryptionKey());
        if (raw.length != 32) {
            throw new IllegalStateException("AFFILIATE_BANK_KEY phải là 32 byte (base64)");
        }
        this.key = new SecretKeySpec(raw, "AES");
    }

    public BankAccount encrypt(String bankName, String accountNo, String holder) {
        String digits = accountNo.replaceAll("\\s", "");
        return new BankAccount(bankName.trim(), encrypt(digits), encrypt(holder.trim().toUpperCase()),
                digits.substring(Math.max(0, digits.length() - 4)));
    }

    public String encrypt(String plain) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            byte[] ct = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + ct.length).put(iv).put(ct).array());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Không mã hóa được dữ liệu", e);
        }
    }

    public String decrypt(String encoded) {
        if (encoded == null) {
            return null;
        }
        try {
            byte[] all = Base64.getDecoder().decode(encoded);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, all, 0, IV_LENGTH));
            return new String(cipher.doFinal(all, IV_LENGTH, all.length - IV_LENGTH), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            throw new IllegalStateException("Không giải mã được dữ liệu (sai khóa?)", e);
        }
    }
}

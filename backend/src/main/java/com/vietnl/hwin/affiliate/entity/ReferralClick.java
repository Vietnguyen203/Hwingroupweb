package com.vietnl.hwin.affiliate.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Aggregate root (chỉ ghi thêm): một lượt click link CTV đã được tính. */
@Entity
@Table(name = "referral_click", schema = "affiliate")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReferralClick {

    @Id
    @GeneratedValue
    @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
    private UUID id;

    @Column(nullable = false)
    private UUID affiliateId;

    @Column(nullable = false)
    private String referralCode;

    @Column(nullable = false)
    private String ipHash;

    private String userAgent;

    private String landingPath;

    @Column(nullable = false)
    private Instant clickedAt;

    public static ReferralClick record(UUID affiliateId, String referralCode, String ipHash, String userAgent,
                                       String landingPath, Instant now) {
        ReferralClick c = new ReferralClick();
        c.affiliateId = affiliateId;
        c.referralCode = referralCode;
        c.ipHash = ipHash;
        c.userAgent = userAgent;
        c.landingPath = landingPath == null || landingPath.length() <= 500 ? landingPath : landingPath.substring(0, 500);
        c.clickedAt = now;
        return c;
    }
}

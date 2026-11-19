package com.vietnl.hwin.affiliate.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.UuidGenerator;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Aggregate root (chỉ ghi thêm): một lượt click link CTV đã được tính. */
@Entity
@Table(name = "referral_clicks", schema = "affiliate")
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ClickSource source;

    @Column(nullable = false)
    private Instant clickedAt;

    public static ReferralClick record(UUID affiliateId, String referralCode, String ipHash, String userAgent,
                                       String landingPath, ClickSource source, Instant now) {
        ReferralClick c = new ReferralClick();
        c.affiliateId = affiliateId;
        c.referralCode = referralCode;
        c.ipHash = ipHash;
        c.userAgent = userAgent;
        c.landingPath = landingPath == null || landingPath.length() <= 500 ? landingPath : landingPath.substring(0, 500);
        c.source = source == null ? ClickSource.OTHER : source;
        c.clickedAt = now;
        return c;
    }
}

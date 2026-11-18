package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.repository.AffiliateRepository;
import com.vietnl.hwin.affiliate.service.AffiliateAdminService;
import com.vietnl.hwin.affiliate.service.AffiliateService;
import com.vietnl.hwin.affiliate.service.job.IdCardCleanupJob;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.common.storage.PrivateFileStore;
import com.vietnl.hwin.identity.service.UserAccountService;
import java.io.ByteArrayInputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Ảnh CCCD: giới hạn số lần tải, dọn tệp mồ côi (có thời gian chờ) và xóa ảnh của hồ sơ bị từ chối quá hạn lưu giữ. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class AffiliateIdCardCleanupTests {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46, 0};

    @Autowired AffiliateService affiliates;
    @Autowired AffiliateAdminService admin;
    @Autowired AffiliateRepository repo;
    @Autowired IdCardCleanupJob job;
    @Autowired PrivateFileStore files;
    @Autowired UserAccountService users;

    private UUID newUser(String phone) {
        return users.loginByPhone(PhoneNumber.of(phone)).getId();
    }

    private String upload(UUID userId) {
        return affiliates.uploadIdCard(userId, new ByteArrayInputStream(JPEG), JPEG.length, "image/jpeg");
    }

    @Test
    void uploadsAreLimitedPerUserPerHour() {
        UUID userId = newUser("0966200001");
        for (int i = 0; i < 10; i++) {
            upload(userId);
        }
        assertThatThrownBy(() -> upload(userId)).hasFieldOrPropertyWithValue("code", "ID_CARD_UPLOAD_LIMIT");
        // người khác không bị ảnh hưởng
        upload(newUser("0966200011"));
    }

    @Test
    void orphanFilesAreDeletedOnlyAfterGracePeriodAndReferencedOnesAreKept() {
        UUID userId = newUser("0966200002");
        String orphan = upload(userId);
        String front = upload(userId);
        String back = upload(userId);
        Affiliate a = affiliates.register(userId, "CTV Dọn", null, null, null, front, back, x -> x);
        assertThat(a.hasIdCard()).isTrue();

        // vừa tải: chưa bị coi là mồ côi
        job.deleteOrphans(Instant.now());
        assertThat(files.exists(orphan)).isTrue();

        // quá thời gian chờ: tệp mồ côi bị xóa, ảnh của hồ sơ vẫn còn
        job.deleteOrphans(Instant.now().plus(Duration.ofHours(25)));
        assertThat(files.exists(orphan)).isFalse();
        assertThat(files.exists(front)).isTrue();
        assertThat(files.exists(back)).isTrue();
    }

    @Test
    void rejectedApplicationLosesItsPhotosAfterRetention() {
        UUID userId = newUser("0966200003");
        String front = upload(userId);
        String back = upload(userId);
        Affiliate a = affiliates.register(userId, "CTV Bị Từ Chối", null, null, null, front, back, x -> x);
        admin.reject(a.getId(), "Ảnh mờ", UUID.randomUUID(), x -> x);

        // trong thời hạn lưu giữ: giữ nguyên
        assertThat(job.purgeRejected(Instant.now())).isZero();
        assertThat(repo.findById(a.getId()).orElseThrow().hasIdCard()).isTrue();

        // quá 30 ngày: bỏ tham chiếu, rồi tệp bị dọn
        assertThat(job.purgeRejected(Instant.now().plus(Duration.ofDays(31)))).isEqualTo(1);
        assertThat(repo.findById(a.getId()).orElseThrow().hasIdCard()).isFalse();
        job.deleteOrphans(Instant.now().plus(Duration.ofDays(31)));
        assertThat(files.exists(front)).isFalse();
        assertThat(files.exists(back)).isFalse();
    }

    @Test
    void approvedApplicationKeepsItsPhotos() {
        UUID userId = newUser("0966200004");
        String front = upload(userId);
        String back = upload(userId);
        Affiliate a = affiliates.register(userId, "CTV Đã Duyệt", null, null, null, front, back, x -> x);
        admin.approve(a.getId(), UUID.randomUUID(), x -> x);

        assertThat(job.purgeRejected(Instant.now().plus(Duration.ofDays(400)))).isZero();
        job.deleteOrphans(Instant.now().plus(Duration.ofDays(400)));
        assertThat(files.exists(front)).isTrue();
        assertThat(repo.findById(a.getId()).orElseThrow().hasIdCard()).isTrue();
    }
}

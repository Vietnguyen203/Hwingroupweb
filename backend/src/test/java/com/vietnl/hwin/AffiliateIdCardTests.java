package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vietnl.hwin.affiliate.entity.Affiliate;
import com.vietnl.hwin.affiliate.service.AffiliateAdminService;
import com.vietnl.hwin.affiliate.service.AffiliateService;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.service.UserAccountService;
import java.io.ByteArrayInputStream;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Ảnh CCCD khi đăng ký CTV: bắt buộc, lưu riêng tư, chỉ dùng được ảnh do chính mình tải lên. */
@org.springframework.context.annotation.Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class AffiliateIdCardTests {

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46, 0};

    @Autowired AffiliateService affiliates;
    @Autowired AffiliateAdminService admin;
    @Autowired UserAccountService users;

    private UUID newUser(String phone) {
        return users.loginByPhone(PhoneNumber.of(phone)).getId();
    }

    private String upload(UUID userId) {
        return affiliates.uploadIdCard(userId, new ByteArrayInputStream(JPEG), JPEG.length, "image/jpeg");
    }

    @Test
    void registerRequiresBothIdCardPhotos() {
        UUID userId = newUser("0966000001");
        assertThatThrownBy(() -> affiliates.register(userId, "CTV", null, null, null, null, null, a -> a))
                .hasFieldOrPropertyWithValue("code", "ID_CARD_REQUIRED");
    }

    @Test
    void cannotUseAnotherUsersPhotoOrRandomPath() {
        UUID owner = newUser("0966000002");
        UUID other = newUser("0966000003");
        String foreign = upload(owner);
        String mine = upload(other);
        assertThatThrownBy(() -> affiliates.register(other, "CTV", null, null, null, foreign, mine, a -> a))
                .hasFieldOrPropertyWithValue("code", "ID_CARD_INVALID");
        assertThatThrownBy(() -> affiliates.register(other, "CTV", null, null, null, "../../etc/passwd", mine, a -> a))
                .hasFieldOrPropertyWithValue("code", "ID_CARD_INVALID");
    }

    @Test
    void rejectsNonImageContent() {
        UUID userId = newUser("0966000004");
        byte[] text = "not an image".getBytes();
        assertThatThrownBy(() -> affiliates.uploadIdCard(userId, new ByteArrayInputStream(text), text.length, "image/jpeg"))
                .hasFieldOrPropertyWithValue("code", "FILE_TYPE_INVALID");
        assertThatThrownBy(() -> affiliates.uploadIdCard(userId, new ByteArrayInputStream(JPEG), JPEG.length, "application/pdf"))
                .hasFieldOrPropertyWithValue("code", "FILE_TYPE_INVALID");
    }

    @Test
    void adminCanViewPhotosAfterRegistering() {
        UUID userId = newUser("0966000005");
        Affiliate a = affiliates.register(userId, "CTV Ảnh", null, null, null, upload(userId), upload(userId), x -> x);
        assertThat(a.hasIdCard()).isTrue();
        assertThat(admin.idCardImage(a.getId(), true, UUID.randomUUID()).contentType()).isEqualTo("image/jpeg");
        assertThat(admin.idCardImage(a.getId(), false, UUID.randomUUID()).content()).isEqualTo(JPEG);
    }
}

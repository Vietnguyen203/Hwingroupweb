package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;

import jakarta.validation.Validator;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.vietnl.hwin.catalog.api.dto.CertificateResponse;
import com.vietnl.hwin.catalog.api.dto.CreateCertificateRequest;
import com.vietnl.hwin.catalog.service.CertificateService;
import com.vietnl.hwin.common.exception.ResponseException;

/** Giấy chứng nhận chỉ cần ảnh: tiêu đề / cơ quan cấp không bắt buộc, ảnh thì luôn bắt buộc. */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@ActiveProfiles("test")
class CertificateImageOnlyTests {

    @Autowired CertificateService certificates;
    @Autowired Validator validator;

    private static String newImage() {
        return "/uploads/" + UUID.randomUUID() + ".jpg";
    }

    private static CreateCertificateRequest imageOnly(String imageUrl) {
        return new CreateCertificateRequest(null, null, null, null, null, imageUrl, null, null, null, 0);
    }

    @Test
    void imageOnlyCertificateIsAcceptedAndShownPublicly() {
        CreateCertificateRequest req = imageOnly(newImage());
        assertThat(validator.validate(req)).isEmpty();

        CertificateResponse created = certificates.create(req);

        assertThat(created.title()).isNull();
        assertThat(created.issuer()).isNull();
        assertThat(created.imageUrl()).isEqualTo(req.imageUrl());
        assertThat(created.active()).isTrue();
        assertThat(certificates.listPublic()).extracting(CertificateResponse::id).contains(created.id());
    }

    @Test
    void blankTextFieldsAreStoredAsNull() {
        var req = new CreateCertificateRequest("   ", " ", "", null, null, newImage(), null, "  ", null, 0);

        CertificateResponse created = certificates.create(req);

        assertThat(created.title()).isNull();
        assertThat(created.certNumber()).isNull();
        assertThat(created.issuer()).isNull();
        assertThat(created.description()).isNull();
    }

    @Test
    void imageIsStillRequired() {
        assertThat(validator.validate(imageOnly(" "))).extracting(v -> v.getPropertyPath().toString()).contains("imageUrl");
        assertThat(validator.validate(imageOnly(null))).extracting(v -> v.getPropertyPath().toString()).contains("imageUrl");
    }

    @Test
    void hiddenCertificateDisappearsFromPublicListAndDeleteRemovesIt() {
        UUID id = certificates.create(imageOnly(newImage())).id();

        certificates.toggleActive(id);
        assertThat(certificates.listPublic()).extracting(CertificateResponse::id).doesNotContain(id);
        assertThat(certificates.listAll()).extracting(CertificateResponse::id).contains(id);

        certificates.delete(id);
        assertThat(certificates.listAll()).extracting(CertificateResponse::id).doesNotContain(id);
        assertThatThrownBy(() -> certificates.delete(id)).isInstanceOf(ResponseException.class);
    }

    @Test
    void legacyCertificatesWithFullInfoStillWork() {
        // dữ liệu mẫu cũ (có đủ tiêu đề, cơ quan cấp) vẫn được trả về nguyên vẹn
        assertThat(certificates.listAll()).anySatisfy(c -> {
            assertThat(c.title()).isNotBlank();
            assertThat(c.issuer()).isNotBlank();
        });
    }
}

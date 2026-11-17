package com.vietnl.hwin.affiliate.api;

import com.vietnl.hwin.affiliate.api.dto.IdCardUploadResponse;
import com.vietnl.hwin.affiliate.service.AffiliateService;
import com.vietnl.hwin.common.security.AuthPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Tải ảnh CCCD lên kho riêng tư trước khi gửi phiếu đăng ký CTV. Chỉ trả về khóa file (không có URL công khai);
 * khóa được đính kèm trong POST /api/affiliates/me.
 */
@Tag(name = "affiliate-ctv")
@RestController
@RequestMapping("/api/affiliates/id-card-uploads")
public class AffiliateIdCardController {

    private final AffiliateService affiliates;

    public AffiliateIdCardController(AffiliateService affiliates) {
        this.affiliates = affiliates;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IdCardUploadResponse> upload(@AuthenticationPrincipal AuthPrincipal me,
                                                       @RequestPart("file") MultipartFile file) throws IOException {
        String key = affiliates.uploadIdCard(me.userId(), file.getInputStream(), file.getSize(), file.getContentType());
        return ResponseEntity.status(HttpStatus.CREATED).body(new IdCardUploadResponse(key));
    }
}

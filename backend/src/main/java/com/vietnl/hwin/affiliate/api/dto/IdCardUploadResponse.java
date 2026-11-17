package com.vietnl.hwin.affiliate.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IdCardUploadResponse {

    /** Khóa file trong kho riêng tư, gửi kèm khi đăng ký CTV. */
    private String key;
}

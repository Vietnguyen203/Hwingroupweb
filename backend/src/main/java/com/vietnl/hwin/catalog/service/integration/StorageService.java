package com.vietnl.hwin.catalog.service.integration;

import java.io.InputStream;

/**
 * Port lưu file ảnh. Demo: {@link LocalStorageService} lưu thư mục local.
 * Sau này đổi sang S3 / Cloudflare R2 mà không sửa service gọi.
 */
public interface StorageService {

    /** @return URL công khai của file vừa lưu */
    String store(InputStream content, long size, String contentType);
}

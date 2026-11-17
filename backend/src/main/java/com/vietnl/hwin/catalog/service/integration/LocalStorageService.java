package com.vietnl.hwin.catalog.service.integration;

import com.vietnl.hwin.catalog.service.config.StorageProperties;
import com.vietnl.hwin.catalog.entity.ExceptionMessage;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;


/**
 * Lưu ảnh vào thư mục local (hwin.storage.local-dir) và phục vụ qua /uploads/**.
 * Chỉ nhận jpg/png/webp, tên file sinh ngẫu nhiên (không dùng tên client gửi).
 */
@Configuration
public class LocalStorageService implements StorageService, WebMvcConfigurer {

    private static final long MAX_SIZE = 5L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp");

    private final Path root;
    private final String publicPath;

    public LocalStorageService(StorageProperties props) throws IOException {
        this.root = Path.of(props.localDir()).toAbsolutePath().normalize();
        this.publicPath = props.publicPath();
        Files.createDirectories(root);
    }

    @Override
    public String store(InputStream content, long size, String contentType) {
        String ext = EXTENSIONS.get(contentType);
        if (ext == null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.FILE_TYPE_INVALID);
        }
        if (size <= 0 || size > MAX_SIZE) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.FILE_TOO_LARGE);
        }
        String filename = UUID.randomUUID() + ext;
        try {
            Files.copy(content, root.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new IllegalStateException("Không lưu được file", e);
        }
        return publicPath + filename;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(publicPath + "**")
                .addResourceLocations(root.toUri().toString());
    }

}

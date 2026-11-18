package com.vietnl.hwin.common.storage;

import com.vietnl.hwin.common.exception.CommonErrorMessage;
import com.vietnl.hwin.common.exception.ResponseException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Kho file riêng tư cho dữ liệu nhạy cảm (ảnh CCCD): lưu ngoài thư mục /uploads nên KHÔNG có URL công khai,
 * chỉ đọc được qua API có phân quyền. Tên file sinh ngẫu nhiên, kiểm tra định dạng bằng cả Content-Type lẫn chữ ký file.
 */
@Component
public class PrivateFileStore {

    private static final long MAX_SIZE = 5L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of("image/jpeg", ".jpg", "image/png", ".png", "image/webp", ".webp");

    private final Path root;

    public PrivateFileStore(@Value("${hwin.storage.private-dir:./private-uploads}") String dir) throws IOException {
        this.root = Path.of(dir).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    /** Lưu ảnh vào thư mục con {@code folder}; trả về khóa tương đối (VD id-cards/{userId}/{uuid}.jpg). */
    public String store(String folder, InputStream content, long size, String contentType) {
        String ext = contentType == null ? null : EXTENSIONS.get(contentType);
        if (ext == null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.FILE_TYPE_INVALID);
        }
        if (size <= 0 || size > MAX_SIZE) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.FILE_TOO_LARGE);
        }
        try {
            byte[] bytes = content.readNBytes((int) MAX_SIZE + 1);
            if (bytes.length > MAX_SIZE) {
                throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.FILE_TOO_LARGE);
            }
            if (!matchesSignature(bytes, ext)) {
                throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, CommonErrorMessage.FILE_TYPE_INVALID);
            }
            String key = folder + "/" + UUID.randomUUID() + ext;
            Path target = resolve(key);
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
            return key;
        } catch (IOException e) {
            throw new IllegalStateException("Không lưu được file", e);
        }
    }

    /** Liệt kê mọi tệp trong thư mục con {@code folder} (đệ quy) kèm thời điểm sửa cuối. */
    public List<StoredEntry> list(String folder) {
        Path dir = resolve(folder);
        if (!Files.isDirectory(dir)) {
            return List.of();
        }
        List<StoredEntry> result = new ArrayList<>();
        try (Stream<Path> walk = Files.walk(dir)) {
            for (Path p : (Iterable<Path>) walk.filter(Files::isRegularFile)::iterator) {
                result.add(new StoredEntry(root.relativize(p).toString().replace('\\', '/'), Files.getLastModifiedTime(p).toInstant()));
            }
        } catch (IOException e) {
            throw new IllegalStateException("Không liệt kê được thư mục " + folder, e);
        }
        return result;
    }

    /** Xóa một tệp theo khóa; @return true nếu đã xóa. */
    public boolean delete(String key) {
        try {
            return Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            return false;
        }
    }

    public boolean exists(String key) {
        try {
            return Files.isRegularFile(resolve(key));
        } catch (ResponseException e) {
            return false;
        }
    }

    /** Đọc file theo khóa. */
    public StoredFile load(String key) {
        Path p = resolve(key);
        try {
            if (!Files.isRegularFile(p)) {
                throw new ResponseException(HttpStatus.NOT_FOUND, CommonErrorMessage.NOT_FOUND);
            }
            String name = p.getFileName().toString();
            String type = name.endsWith(".png") ? "image/png" : name.endsWith(".webp") ? "image/webp" : "image/jpeg";
            return new StoredFile(Files.readAllBytes(p), type);
        } catch (IOException e) {
            throw new IllegalStateException("Không đọc được file", e);
        }
    }

    /** Chặn path traversal: khóa phải nằm trong thư mục gốc. */
    private Path resolve(String key) {
        Path p = root.resolve(key).normalize();
        if (!p.startsWith(root)) {
            throw new ResponseException(HttpStatus.BAD_REQUEST, CommonErrorMessage.BAD_REQUEST);
        }
        return p;
    }

    private static boolean matchesSignature(byte[] b, String ext) {
        return switch (ext) {
            case ".jpg" -> b.length > 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
            case ".png" -> b.length > 8 && Arrays.equals(Arrays.copyOf(b, 4), new byte[]{(byte) 0x89, 'P', 'N', 'G'});
            case ".webp" -> b.length > 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E';
            default -> false;
        };
    }

    public record StoredFile(byte[] content, String contentType) {
    }

    public record StoredEntry(String key, Instant lastModified) {
    }
}

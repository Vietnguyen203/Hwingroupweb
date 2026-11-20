package com.vietnl.hwin.content.repository;

import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

import com.vietnl.hwin.common.util.TextNormalizer;
import com.vietnl.hwin.content.entity.Video;
import com.vietnl.hwin.content.entity.VideoPlatform;
import com.vietnl.hwin.content.entity.VideoStatus;

/** Điều kiện lọc danh sách video (mỗi hàm trả null-safe: tham số trống thì không lọc). */
public final class VideoSpecifications {

    private VideoSpecifications() {
    }

    /** Ghép các điều kiện bằng AND, bỏ qua điều kiện null (Spring Data không nhận null trong Specification.allOf). */
    @SafeVarargs
    public static Specification<Video> allOf(Specification<Video>... specs) {
        Specification<Video> result = (root, query, cb) -> cb.conjunction();
        for (Specification<Video> s : specs) {
            if (s != null) {
                result = result.and(s);
            }
        }
        return result;
    }

    public static Specification<Video> status(VideoStatus status) {
        return status == null ? null : (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Video> platform(VideoPlatform platform) {
        return platform == null ? null : (root, query, cb) -> cb.equal(root.get("platform"), platform);
    }

    public static Specification<Video> category(UUID categoryId) {
        return categoryId == null ? null : (root, query, cb) -> cb.equal(root.get("categoryId"), categoryId);
    }

    /** Tìm theo tiêu đề (không phân biệt hoa thường). */
    public static Specification<Video> titleContains(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String pattern = "%" + TextNormalizer.escapeLike(q.trim().toLowerCase()) + "%";
        return (root, query, cb) -> cb.like(cb.lower(root.get("title")), pattern, '\\');
    }
}

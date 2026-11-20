package com.vietnl.hwin.content.service;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;

import com.vietnl.hwin.common.exception.BaseErrorMessage;
import com.vietnl.hwin.common.exception.ResponseException;
import com.vietnl.hwin.content.entity.ExceptionMessage;
import com.vietnl.hwin.content.entity.VideoPlatform;
import com.vietnl.hwin.content.service.model.VideoLink;

/**
 * Phân tích và chuẩn hóa link video của Facebook, TikTok, YouTube.
 * <ul>
 *   <li>Chỉ xử lý chuỗi, KHÔNG gọi mạng (không SSRF, không cào dữ liệu).</li>
 *   <li>Chỉ nhận https, host phải khớp chính xác danh sách cho phép (chặn kiểu {@code youtube.com.evil.com}),
 *       không có tài khoản/mật khẩu trong URL, không cổng lạ.</li>
 *   <li>Link rút gọn / chia sẻ (cần theo chuyển hướng mới biết video nào) bị từ chối: admin dán link đầy đủ.</li>
 *   <li>Mã video phải đúng định dạng của nền tảng; địa chỉ nhúng dựng từ mã đó, không bao giờ lấy nguyên từ đầu vào.</li>
 * </ul>
 */
public final class VideoLinkParser {

    private static final int MAX_LENGTH = 1000;

    private static final Set<String> YOUTUBE_HOSTS = Set.of("youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be");
    private static final Set<String> TIKTOK_HOSTS = Set.of("tiktok.com", "www.tiktok.com", "m.tiktok.com");
    private static final Set<String> FACEBOOK_HOSTS = Set.of("facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com");
    /** Link rút gọn: muốn biết video nào phải gọi mạng theo chuyển hướng, nên không hỗ trợ. */
    private static final Set<String> SHORT_LINK_HOSTS = Set.of("vm.tiktok.com", "vt.tiktok.com", "fb.watch", "fb.me");

    private static final Pattern YOUTUBE_ID = Pattern.compile("[A-Za-z0-9_-]{11}");
    private static final Pattern NUMERIC_ID = Pattern.compile("[0-9]{5,25}");
    private static final Pattern TIKTOK_USER = Pattern.compile("@[A-Za-z0-9._-]{1,64}");
    private static final Pattern FACEBOOK_PAGE = Pattern.compile("[A-Za-z0-9.\\-]{1,80}");

    private VideoLinkParser() {
    }

    /** @throws ResponseException (422) khi link không hợp lệ / không được hỗ trợ. */
    public static VideoLink parse(String raw) {
        if (raw == null || raw.isBlank() || raw.trim().length() > MAX_LENGTH) {
            throw invalid(ExceptionMessage.VIDEO_URL_INVALID);
        }
        URI uri = toUri(raw.trim());
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw invalid(ExceptionMessage.VIDEO_URL_HTTPS_REQUIRED);
        }
        if (uri.getRawUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443)) {
            throw invalid(ExceptionMessage.VIDEO_URL_INVALID);
        }
        String host = uri.getHost() == null ? null : uri.getHost().toLowerCase(Locale.ROOT);
        if (host == null) {
            throw invalid(ExceptionMessage.VIDEO_URL_INVALID);
        }
        if (SHORT_LINK_HOSTS.contains(host)) {
            throw invalid(ExceptionMessage.VIDEO_URL_SHORT_LINK);
        }
        if (YOUTUBE_HOSTS.contains(host)) {
            return youtube(uri, host);
        }
        if (TIKTOK_HOSTS.contains(host)) {
            return tiktok(uri);
        }
        if (FACEBOOK_HOSTS.contains(host)) {
            return facebook(uri);
        }
        throw invalid(ExceptionMessage.VIDEO_URL_UNSUPPORTED_PLATFORM);
    }

    /**
     * Ảnh bìa tùy chọn của admin: ảnh đã tải lên máy chủ ({@code /uploads/...}) hoặc URL https hợp lệ.
     * Ảnh chỉ dùng cho thẻ img, máy chủ không tải ảnh này về (không SSRF).
     * @return null nếu bỏ trống
     */
    public static String normalizeThumbnail(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String s = raw.trim();
        if (s.length() > MAX_LENGTH) {
            throw invalid(ExceptionMessage.VIDEO_THUMBNAIL_INVALID);
        }
        if (s.startsWith("/uploads/") && !s.contains("..") && !s.contains("//") && !s.contains("\\")) {
            return s;
        }
        URI uri;
        try {
            uri = toUri(s);
        } catch (ResponseException e) {
            throw invalid(ExceptionMessage.VIDEO_THUMBNAIL_INVALID);
        }
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getRawUserInfo() != null
                || (uri.getPort() != -1 && uri.getPort() != 443)) {
            throw invalid(ExceptionMessage.VIDEO_THUMBNAIL_INVALID);
        }
        return s;
    }

    // ------------------------------------------------------------------ từng nền tảng

    private static VideoLink youtube(URI uri, String host) {
        List<String> seg = segments(uri);
        String id = null;
        if (host.equals("youtu.be")) {
            id = seg.isEmpty() ? null : seg.get(0);
        } else if (seg.size() == 1 && seg.get(0).equals("watch")) {
            id = query(uri).get("v");
        } else if (seg.size() == 2 && Set.of("shorts", "embed", "live").contains(seg.get(0))) {
            id = seg.get(1);
        }
        if (id == null || !YOUTUBE_ID.matcher(id).matches()) {
            throw invalid(ExceptionMessage.VIDEO_URL_INVALID);
        }
        return new VideoLink(VideoPlatform.YOUTUBE, id, "https://www.youtube.com/watch?v=" + id,
                "https://www.youtube-nocookie.com/embed/" + id, "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg");
    }

    private static VideoLink tiktok(URI uri) {
        List<String> seg = segments(uri);
        if (seg.size() == 3 && TIKTOK_USER.matcher(seg.get(0)).matches() && seg.get(1).equals("video")
                && NUMERIC_ID.matcher(seg.get(2)).matches()) {
            String id = seg.get(2);
            return new VideoLink(VideoPlatform.TIKTOK, id, "https://www.tiktok.com/" + seg.get(0) + "/video/" + id,
                    "https://www.tiktok.com/embed/v2/" + id, null);
        }
        throw invalid(ExceptionMessage.VIDEO_URL_INVALID);
    }

    private static VideoLink facebook(URI uri) {
        List<String> seg = segments(uri);
        if (!seg.isEmpty() && seg.get(0).equals("share")) {
            throw invalid(ExceptionMessage.VIDEO_URL_SHORT_LINK);
        }
        String id = null;
        String canonical = null;
        if (seg.size() == 1 && seg.get(0).equals("watch")) {
            id = query(uri).get("v");
            canonical = "https://www.facebook.com/watch/?v=" + id;
        } else if (seg.size() == 1 && seg.get(0).equals("video.php")) {
            id = query(uri).get("v");
            canonical = "https://www.facebook.com/video.php?v=" + id;
        } else if (seg.size() == 2 && seg.get(0).equals("reel")) {
            id = seg.get(1);
            canonical = "https://www.facebook.com/reel/" + id;
        } else if (seg.size() >= 3 && seg.get(1).equals("videos") && FACEBOOK_PAGE.matcher(seg.get(0)).matches()) {
            id = seg.get(seg.size() - 1);
            canonical = "https://www.facebook.com/" + seg.get(0) + "/videos/" + id;
        }
        if (id == null || !NUMERIC_ID.matcher(id).matches()) {
            throw invalid(ExceptionMessage.VIDEO_URL_INVALID);
        }
        String embed = "https://www.facebook.com/plugins/video.php?href=" + URLEncoder.encode(canonical, StandardCharsets.UTF_8)
                + "&show_text=false";
        return new VideoLink(VideoPlatform.FACEBOOK, id, canonical, embed, null);
    }

    // ------------------------------------------------------------------ tiện ích

    private static URI toUri(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c <= 0x20 || c >= 0x7f) {
                throw invalid(ExceptionMessage.VIDEO_URL_INVALID); // khoảng trắng, ký tự điều khiển, ký tự ngoài ASCII
            }
        }
        try {
            return new URI(s);
        } catch (URISyntaxException e) {
            throw invalid(ExceptionMessage.VIDEO_URL_INVALID);
        }
    }

    private static List<String> segments(URI uri) {
        String path = uri.getRawPath();
        if (path == null || path.isEmpty()) {
            return List.of();
        }
        return java.util.Arrays.stream(path.split("/")).filter(p -> !p.isEmpty()).toList();
    }

    /** Tham số query, lấy giá trị đầu tiên của mỗi khóa; giá trị không giải mã (sẽ bị regex mã video loại nếu có ký tự lạ). */
    private static Map<String, String> query(URI uri) {
        Map<String, String> out = new HashMap<>();
        String q = uri.getRawQuery();
        if (q == null) {
            return out;
        }
        for (String pair : q.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0) {
                out.putIfAbsent(pair.substring(0, eq), pair.substring(eq + 1));
            }
        }
        return out;
    }

    private static ResponseException invalid(BaseErrorMessage message) {
        return new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, message);
    }
}

package com.vietnl.hwin.content.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import com.vietnl.hwin.content.entity.VideoPlatform;
import com.vietnl.hwin.content.service.model.VideoLink;

/** Unit test bộ phân tích link video: nhận diện nền tảng, dựng địa chỉ nhúng an toàn, từ chối link nguy hiểm. */
class VideoLinkParserTest {

    private static void assertRejected(String url, String code) {
        assertThatThrownBy(() -> VideoLinkParser.parse(url)).hasFieldOrPropertyWithValue("code", code);
    }

    // ------------------------------------------------------------------ YouTube

    @ParameterizedTest
    @ValueSource(strings = {
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
            "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ?si=abc",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ",
    })
    void youtubeLinksAreNormalized(String url) {
        VideoLink link = VideoLinkParser.parse(url);
        assertThat(link.platform()).isEqualTo(VideoPlatform.YOUTUBE);
        assertThat(link.externalId()).isEqualTo("dQw4w9WgXcQ");
        assertThat(link.canonicalUrl()).isEqualTo("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        assertThat(link.embedUrl()).isEqualTo("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
        assertThat(link.thumbnailUrl()).isEqualTo("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://www.youtube.com/watch",
            "https://www.youtube.com/watch?v=short",
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ%22onload%3Dalert(1)",
            "https://www.youtube.com/watch?v=dQw4w9WgXc!",
            "https://www.youtube.com/playlist?list=PL1234567890A",
            "https://www.youtube.com/",
            "https://youtu.be/",
    })
    void invalidYoutubeVideoIdsAreRejected(String url) {
        assertRejected(url, "VIDEO_URL_INVALID");
    }

    // ------------------------------------------------------------------ TikTok

    @Test
    void tiktokVideoLinkIsNormalized() {
        VideoLink link = VideoLinkParser.parse("https://www.tiktok.com/@hwin.food/video/7301234567890123456?is_from_webapp=1");
        assertThat(link.platform()).isEqualTo(VideoPlatform.TIKTOK);
        assertThat(link.externalId()).isEqualTo("7301234567890123456");
        assertThat(link.canonicalUrl()).isEqualTo("https://www.tiktok.com/@hwin.food/video/7301234567890123456");
        assertThat(link.embedUrl()).isEqualTo("https://www.tiktok.com/embed/v2/7301234567890123456");
        assertThat(link.thumbnailUrl()).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://www.tiktok.com/@hwin.food",
            "https://www.tiktok.com/@hwin.food/video/abc",
            "https://www.tiktok.com/video/7301234567890123456",
            "https://www.tiktok.com/@a b/video/7301234567890123456",
            "https://www.tiktok.com/tag/food",
    })
    void invalidTiktokLinksAreRejected(String url) {
        assertRejected(url, "VIDEO_URL_INVALID");
    }

    // ------------------------------------------------------------------ Facebook

    @Test
    void facebookPageVideoLinkIsNormalized() {
        VideoLink link = VideoLinkParser.parse("https://www.facebook.com/hwinfood/videos/123456789012345/?ref=share");
        assertThat(link.platform()).isEqualTo(VideoPlatform.FACEBOOK);
        assertThat(link.externalId()).isEqualTo("123456789012345");
        assertThat(link.canonicalUrl()).isEqualTo("https://www.facebook.com/hwinfood/videos/123456789012345");
        assertThat(link.embedUrl()).startsWith("https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fhwinfood%2Fvideos%2F123456789012345");
    }

    @Test
    void facebookWatchReelAndLegacyVideoLinksAreRecognized() {
        assertThat(VideoLinkParser.parse("https://www.facebook.com/watch/?v=123456789012345").canonicalUrl())
                .isEqualTo("https://www.facebook.com/watch/?v=123456789012345");
        assertThat(VideoLinkParser.parse("https://m.facebook.com/reel/987654321098765").canonicalUrl())
                .isEqualTo("https://www.facebook.com/reel/987654321098765");
        assertThat(VideoLinkParser.parse("https://web.facebook.com/video.php?v=555555555555").externalId()).isEqualTo("555555555555");
        assertThat(VideoLinkParser.parse("https://www.facebook.com/hwinfood/videos/ten-video/123456789012345").externalId())
                .isEqualTo("123456789012345");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://www.facebook.com/hwinfood/posts/123456789012345",
            "https://www.facebook.com/watch/?v=abc",
            "https://www.facebook.com/watch",
            "https://www.facebook.com/hwinfood",
            "https://www.facebook.com/",
    })
    void facebookNonVideoLinksAreRejected(String url) {
        assertRejected(url, "VIDEO_URL_INVALID");
    }

    // ------------------------------------------------------------------ link nguy hiểm / không hỗ trợ

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "not a url", "https://", "//youtube.com/watch?v=dQw4w9WgXcQ"})
    void blankOrMalformedInputIsRejected(String url) {
        assertThatThrownBy(() -> VideoLinkParser.parse(url)).hasFieldOrProperty("code");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "javascript:alert(1)",
            "data:text/html,<iframe src=//evil>",
            "ftp://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "file:///etc/passwd",
    })
    void onlyHttpsIsAccepted(String url) {
        assertThatThrownBy(() -> VideoLinkParser.parse(url)).hasFieldOrProperty("code");
        assertThatThrownBy(() -> VideoLinkParser.parse("http://www.youtube.com/watch?v=dQw4w9WgXcQ"))
                .hasFieldOrPropertyWithValue("code", "VIDEO_URL_HTTPS_REQUIRED");
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
            "https://evilyoutube.com/watch?v=dQw4w9WgXcQ",
            "https://www.youtube.com@evil.com/watch?v=dQw4w9WgXcQ",
            "https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ",
            "https://vimeo.com/123456789",
            "https://127.0.0.1/watch?v=dQw4w9WgXcQ",
            "https://localhost/watch?v=dQw4w9WgXcQ",
            "https://169.254.169.254/latest/meta-data/",
    })
    void lookAlikeAndInternalHostsAreRejected(String url) {
        assertThatThrownBy(() -> VideoLinkParser.parse(url)).hasFieldOrProperty("code");
    }

    @Test
    void userInfoAndOddPortsAreRejected() {
        assertRejected("https://user:pass@www.youtube.com/watch?v=dQw4w9WgXcQ", "VIDEO_URL_INVALID");
        assertRejected("https://www.youtube.com:8443/watch?v=dQw4w9WgXcQ", "VIDEO_URL_INVALID");
        assertThat(VideoLinkParser.parse("https://www.youtube.com:443/watch?v=dQw4w9WgXcQ").externalId()).isEqualTo("dQw4w9WgXcQ");
    }

    @Test
    void whitespaceAndNonAsciiAreRejected() {
        assertRejected("https://www.youtube.com/watch?v=dQw4w9WgXcQ extra", "VIDEO_URL_INVALID");
        assertRejected("https://www.youtube.com/wátch?v=dQw4w9WgXcQ", "VIDEO_URL_INVALID");
        assertRejected("https://www.youtube.com/watch?v=dQw4w9\nWgXcQ", "VIDEO_URL_INVALID");
    }

    @Test
    void shortAndShareLinksAreRejectedWithAClearCode() {
        assertRejected("https://vm.tiktok.com/ZMabc123/", "VIDEO_URL_SHORT_LINK");
        assertRejected("https://vt.tiktok.com/ZSabc123/", "VIDEO_URL_SHORT_LINK");
        assertRejected("https://fb.watch/abcDEF123/", "VIDEO_URL_SHORT_LINK");
        assertRejected("https://www.facebook.com/share/v/1AbCdEfGh/", "VIDEO_URL_SHORT_LINK");
    }

    @Test
    void unsupportedPlatformsAreRejectedWithAClearCode() {
        assertRejected("https://vimeo.com/123456789", "VIDEO_URL_UNSUPPORTED_PLATFORM");
        assertRejected("https://www.instagram.com/reel/abc123/", "VIDEO_URL_UNSUPPORTED_PLATFORM");
    }

    @Test
    void tooLongInputIsRejected() {
        assertRejected("https://www.youtube.com/watch?v=dQw4w9WgXcQ&x=" + "a".repeat(1000), "VIDEO_URL_INVALID");
    }

    // ------------------------------------------------------------------ ảnh bìa

    @Test
    void thumbnailAcceptsUploadedImageOrHttpsUrlOnly() {
        assertThat(VideoLinkParser.normalizeThumbnail(null)).isNull();
        assertThat(VideoLinkParser.normalizeThumbnail("  ")).isNull();
        assertThat(VideoLinkParser.normalizeThumbnail("/uploads/abc.jpg")).isEqualTo("/uploads/abc.jpg");
        assertThat(VideoLinkParser.normalizeThumbnail(" https://cdn.example.com/a.jpg ")).isEqualTo("https://cdn.example.com/a.jpg");

        for (String bad : new String[]{"http://cdn.example.com/a.jpg", "javascript:alert(1)", "data:image/png;base64,AAAA",
                "/uploads/../etc/passwd", "/other/a.jpg", "https://user:pw@cdn.example.com/a.jpg", "https://cdn.example.com:8443/a.jpg",
                "//cdn.example.com/a.jpg", "https://cdn.example.com/a b.jpg"}) {
            assertThatThrownBy(() -> VideoLinkParser.normalizeThumbnail(bad))
                    .as(bad).hasFieldOrPropertyWithValue("code", "VIDEO_THUMBNAIL_INVALID");
        }
    }
}

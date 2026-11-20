package com.vietnl.hwin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;
import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.CategoryService;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.catalog.service.model.ProductSearchCriteria;
import com.vietnl.hwin.common.security.JwtService;

/**
 * Module video (content) qua HTTP đầy đủ (bộ lọc bảo mật + controller + service + Postgres thật):
 * phân quyền, kiểm tra link, tạo / sửa / xóa, gắn sản phẩm, và API khách chỉ thấy video đã đăng.
 */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VideoApiTests {

    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired ProductSearchService search;
    @Autowired CategoryService categories;

    // ------------------------------------------------------------------ tiện ích

    private Cookie cookieFor(String role) {
        return new Cookie("hwin_at", jwt.issueAccessToken(UUID.randomUUID(), List.of(role), Instant.now()));
    }

    private Cookie admin() {
        return cookieFor("ADMIN");
    }

    /** Mã video YouTube hợp lệ (11 ký tự) và duy nhất cho từng lần gọi. */
    private static String ytId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 11);
    }

    private static String ytUrl(String id) {
        return "https://www.youtube.com/watch?v=" + id;
    }

    private static String body(String title, String url, String extra) {
        return "{\"title\":\"" + title + "\",\"sourceUrl\":\"" + url + "\"" + (extra == null || extra.isEmpty() ? "" : "," + extra) + "}";
    }

    private static String text(ResultActions r) throws Exception {
        return r.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
    }

    private ResultActions createVideo(String json) throws Exception {
        return mvc.perform(post("/api/admin/videos").cookie(admin()).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    /** Tạo video hợp lệ và trả về JSON phản hồi. */
    private String create(String title, String extra) throws Exception {
        return text(createVideo(body(title, ytUrl(ytId()), extra)).andExpect(status().isCreated()));
    }

    private static UUID idOf(String json) {
        return UUID.fromString(JsonPath.read(json, "$.id"));
    }

    private List<UUID> productIds(int count) {
        List<UUID> ids = search.search(new ProductSearchCriteria(null, null, ProductSort.NEWEST, 0, 30, false), p -> p)
                .getContent().stream().map(p -> p.getId()).limit(count).toList();
        assertThat(ids).hasSize(count);
        return ids;
    }

    // ------------------------------------------------------------------ phân quyền

    @Test
    void adminEndpointsRequireLogin() throws Exception {
        mvc.perform(get("/api/admin/videos")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/videos").contentType(MediaType.APPLICATION_JSON).content(body("x", ytUrl(ytId()), "")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/videos/preview").contentType(MediaType.APPLICATION_JSON).content("{\"sourceUrl\":\"" + ytUrl(ytId()) + "\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/admin/videos/" + UUID.randomUUID())).andExpect(status().isUnauthorized());
    }

    @Test
    void nonAdminRolesAreForbidden() throws Exception {
        for (String role : List.of("CUSTOMER", "AFFILIATE")) {
            Cookie c = cookieFor(role);
            mvc.perform(get("/api/admin/videos").cookie(c)).andExpect(status().isForbidden());
            mvc.perform(post("/api/admin/videos").cookie(c).contentType(MediaType.APPLICATION_JSON).content(body("x", ytUrl(ytId()), "")))
                    .andExpect(status().isForbidden());
            mvc.perform(patch("/api/admin/videos/" + UUID.randomUUID() + "/status").cookie(c).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"PUBLISHED\"}")).andExpect(status().isForbidden());
        }
    }

    // ------------------------------------------------------------------ tạo, kiểm tra link, nhận diện nền tảng

    @Test
    void adminCreatesVideoAndPlatformIsDetectedByBackend() throws Exception {
        String id = ytId();
        // Client không gửi platform / embedUrl: backend tự nhận ra và dựng địa chỉ nhúng
        mvc.perform(post("/api/admin/videos").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(body("Chả lụa ngon", "https://youtu.be/" + id + "?si=abc", "\"description\":\"Cách thưởng thức\"")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.platform").value("YOUTUBE"))
                .andExpect(jsonPath("$.sourceUrl").value("https://www.youtube.com/watch?v=" + id))
                .andExpect(jsonPath("$.embedUrl").value("https://www.youtube-nocookie.com/embed/" + id))
                .andExpect(jsonPath("$.thumbnailUrl").value("https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"))
                .andExpect(jsonPath("$.slug").value("cha-lua-ngon"))
                .andExpect(jsonPath("$.status").value("HIDDEN")) // mặc định ẩn cho tới khi admin đăng
                .andExpect(jsonPath("$.displayOrder").value(0));

        // TikTok, Facebook cũng được nhận ra từ link
        mvc.perform(post("/api/admin/videos").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(body("Clip TikTok", "https://www.tiktok.com/@hwin/video/7" + System.nanoTime(), "")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.platform").value("TIKTOK"))
                .andExpect(jsonPath("$.embedUrl").value(org.hamcrest.Matchers.startsWith("https://www.tiktok.com/embed/v2/")));
        mvc.perform(post("/api/admin/videos").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(body("Video Facebook", "https://www.facebook.com/hwinfood/videos/9" + System.nanoTime(), "")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.platform").value("FACEBOOK"))
                .andExpect(jsonPath("$.embedUrl").value(org.hamcrest.Matchers.startsWith("https://www.facebook.com/plugins/video.php?href=")));
    }

    @Test
    void invalidUrlsAndInjectionAttemptsAreRejected() throws Exception {
        record Bad(String url, String code) {}
        for (Bad b : List.of(
                new Bad("https://evil.example.com/watch?v=dQw4w9WgXcQ", "VIDEO_URL_UNSUPPORTED_PLATFORM"),
                new Bad("http://www.youtube.com/watch?v=dQw4w9WgXcQ", "VIDEO_URL_HTTPS_REQUIRED"),
                new Bad("javascript:alert(1)", "VIDEO_URL_HTTPS_REQUIRED"),
                new Bad("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ", "VIDEO_URL_UNSUPPORTED_PLATFORM"),
                new Bad("https://vm.tiktok.com/ZMabc123/", "VIDEO_URL_SHORT_LINK"),
                new Bad("<iframe src=\\\"https://evil.example.com\\\"></iframe>", "VIDEO_URL_INVALID"),
                new Bad("https://www.youtube.com/watch?v=nope", "VIDEO_URL_INVALID"))) {
            createVideo(body("Thử", b.url(), "")).andExpect(status().isUnprocessableContent()).andExpect(jsonPath("$.messageCode").value(b.code()));
        }
        // Chọn nền tảng khác với nền tảng nhận ra từ link: bị từ chối (không tin giá trị từ client)
        createVideo(body("Thử", ytUrl(ytId()), "\"platform\":\"TIKTOK\"")).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.messageCode").value("VIDEO_PLATFORM_MISMATCH"));
        // Chọn đúng nền tảng thì được
        createVideo(body("Thử", ytUrl(ytId()), "\"platform\":\"YOUTUBE\"")).andExpect(status().isCreated());
        // Thiếu tiêu đề: lỗi kiểm tra dữ liệu
        createVideo("{\"title\":\"  \",\"sourceUrl\":\"" + ytUrl(ytId()) + "\"}").andExpect(status().isBadRequest());
        // Ảnh bìa không hợp lệ
        createVideo(body("Thử", ytUrl(ytId()), "\"thumbnailUrl\":\"javascript:alert(1)\"")).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.messageCode").value("VIDEO_THUMBNAIL_INVALID"));
        // Danh mục / sản phẩm không tồn tại
        createVideo(body("Thử", ytUrl(ytId()), "\"categoryId\":\"" + UUID.randomUUID() + "\"")).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.messageCode").value("VIDEO_CATEGORY_NOT_FOUND"));
        createVideo(body("Thử", ytUrl(ytId()), "\"productIds\":[\"" + UUID.randomUUID() + "\"]")).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.messageCode").value("VIDEO_PRODUCT_NOT_FOUND"));
    }

    @Test
    void sameVideoCannotBeAddedTwiceEvenWithDifferentLinkForms() throws Exception {
        String id = ytId();
        createVideo(body("Lần một", ytUrl(id), "")).andExpect(status().isCreated());
        createVideo(body("Lần hai", "https://youtu.be/" + id, "")).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.messageCode").value("VIDEO_ALREADY_EXISTS"));
    }

    @Test
    void slugsStayUniqueForSameTitle() throws Exception {
        String a = create("Tiêu đề trùng lặp", "");
        String b = create("Tiêu đề trùng lặp", "");
        assertThat((String) JsonPath.read(a, "$.slug")).isEqualTo("tieu-de-trung-lap");
        assertThat((String) JsonPath.read(b, "$.slug")).isEqualTo("tieu-de-trung-lap-2");
    }

    @Test
    void previewBuildsEmbedConfigWithoutSaving() throws Exception {
        String id = ytId();
        mvc.perform(post("/api/admin/videos/preview").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sourceUrl\":\"" + ytUrl(id) + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.platform").value("YOUTUBE"))
                .andExpect(jsonPath("$.externalId").value(id))
                .andExpect(jsonPath("$.embedUrl").value("https://www.youtube-nocookie.com/embed/" + id));
        mvc.perform(post("/api/admin/videos/preview").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sourceUrl\":\"https://evil.example.com/x\"}"))
                .andExpect(status().isUnprocessableContent());
        // preview không lưu: link đó vẫn thêm mới được
        createVideo(body("Sau preview", ytUrl(id), "")).andExpect(status().isCreated());
    }

    // ------------------------------------------------------------------ sửa, trạng thái, xóa

    @Test
    void adminUpdatesVideoAndStatusAndSlugStaysStable() throws Exception {
        String created = create("Tên ban đầu", "");
        UUID id = idOf(created);
        String slug = JsonPath.read(created, "$.slug");
        String newId = ytId();

        mvc.perform(put("/api/admin/videos/" + id).cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(body("Tên mới", ytUrl(newId), "\"description\":\"Mô tả mới\",\"displayOrder\":7,\"status\":\"PUBLISHED\"")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Tên mới"))
                .andExpect(jsonPath("$.description").value("Mô tả mới"))
                .andExpect(jsonPath("$.displayOrder").value(7))
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.slug").value(slug)) // đường dẫn đã chia sẻ không đổi
                .andExpect(jsonPath("$.embedUrl").value("https://www.youtube-nocookie.com/embed/" + newId));

        mvc.perform(patch("/api/admin/videos/" + id + "/status").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"HIDDEN\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("HIDDEN"));
        mvc.perform(patch("/api/admin/videos/" + id + "/status").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELETED\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(put("/api/admin/videos/" + UUID.randomUUID()).cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(body("x", ytUrl(ytId()), "")))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminDeletesVideo() throws Exception {
        String created = create("Sắp xóa", "\"status\":\"PUBLISHED\"");
        UUID id = idOf(created);
        String slug = JsonPath.read(created, "$.slug");

        mvc.perform(get("/api/videos/" + slug)).andExpect(status().isOk());
        mvc.perform(delete("/api/admin/videos/" + id).cookie(admin())).andExpect(status().isNoContent());
        mvc.perform(get("/api/admin/videos/" + id).cookie(admin())).andExpect(status().isNotFound());
        mvc.perform(get("/api/videos/" + slug)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/admin/videos/" + id).cookie(admin())).andExpect(status().isNotFound());
    }

    // ------------------------------------------------------------------ gắn sản phẩm

    @Test
    void adminAssociatesAndRemovesProducts() throws Exception {
        List<UUID> p = productIds(4);
        String created = create("Có sản phẩm", "\"productIds\":[\"" + p.get(0) + "\",\"" + p.get(1) + "\",\"" + p.get(0) + "\"]");
        UUID id = idOf(created);
        // trùng được loại, thứ tự giữ nguyên
        assertThat((List<?>) JsonPath.read(created, "$.products")).hasSize(2);
        assertThat((String) JsonPath.read(created, "$.products[0].id")).isEqualTo(p.get(0).toString());
        assertThat((String) JsonPath.read(created, "$.products[1].id")).isEqualTo(p.get(1).toString());

        // thêm sản phẩm: cuối danh sách; thêm lại không nhân đôi
        mvc.perform(post("/api/admin/videos/" + id + "/products").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + p.get(2) + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.products.length()").value(3))
                .andExpect(jsonPath("$.products[2].id").value(p.get(2).toString()));
        mvc.perform(post("/api/admin/videos/" + id + "/products").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + p.get(2) + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.products.length()").value(3));

        // sản phẩm không tồn tại
        mvc.perform(post("/api/admin/videos/" + id + "/products").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isUnprocessableContent()).andExpect(jsonPath("$.messageCode").value("VIDEO_PRODUCT_NOT_FOUND"));

        // gỡ sản phẩm
        mvc.perform(delete("/api/admin/videos/" + id + "/products/" + p.get(0)).cookie(admin()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.products.length()").value(2))
                .andExpect(jsonPath("$.products[0].id").value(p.get(1).toString()));
        mvc.perform(delete("/api/admin/videos/" + id + "/products/" + p.get(0)).cookie(admin())).andExpect(status().isNotFound());

        // sửa video với productIds mới: thay toàn bộ và đổi thứ tự
        mvc.perform(put("/api/admin/videos/" + id).cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(body("Có sản phẩm", ytUrl(ytId()), "\"productIds\":[\"" + p.get(3) + "\",\"" + p.get(2) + "\"]")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.products.length()").value(2))
                .andExpect(jsonPath("$.products[0].id").value(p.get(3).toString()))
                .andExpect(jsonPath("$.products[1].id").value(p.get(2).toString()));
        // productIds bỏ trống khi sửa: giữ nguyên
        mvc.perform(put("/api/admin/videos/" + id).cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(body("Có sản phẩm", ytUrl(ytId()), "")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.products.length()").value(2));
    }

    // ------------------------------------------------------------------ API khách

    @Test
    void publicApiOnlyReturnsPublishedVideos() throws Exception {
        String published = create("Công khai thử nghiệm", "\"status\":\"PUBLISHED\"");
        String hidden = create("Ẩn thử nghiệm", "");
        String pubSlug = JsonPath.read(published, "$.slug");
        String hidSlug = JsonPath.read(hidden, "$.slug");

        // không cần đăng nhập
        String list = text(mvc.perform(get("/api/videos").param("page_size", "50")).andExpect(status().isOk()));
        List<String> slugs = JsonPath.read(list, "$.content[*].slug");
        assertThat(slugs).contains(pubSlug).doesNotContain(hidSlug);
        List<String> statuses = JsonPath.read(list, "$.content[*].status");
        assertThat(statuses).containsOnly("PUBLISHED");

        mvc.perform(get("/api/videos/" + pubSlug)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Công khai thử nghiệm"));
        mvc.perform(get("/api/videos/" + hidSlug)).andExpect(status().isNotFound());
        mvc.perform(get("/api/videos/khong-ton-tai-" + ytId())).andExpect(status().isNotFound());

        // admin thấy cả hai; ẩn video đã đăng thì khách không thấy nữa, đăng lại thì thấy
        UUID pubId = idOf(published);
        mvc.perform(patch("/api/admin/videos/" + pubId + "/status").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"HIDDEN\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/videos/" + pubSlug)).andExpect(status().isNotFound());
        mvc.perform(patch("/api/admin/videos/" + pubId + "/status").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"PUBLISHED\"}")).andExpect(status().isOk());
        mvc.perform(get("/api/videos/" + pubSlug)).andExpect(status().isOk());

        // quản trị lọc được theo trạng thái
        String adminHidden = text(mvc.perform(get("/api/admin/videos").cookie(admin()).param("status", "HIDDEN").param("page_size", "100"))
                .andExpect(status().isOk()));
        assertThat((List<String>) JsonPath.read(adminHidden, "$.content[*].slug")).contains(hidSlug).doesNotContain(pubSlug);
    }

    @Test
    void publicApiSupportsFilteringAndPagination() throws Exception {
        String tag = "Loc" + ytId().substring(0, 6); // chỉ ASCII: lower() của Postgres phụ thuộc collation với chữ có dấu
        create(tag + " một", "\"status\":\"PUBLISHED\",\"displayOrder\":1");
        create(tag + " hai", "\"status\":\"PUBLISHED\",\"displayOrder\":2");
        mvc.perform(post("/api/admin/videos").cookie(admin()).contentType(MediaType.APPLICATION_JSON)
                .content(body(tag + " ba", "https://www.tiktok.com/@hwin/video/8" + System.nanoTime(), "\"status\":\"PUBLISHED\",\"displayOrder\":3")))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/videos").param("q", tag)).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3)).andExpect(jsonPath("$.page").value(1));
        mvc.perform(get("/api/videos").param("q", tag).param("platform", "TIKTOK")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].platform").value("TIKTOK"));
        // phân trang (trang bắt đầu từ 1) + thứ tự hiển thị tăng dần
        mvc.perform(get("/api/videos").param("q", tag).param("page_size", "2").param("page", "1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2)).andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.content[0].displayOrder").value(1));
        mvc.perform(get("/api/videos").param("q", tag).param("page_size", "2").param("page", "2")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1)).andExpect(jsonPath("$.content[0].displayOrder").value(3));
        // danh mục không tồn tại: rỗng, không lỗi
        mvc.perform(get("/api/videos").param("category", "khong-co-danh-muc")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void videoCanBeLinkedToACategoryAndFilteredByItsSlug() throws Exception {
        var cat = categories.listAll(c -> c).get(0);
        String created = create("Có danh mục", "\"status\":\"PUBLISHED\",\"categoryId\":\"" + cat.getId() + "\"");
        assertThat((String) JsonPath.read(created, "$.category.slug")).isEqualTo(cat.getSlug());

        String list = text(mvc.perform(get("/api/videos").param("category", cat.getSlug()).param("page_size", "50")).andExpect(status().isOk()));
        assertThat((List<String>) JsonPath.read(list, "$.content[*].slug")).contains((String) JsonPath.read(created, "$.slug"));
    }
}

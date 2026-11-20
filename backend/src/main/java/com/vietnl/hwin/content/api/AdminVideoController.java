package com.vietnl.hwin.content.api;

import java.util.UUID;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.web.PageResponse;
import com.vietnl.hwin.content.api.dto.AddVideoProductRequest;
import com.vietnl.hwin.content.api.dto.PreviewVideoRequest;
import com.vietnl.hwin.content.api.dto.SaveVideoRequest;
import com.vietnl.hwin.content.api.dto.UpdateVideoStatusRequest;
import com.vietnl.hwin.content.api.dto.VideoPreviewResponse;
import com.vietnl.hwin.content.api.dto.VideoResponse;
import com.vietnl.hwin.content.api.mapper.VideoMapper;
import com.vietnl.hwin.content.entity.VideoPlatform;
import com.vietnl.hwin.content.entity.VideoSort;
import com.vietnl.hwin.content.entity.VideoStatus;
import com.vietnl.hwin.content.service.VideoAdminService;
import com.vietnl.hwin.content.service.model.SaveVideoCommand;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Quản trị video mạng xã hội. Chỉ ADMIN (lớp bảo vệ: SecurityConfig /api/admin/** và @PreAuthorize). */
@Tag(name = "content-admin")
@RestController
@RequestMapping("/api/admin/videos")
@PreAuthorize("hasRole('ADMIN')")
public class AdminVideoController {

    private final VideoAdminService service;
    private final VideoMapper mapper;

    public AdminVideoController(VideoAdminService service, VideoMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<PageResponse<VideoResponse>> list(@RequestParam(required = false) String q,
                                                            @RequestParam(required = false) VideoPlatform platform,
                                                            @RequestParam(required = false) UUID categoryId,
                                                            @RequestParam(required = false) VideoStatus status,
                                                            @RequestParam(defaultValue = "ORDER") VideoSort sort,
                                                            @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                            @RequestParam(name = "page_size", defaultValue = "20") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(service.list(q, platform, categoryId, status, sort, page, size), mapper::toResponse));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(mapper.toResponse(service.get(id)));
    }

    /** Xem trước link (chưa lưu): backend nhận nền tảng và dựng địa chỉ nhúng. */
    @PostMapping("/preview")
    public ResponseEntity<VideoPreviewResponse> preview(@Valid @RequestBody PreviewVideoRequest req) {
        return ResponseEntity.ok(mapper.toPreview(service.preview(req.sourceUrl())));
    }

    @PostMapping
    public ResponseEntity<VideoResponse> create(@Valid @RequestBody SaveVideoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(service.create(toCommand(req))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VideoResponse> update(@PathVariable UUID id, @Valid @RequestBody SaveVideoRequest req) {
        return ResponseEntity.ok(mapper.toResponse(service.update(id, toCommand(req))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<VideoResponse> setStatus(@PathVariable UUID id, @Valid @RequestBody UpdateVideoStatusRequest req) {
        return ResponseEntity.ok(mapper.toResponse(service.setStatus(id, req.status())));
    }

    @PostMapping("/{id}/products")
    public ResponseEntity<VideoResponse> addProduct(@PathVariable UUID id, @Valid @RequestBody AddVideoProductRequest req) {
        return ResponseEntity.ok(mapper.toResponse(service.addProduct(id, req.productId())));
    }

    @DeleteMapping("/{id}/products/{productId}")
    public ResponseEntity<VideoResponse> removeProduct(@PathVariable UUID id, @PathVariable UUID productId) {
        return ResponseEntity.ok(mapper.toResponse(service.removeProduct(id, productId)));
    }

    private static SaveVideoCommand toCommand(SaveVideoRequest r) {
        return new SaveVideoCommand(r.title(), r.description(), r.sourceUrl(), r.platform(), r.thumbnailUrl(), r.categoryId(),
                r.displayOrder(), r.status(), r.productIds());
    }
}

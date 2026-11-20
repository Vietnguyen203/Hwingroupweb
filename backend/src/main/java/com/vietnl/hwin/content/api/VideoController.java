package com.vietnl.hwin.content.api;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.web.PageResponse;
import com.vietnl.hwin.content.api.dto.VideoResponse;
import com.vietnl.hwin.content.api.mapper.VideoMapper;
import com.vietnl.hwin.content.entity.VideoPlatform;
import com.vietnl.hwin.content.service.VideoQueryService;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Thư viện video công khai (GET, không cần đăng nhập): chỉ trả video đã đăng. */
@Tag(name = "content")
@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoQueryService service;
    private final VideoMapper mapper;

    public VideoController(VideoQueryService service, VideoMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @GetMapping
    public ResponseEntity<PageResponse<VideoResponse>> list(@RequestParam(required = false) String q,
                                                            @RequestParam(required = false) VideoPlatform platform,
                                                            @RequestParam(required = false) String category,
                                                            @RequestParam(name = "page", defaultValue = "1") int pageNo,
                                                            @RequestParam(name = "page_size", defaultValue = "12") int size) {
        int page = Math.max(pageNo, 1) - 1; // API: trang bắt đầu từ 1
        return ResponseEntity.ok(PageResponse.of(service.listPublished(q, platform, category, page, size), mapper::toResponse));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<VideoResponse> get(@PathVariable String slug) {
        return ResponseEntity.ok(mapper.toResponse(service.getPublished(slug)));
    }
}

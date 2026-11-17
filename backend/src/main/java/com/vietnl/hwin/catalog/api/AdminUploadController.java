package com.vietnl.hwin.catalog.api;

import org.springframework.http.ResponseEntity;
import java.util.UUID;

import java.io.IOException;
import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.vietnl.hwin.catalog.api.dto.UpdateProductStatusRequest;
import com.vietnl.hwin.catalog.api.dto.AdminProductResponse;
import com.vietnl.hwin.catalog.api.dto.SaveProductRequest;
import com.vietnl.hwin.catalog.api.dto.AdjustStockRequest;
import com.vietnl.hwin.catalog.api.dto.ImageUploadResponse;
import com.vietnl.hwin.catalog.api.mapper.ProductMapper;
import com.vietnl.hwin.catalog.entity.ProductSort;
import com.vietnl.hwin.catalog.service.ProductAdminService;
import com.vietnl.hwin.catalog.service.model.ProductSearchCriteria;
import com.vietnl.hwin.catalog.service.ProductSearchService;
import com.vietnl.hwin.catalog.service.integration.StorageService;
import com.vietnl.hwin.common.web.PageResponse;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Quản trị sản phẩm + upload ảnh. */
@Tag(name = "catalog-admin")
@RestController
@RequestMapping("/api/admin/uploads")
public class AdminUploadController {

    private final StorageService storage;

    public AdminUploadController(StorageService storage) {
        this.storage = storage;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> upload(@RequestPart("file") MultipartFile file) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(new ImageUploadResponse(storage.store(file.getInputStream(), file.getSize(), file.getContentType())));
    }
}

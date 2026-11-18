package com.vietnl.hwin.catalog.api;

import java.util.List;
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
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.catalog.api.dto.CertificateResponse;
import com.vietnl.hwin.catalog.api.dto.CreateCertificateRequest;
import com.vietnl.hwin.catalog.service.CertificateService;

import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "catalog-admin")
@RestController
@RequestMapping("/api/admin/certificates")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCertificateController {

    private final CertificateService service;

    public AdminCertificateController(CertificateService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<CertificateResponse>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @PostMapping
    public ResponseEntity<CertificateResponse> create(@Valid @RequestBody CreateCertificateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CertificateResponse> update(@PathVariable UUID id, @Valid @RequestBody CreateCertificateRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<CertificateResponse> toggleActive(@PathVariable UUID id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

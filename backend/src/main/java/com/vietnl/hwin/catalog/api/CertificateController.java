package com.vietnl.hwin.catalog.api;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.catalog.api.dto.CertificateResponse;
import com.vietnl.hwin.catalog.service.CertificateService;

import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "catalog")
@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService service;

    public CertificateController(CertificateService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<CertificateResponse>> listPublic() {
        return ResponseEntity.ok(service.listPublic());
    }
}

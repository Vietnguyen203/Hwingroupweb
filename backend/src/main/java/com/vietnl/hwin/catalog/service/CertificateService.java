package com.vietnl.hwin.catalog.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vietnl.hwin.catalog.api.dto.CertificateResponse;
import com.vietnl.hwin.catalog.api.dto.CreateCertificateRequest;
import com.vietnl.hwin.catalog.entity.Certificate;
import com.vietnl.hwin.catalog.repository.CertificateRepository;
import com.vietnl.hwin.common.exception.CommonErrorMessage;
import com.vietnl.hwin.common.exception.ResponseException;

@Service
@Transactional
public class CertificateService {

    private final CertificateRepository repository;

    public CertificateService(CertificateRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> listPublic() {
        return repository.findByActiveTrueOrderBySortOrderAscCreatedAtDesc()
                .stream()
                .map(CertificateResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> listAll() {
        return repository.findAllByOrderBySortOrderAscCreatedAtDesc()
                .stream()
                .map(CertificateResponse::from)
                .toList();
    }

    public CertificateResponse create(CreateCertificateRequest req) {
        Certificate cert = Certificate.builder()
                .title(trimToNull(req.title()))
                .certNumber(trimToNull(req.certNumber()))
                .issuer(trimToNull(req.issuer()))
                .issueDate(req.issueDate())
                .expiryDate(req.expiryDate())
                .imageUrl(req.imageUrl().trim())
                .category(req.category())
                .description(trimToNull(req.description()))
                .active(req.active() != null ? req.active() : true)
                .sortOrder(req.sortOrder() != null ? req.sortOrder() : 0)
                .build();
        return CertificateResponse.from(repository.save(cert));
    }

    public CertificateResponse update(UUID id, CreateCertificateRequest req) {
        Certificate cert = repository.findById(id)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, CommonErrorMessage.NOT_FOUND));
        cert.update(
                trimToNull(req.title()),
                trimToNull(req.certNumber()),
                trimToNull(req.issuer()),
                req.issueDate(),
                req.expiryDate(),
                req.imageUrl().trim(),
                req.category(),
                trimToNull(req.description()),
                req.active() != null ? req.active() : cert.isActive(),
                req.sortOrder() != null ? req.sortOrder() : cert.getSortOrder()
        );
        return CertificateResponse.from(cert);
    }

    public CertificateResponse toggleActive(UUID id) {
        Certificate cert = repository.findById(id)
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, CommonErrorMessage.NOT_FOUND));
        cert.toggleActive();
        return CertificateResponse.from(cert);
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseException(HttpStatus.NOT_FOUND, CommonErrorMessage.NOT_FOUND);
        }
        repository.deleteById(id);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

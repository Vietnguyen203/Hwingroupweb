package com.vietnl.hwin.catalog.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vietnl.hwin.catalog.entity.Certificate;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, UUID> {

    List<Certificate> findByActiveTrueOrderBySortOrderAscCreatedAtDesc();

    List<Certificate> findAllByOrderBySortOrderAscCreatedAtDesc();
}

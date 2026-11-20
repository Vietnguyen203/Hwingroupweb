package com.vietnl.hwin.content.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.vietnl.hwin.content.entity.Video;
import com.vietnl.hwin.content.entity.VideoPlatform;

public interface VideoRepository extends JpaRepository<Video, UUID>, JpaSpecificationExecutor<Video> {

    Optional<Video> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsByPlatformAndExternalId(VideoPlatform platform, String externalId);

    boolean existsByPlatformAndExternalIdAndIdNot(VideoPlatform platform, String externalId, UUID id);
}

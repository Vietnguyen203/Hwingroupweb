package com.vietnl.hwin.catalog.service.model;

import java.util.UUID;

import org.springframework.modulith.NamedInterface;

/** Ảnh chụp thông tin danh mục công bố cho module khác (content). */
@NamedInterface("query")
public record CategorySnapshot(UUID id, String name, String slug) {
}

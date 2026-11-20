package com.vietnl.hwin.content.api.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record AddVideoProductRequest(@NotNull UUID productId) {
}

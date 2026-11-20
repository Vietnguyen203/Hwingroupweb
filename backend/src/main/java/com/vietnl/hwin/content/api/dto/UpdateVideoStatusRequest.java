package com.vietnl.hwin.content.api.dto;

import jakarta.validation.constraints.NotNull;

import com.vietnl.hwin.content.entity.VideoStatus;

public record UpdateVideoStatusRequest(@NotNull VideoStatus status) {
}

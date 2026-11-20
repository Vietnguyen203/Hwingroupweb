package com.vietnl.hwin.content.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PreviewVideoRequest(@NotBlank @Size(max = 1000) String sourceUrl) {
}

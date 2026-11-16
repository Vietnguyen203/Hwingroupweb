package com.vietnl.hwin.customer.api.dto;

import java.util.UUID;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** DTO của module customer. */
public final class CustomerDtos {

    private CustomerDtos() {
    }

    public record ProfileResponse(UUID id, String phone, String fullName, int totalOrders, long totalSpent,
                                  Instant firstOrderAt, Instant lastOrderAt) {
    }

    public record UpdateProfileRequest(@Size(max = 100) String fullName) {
    }

    public record AddressRequest(
            @NotBlank @Size(max = 100) String recipientName,
            @NotBlank @Pattern(regexp = "^[0-9+ .\\-]{9,16}$", message = "Số điện thoại không hợp lệ") String recipientPhone,
            @NotBlank @Size(max = 100) String province,
            @NotBlank @Size(max = 100) String district,
            @NotBlank @Size(max = 100) String ward,
            @NotBlank @Size(max = 255) String street,
            boolean makeDefault) {
    }

    public record AddressResponse(UUID id, String recipientName, String recipientPhone, String province,
                                  String district, String ward, String street, String fullText,
                                  boolean isDefault) {
    }

    public record FavoriteProductResponse(UUID productId, String name, String slug, String imageUrl, long price,
                                          boolean inStock, int totalQuantity, int orderCount) {
    }
}

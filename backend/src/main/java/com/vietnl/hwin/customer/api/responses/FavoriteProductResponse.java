package com.vietnl.hwin.customer.api.responses;

import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteProductResponse {

    private UUID productId;
    private String name;
    private String slug;
    private String imageUrl;
    private long price;
    private boolean inStock;
    private int totalQuantity;
    private int orderCount;
}

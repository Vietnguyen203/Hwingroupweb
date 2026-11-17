package com.vietnl.hwin.customer.entity;

import java.util.UUID;
import java.io.Serializable;
import java.time.Instant;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
public record CustomerProductStatId(UUID customerId, UUID productId) implements Serializable {
}

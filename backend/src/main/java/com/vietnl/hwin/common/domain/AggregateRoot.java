package com.vietnl.hwin.common.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.Version;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.domain.AbstractAggregateRoot;

/**
 * Base cho aggregate root: optimistic locking + thời điểm tạo/sửa.
 * Event đăng ký bằng {@code registerEvent(...)} được Spring Data phát khi repository.save().
 */
@MappedSuperclass
public abstract class AggregateRoot<A extends AggregateRoot<A>> extends AbstractAggregateRoot<A> {

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getVersion() {
        return version;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

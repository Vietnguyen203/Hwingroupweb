package com.vietnl.hwin.customer.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vietnl.hwin.customer.entity.CustomerStats;

/** Repository của read model thống kê khách (ngoại lệ có chủ đích: read model, không phải aggregate). */
public interface CustomerStatsRepository extends JpaRepository<CustomerStats, UUID> {

    /**
     * Đánh dấu event đã xử lý. @return 1 nếu lần đầu, 0 nếu đã xử lý trước đó (event phát lại) -> bỏ qua.
     */
    @Modifying
    @Query(value = """
            insert into customer.processed_event (event_id, listener) values (:eventId, :listener)
            on conflict do nothing
            """, nativeQuery = true)
    int markProcessed(@Param("eventId") UUID eventId, @Param("listener") String listener);

    @Modifying
    @Query(value = "delete from customer.processed_event where processed_at < :cutoff", nativeQuery = true)
    int deleteProcessedBefore(@Param("cutoff") java.time.Instant cutoff);
}

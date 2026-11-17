package com.vietnl.hwin.customer.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.vietnl.hwin.customer.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    /**
     * Tạo hồ sơ khách nếu chưa có (idempotent). Dùng thay save() vì listener UserRegistered (bất đồng bộ)
     * và request đầu tiên của khách có thể cùng tạo một lúc. @return 1 nếu vừa tạo, 0 nếu đã có.
     */
    @Modifying
    @Query(value = """
            insert into customer.customer (id, phone, email) values (:id, :phone, :email)
            on conflict (id) do nothing
            """, nativeQuery = true)
    int insertIfAbsent(@Param("id") UUID id, @Param("phone") String phone, @Param("email") String email);

    /** Tạo dòng thống kê rỗng nếu chưa có (idempotent). */
    @Modifying
    @Query(value = """
            insert into customer.customer_stats (customer_id) values (:id)
            on conflict (customer_id) do nothing
            """, nativeQuery = true)
    int insertStatsIfAbsent(@Param("id") UUID id);
}

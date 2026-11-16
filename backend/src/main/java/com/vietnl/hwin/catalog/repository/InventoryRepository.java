package com.vietnl.hwin.catalog.repository;

import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.vietnl.hwin.catalog.entity.Product;

/**
 * Thao tác tồn kho nguyên tử trên aggregate Product (UPDATE có điều kiện + nhật ký stock_movement).
 * Dùng câu lệnh tham số hóa, không nối chuỗi SQL.
 */
public interface InventoryRepository extends Repository<Product, Long> {

    /** @return 1 nếu ghi nhận mới, 0 nếu đã có (đã xử lý trước đó). */
    @Modifying
    @Query(value = """
            insert into catalog.stock_movement (product_id, order_id, type, quantity)
            values (:productId, :orderId, :type, :quantity)
            on conflict (order_id, product_id, type) do nothing
            """, nativeQuery = true)
    int recordMovement(@Param("productId") Long productId, @Param("orderId") Long orderId,
                       @Param("type") String type, @Param("quantity") int quantity);

    /** Trừ kho nếu còn đủ. @return 1 nếu thành công, 0 nếu thiếu hàng. */
    @Modifying
    @Query(value = """
            update catalog.product
               set stock = stock - :quantity, sold_count = sold_count + :quantity, version = version + 1
             where id = :productId and stock >= :quantity
            """, nativeQuery = true)
    int deduct(@Param("productId") Long productId, @Param("quantity") int quantity);

    @Modifying
    @Query(value = """
            update catalog.product
               set stock = stock + :quantity, sold_count = greatest(sold_count - :quantity, 0), version = version + 1
             where id = :productId
            """, nativeQuery = true)
    int restore(@Param("productId") Long productId, @Param("quantity") int quantity);

    /** Các dòng đã trừ kho của một đơn: [product_id, quantity]. */
    @Query(value = "select product_id, quantity from catalog.stock_movement where order_id = :orderId and type = 'DEDUCT'",
            nativeQuery = true)
    List<Object[]> findDeducted(@Param("orderId") Long orderId);
}

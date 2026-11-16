package com.vietnl.hwin.ordering.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vietnl.hwin.ordering.entity.Cart;

public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByUserId(Long userId);
}

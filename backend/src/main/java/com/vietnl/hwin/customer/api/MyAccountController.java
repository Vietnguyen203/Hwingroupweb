package com.vietnl.hwin.customer.api;

import org.springframework.http.ResponseEntity;
import java.util.UUID;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.customer.api.requests.AddressRequest;
import com.vietnl.hwin.customer.api.responses.AddressResponse;
import com.vietnl.hwin.customer.api.responses.FavoriteProductResponse;
import com.vietnl.hwin.customer.api.responses.ProfileResponse;
import com.vietnl.hwin.customer.api.requests.UpdateProfileRequest;
import com.vietnl.hwin.customer.api.mapper.CustomerMapper;
import com.vietnl.hwin.customer.service.CustomerService;
import com.vietnl.hwin.customer.service.FavoriteProductService;
import com.vietnl.hwin.customer.service.ReorderService;

import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Tài khoản của tôi: hồ sơ, sổ địa chỉ, sản phẩm hay mua, mua lại.
 * Mọi thao tác dùng userId trong JWT – không nhận id khách từ client (chống IDOR).
 */
@Tag(name = "customer")
@RestController
@RequestMapping("/api/me")
public class MyAccountController {

    private final CustomerService customers;
    private final FavoriteProductService favorites;
    private final ReorderService reorders;
    private final CustomerMapper mapper;

    public MyAccountController(CustomerService customers, FavoriteProductService favorites, ReorderService reorders,
                               CustomerMapper mapper) {
        this.customers = customers;
        this.favorites = favorites;
        this.reorders = reorders;
        this.mapper = mapper;
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> profile(@AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(customers.profile(me.userId(), mapper::toProfile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ProfileResponse> updateProfile(@AuthenticationPrincipal AuthPrincipal me,
                                         @Valid @RequestBody UpdateProfileRequest r) {
        customers.rename(me.userId(), r.getFullName());
        return ResponseEntity.ok(customers.profile(me.userId(), mapper::toProfile));
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<AddressResponse>> addresses(@AuthenticationPrincipal AuthPrincipal me) {
        return ResponseEntity.ok(customers.addresses(me.userId(), mapper::toResponse));
    }

    @PostMapping("/addresses")
    public ResponseEntity<AddressResponse> addAddress(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody AddressRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customers.addAddress(me.userId(), mapper.toAddress(r), r.isMakeDefault(), mapper::toResponse));
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<List<AddressResponse>> updateAddress(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID id,
                                               @Valid @RequestBody AddressRequest r) {
        customers.updateAddress(me.userId(), id, mapper.toAddress(r));
        if (r.isMakeDefault()) {
            customers.setDefaultAddress(me.userId(), id);
        }
        return ResponseEntity.ok(customers.addresses(me.userId(), mapper::toResponse));
    }

    @PostMapping("/addresses/{id}/default")
    public ResponseEntity<List<AddressResponse>> setDefault(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID id) {
        customers.setDefaultAddress(me.userId(), id);
        return ResponseEntity.ok(customers.addresses(me.userId(), mapper::toResponse));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<Void> deleteAddress(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID id) {
        customers.removeAddress(me.userId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/favorite-products")
    public ResponseEntity<List<FavoriteProductResponse>> favorites(@AuthenticationPrincipal AuthPrincipal me,
                                                   @RequestParam(defaultValue = "8") int limit) {
        return ResponseEntity.ok(favorites.top(me.userId(), limit).stream().map(mapper::toFavorite).toList());
    }

    /** Mua lại: chép sản phẩm của đơn cũ vào giỏ, trả về sản phẩm đã thêm / bị bỏ qua. */
    @PostMapping("/orders/{code}/reorder")
    public ResponseEntity<ReorderService.Result> reorder(@AuthenticationPrincipal AuthPrincipal me, @PathVariable String code) {
        return ResponseEntity.ok(reorders.reorder(me.userId(), code));
    }
}

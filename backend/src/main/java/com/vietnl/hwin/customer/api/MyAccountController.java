package com.vietnl.hwin.customer.api;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.vietnl.hwin.common.security.AuthPrincipal;
import com.vietnl.hwin.customer.api.dto.CustomerDtos.AddressRequest;
import com.vietnl.hwin.customer.api.dto.CustomerDtos.AddressResponse;
import com.vietnl.hwin.customer.api.dto.CustomerDtos.FavoriteProductResponse;
import com.vietnl.hwin.customer.api.dto.CustomerDtos.ProfileResponse;
import com.vietnl.hwin.customer.api.dto.CustomerDtos.UpdateProfileRequest;
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
    public ProfileResponse profile(@AuthenticationPrincipal AuthPrincipal me) {
        return customers.profile(me.userId(), mapper::toProfile);
    }

    @PutMapping("/profile")
    public ProfileResponse updateProfile(@AuthenticationPrincipal AuthPrincipal me,
                                         @Valid @RequestBody UpdateProfileRequest r) {
        customers.rename(me.userId(), r.fullName());
        return customers.profile(me.userId(), mapper::toProfile);
    }

    @GetMapping("/addresses")
    public List<AddressResponse> addresses(@AuthenticationPrincipal AuthPrincipal me) {
        return customers.addresses(me.userId(), mapper::toResponse);
    }

    @PostMapping("/addresses")
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse addAddress(@AuthenticationPrincipal AuthPrincipal me, @Valid @RequestBody AddressRequest r) {
        return customers.addAddress(me.userId(), mapper.toAddress(r), r.makeDefault(), mapper::toResponse);
    }

    @PutMapping("/addresses/{id}")
    public List<AddressResponse> updateAddress(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID id,
                                               @Valid @RequestBody AddressRequest r) {
        customers.updateAddress(me.userId(), id, mapper.toAddress(r));
        if (r.makeDefault()) {
            customers.setDefaultAddress(me.userId(), id);
        }
        return customers.addresses(me.userId(), mapper::toResponse);
    }

    @PostMapping("/addresses/{id}/default")
    public List<AddressResponse> setDefault(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID id) {
        customers.setDefaultAddress(me.userId(), id);
        return customers.addresses(me.userId(), mapper::toResponse);
    }

    @DeleteMapping("/addresses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAddress(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID id) {
        customers.removeAddress(me.userId(), id);
    }

    @GetMapping("/favorite-products")
    public List<FavoriteProductResponse> favorites(@AuthenticationPrincipal AuthPrincipal me,
                                                   @RequestParam(defaultValue = "8") int limit) {
        return favorites.top(me.userId(), limit).stream().map(mapper::toFavorite).toList();
    }

    /** Mua lại: chép sản phẩm của đơn cũ vào giỏ, trả về sản phẩm đã thêm / bị bỏ qua. */
    @PostMapping("/orders/{code}/reorder")
    public ReorderService.Result reorder(@AuthenticationPrincipal AuthPrincipal me, @PathVariable String code) {
        return reorders.reorder(me.userId(), code);
    }
}

package com.vietnl.hwin.customer.api.mapper;

import org.mapstruct.Mapper;

import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.customer.api.dto.CustomerDtos.AddressRequest;
import com.vietnl.hwin.customer.api.dto.CustomerDtos.AddressResponse;
import com.vietnl.hwin.customer.api.dto.CustomerDtos.FavoriteProductResponse;
import com.vietnl.hwin.customer.api.dto.CustomerDtos.ProfileResponse;
import com.vietnl.hwin.customer.entity.CustomerAddress;
import com.vietnl.hwin.customer.service.CustomerService.Profile;
import com.vietnl.hwin.customer.service.FavoriteProductService.Favorite;

@Mapper
public interface CustomerMapper {

    default ProfileResponse toProfile(Profile p) {
        var c = p.customer();
        var s = p.stats();
        return new ProfileResponse(c.getId(), c.getPhone() == null ? null : c.getPhone().local(), c.getEmail(),
                c.getFullName(), s.getTotalOrders(),
                s.getTotalSpent().amount(), s.getFirstOrderAt(), s.getLastOrderAt());
    }

    default AddressResponse toResponse(CustomerAddress a) {
        Address x = a.getAddress();
        return new AddressResponse(a.getId(), x.recipientName(), x.recipientPhone().local(), x.province(),
                x.district(), x.ward(), x.street(), x.fullText(), a.isDefaultAddress());
    }

    default Address toAddress(AddressRequest r) {
        return new Address(r.recipientName(), PhoneNumber.of(r.recipientPhone()), r.province(), r.district(),
                r.ward(), r.street());
    }

    default FavoriteProductResponse toFavorite(Favorite f) {
        var p = f.product();
        return new FavoriteProductResponse(p.id(), p.name(), p.slug(), p.imageUrl(), p.price(), p.isPurchasable(),
                f.totalQuantity(), f.orderCount());
    }
}

package com.vietnl.hwin.customer.api.mapper;

import com.vietnl.hwin.customer.service.model.CustomerProfile;
import com.vietnl.hwin.customer.service.model.FavoriteProduct;
import org.mapstruct.Mapper;

import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.customer.api.dto.SaveAddressRequest;
import com.vietnl.hwin.customer.api.dto.AddressResponse;
import com.vietnl.hwin.customer.api.dto.FavoriteProductResponse;
import com.vietnl.hwin.customer.api.dto.ProfileResponse;
import com.vietnl.hwin.customer.entity.CustomerAddress;
import com.vietnl.hwin.customer.service.model.CustomerProfile;
import com.vietnl.hwin.customer.service.model.FavoriteProduct;

@Mapper
public interface CustomerMapper {

    default ProfileResponse toProfile(CustomerProfile p) {
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

    default Address toAddress(SaveAddressRequest r) {
        return new Address(r.getRecipientName(), PhoneNumber.of(r.getRecipientPhone()), r.getProvince(), r.getDistrict(),
                r.getWard(), r.getStreet());
    }

    default FavoriteProductResponse toFavorite(FavoriteProduct f) {
        var p = f.product();
        return new FavoriteProductResponse(p.id(), p.name(), p.slug(), p.imageUrl(), p.price(), p.isPurchasable(),
                f.totalQuantity(), f.orderCount());
    }
}

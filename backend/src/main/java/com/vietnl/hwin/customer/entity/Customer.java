package com.vietnl.hwin.customer.entity;

import java.util.Map;
import org.springframework.http.HttpStatus;
import com.vietnl.hwin.common.exception.ResponseException;
import java.util.UUID;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import com.vietnl.hwin.common.domain.Address;
import com.vietnl.hwin.common.domain.AggregateRoot;
import com.vietnl.hwin.common.domain.PhoneNumber;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Aggregate root: hồ sơ khách hàng. {@code id} = id tài khoản bên identity (không tự sinh).
 * Sổ địa chỉ: tối đa 10 địa chỉ, luôn có đúng 1 địa chỉ mặc định nếu sổ không rỗng.
 */
@Entity
@Table(name = "customers", schema = "customer")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Customer extends AggregateRoot<Customer> {

    public static final int MAX_ADDRESSES = 10;

    @Id
    private UUID id;

    /** SĐT hoặc email – ít nhất một (khách đăng nhập bằng email chưa có SĐT). */
    private PhoneNumber phone;

    private String email;

    private String fullName;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "customer_id", nullable = false)
    private List<CustomerAddress> addresses = new ArrayList<>();

    public static Customer register(UUID userId, PhoneNumber phone, String email) {
        if (phone == null && email == null) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.CONTACT_REQUIRED);
        }
        Customer c = new Customer();
        c.id = userId;
        c.phone = phone;
        c.email = email;
        return c;
    }

    public void rename(String fullName) {
        if (fullName != null && fullName.trim().length() > 100) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.NAME_TOO_LONG);
        }
        this.fullName = fullName == null || fullName.isBlank() ? null : fullName.trim();
    }

    /** Thêm địa chỉ; địa chỉ đầu tiên tự thành mặc định. */
    public CustomerAddress addAddress(Address address, boolean makeDefault, Instant now) {
        if (addresses.size() >= MAX_ADDRESSES) {
            throw new ResponseException(HttpStatus.UNPROCESSABLE_CONTENT, ExceptionMessage.ADDRESS_LIMIT, Map.of("max", String.valueOf(MAX_ADDRESSES)));
        }
        boolean isDefault = makeDefault || addresses.isEmpty();
        if (isDefault) {
            addresses.forEach(a -> a.markDefault(false));
        }
        CustomerAddress a = new CustomerAddress(address, isDefault, now);
        addresses.add(a);
        return a;
    }

    public void updateAddress(UUID addressId, Address address) {
        find(addressId).change(address);
    }

    public void setDefaultAddress(UUID addressId) {
        CustomerAddress target = find(addressId);
        addresses.forEach(a -> a.markDefault(a == target));
    }

    /** Xóa địa chỉ; nếu xóa địa chỉ mặc định thì địa chỉ mới nhất còn lại thành mặc định. */
    public void removeAddress(UUID addressId) {
        CustomerAddress target = find(addressId);
        addresses.remove(target);
        if (target.isDefaultAddress() && !addresses.isEmpty()) {
            addresses.stream().max(Comparator.comparing(CustomerAddress::getCreatedAt))
                    .ifPresent(a -> a.markDefault(true));
        }
    }

    /** Địa chỉ mặc định trước, sau đó mới nhất trước. */
    public List<CustomerAddress> getAddresses() {
        List<CustomerAddress> sorted = new ArrayList<>(addresses);
        sorted.sort(Comparator.comparing(CustomerAddress::isDefaultAddress).reversed()
                .thenComparing(CustomerAddress::getCreatedAt, Comparator.reverseOrder()));
        return Collections.unmodifiableList(sorted);
    }

    /** Không tìm thấy -> 404 (không tiết lộ địa chỉ của khách khác – chống IDOR). */
    private CustomerAddress find(UUID addressId) {
        return addresses.stream().filter(a -> a.getId() != null && a.getId().equals(addressId)).findFirst()
                .orElseThrow(() -> new ResponseException(HttpStatus.NOT_FOUND, ExceptionMessage.ADDRESS_NOT_FOUND));
    }
}

package com.vietnl.hwin.identity.api.mapper;

import java.util.Set;
import java.util.stream.Collectors;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.api.responses.MeResponse;
import com.vietnl.hwin.identity.entity.Role;
import com.vietnl.hwin.identity.entity.UserAccount;

@Mapper
public interface UserMapper {

    @Mapping(target = "phoneMasked", source = "phone")
    MeResponse toMe(UserAccount user);

    default String maskPhone(PhoneNumber phone) {
        return phone == null ? null : phone.masked();
    }

    default Set<String> roleNames(Set<Role> roles) {
        return roles.stream().map(Enum::name).collect(Collectors.toSet());
    }
}

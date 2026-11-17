package com.vietnl.hwin.identity.repository;

import java.util.UUID;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vietnl.hwin.common.domain.PhoneNumber;
import com.vietnl.hwin.identity.entity.Role;
import com.vietnl.hwin.identity.entity.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

    Optional<UserAccount> findByPhone(PhoneNumber phone);

    Optional<UserAccount> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByCitizenIdHash(String citizenIdHash);

    boolean existsByOtpExemptTrue();

    List<UserAccount> findByRolesContains(Role role);
}

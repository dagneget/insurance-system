package com.insurance.repository;

import com.insurance.entity.UnderwriterAuthority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UnderwriterAuthorityRepository extends JpaRepository<UnderwriterAuthority, Long> {
    Optional<UnderwriterAuthority> findByUserId(Long userId);
}

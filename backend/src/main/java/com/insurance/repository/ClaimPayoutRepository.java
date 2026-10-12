package com.insurance.repository;

import com.insurance.entity.ClaimPayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimPayoutRepository extends JpaRepository<ClaimPayout, Long> {
    Optional<ClaimPayout> findByClaimId(Long claimId);
    Optional<ClaimPayout> findByIdempotencyKey(String idempotencyKey);
    List<ClaimPayout> findByStatusOrderByClaimIdDesc(String status);
}

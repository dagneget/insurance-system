package com.insurance.repository;

import com.insurance.entity.ClaimInvestigation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClaimInvestigationRepository extends JpaRepository<ClaimInvestigation, Long> {
    Optional<ClaimInvestigation> findByClaimId(Long claimId);
}

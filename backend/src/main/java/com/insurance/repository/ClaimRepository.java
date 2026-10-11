package com.insurance.repository;

import com.insurance.entity.Claim;
import com.insurance.entity.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    Optional<Claim> findByClaimNumber(String claimNumber);

    List<Claim> findByPolicyIdOrderByIdDesc(Long policyId);

    @Query("SELECT c FROM Claim c " +
           "JOIN FETCH c.policy p " +
           "JOIN FETCH p.customer cust " +
           "JOIN FETCH p.vehicle v " +
           "WHERE (:status IS NULL OR c.status = :status) " +
           "ORDER BY c.id DESC")
    List<Claim> findByStatusWithDetails(@Param("status") ClaimStatus status);

    @Query("SELECT COUNT(c) FROM Claim c WHERE c.status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED')")
    long countOpenClaims();
}

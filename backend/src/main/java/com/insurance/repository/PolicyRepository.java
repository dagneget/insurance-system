package com.insurance.repository;

import com.insurance.entity.Policy;
import com.insurance.entity.PolicyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {

    Optional<Policy> findByPolicyNumber(String policyNumber);

    List<Policy> findByCustomerIdOrderByIdDesc(Long customerId);

    List<Policy> findByReferralFlagTrueOrderByIdDesc();

    List<Policy> findByAgentIdOrderByIdDesc(Long agentId);

    @Query("SELECT p FROM Policy p " +
           "JOIN FETCH p.customer c " +
           "JOIN FETCH p.vehicle v " +
           "WHERE (:status IS NULL OR p.status = :status) AND " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(p.policyNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.registrationNumber) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY p.id DESC")
    List<Policy> search(@Param("search") String search, @Param("status") PolicyStatus status);

    long countByStatus(PolicyStatus status);

    @Query("SELECT COALESCE(SUM(p.premium), 0) FROM Policy p WHERE p.status = 'ISSUED'")
    BigDecimal sumIssuedPremiums();

    @Query("SELECT p FROM Policy p " +
           "JOIN FETCH p.customer c " +
           "JOIN FETCH p.vehicle v " +
           "WHERE p.status = 'ISSUED' AND p.endDate <= :cutoffDate AND p.endDate >= :today " +
           "ORDER BY p.endDate ASC")
    List<Policy> findExpiringPolicies(@Param("today") java.time.LocalDate today, @Param("cutoffDate") java.time.LocalDate cutoffDate);

    @Query("SELECT COUNT(p) FROM Policy p WHERE p.status = 'ISSUED' AND p.endDate <= :cutoffDate AND p.endDate >= :today")
    long countExpiringPolicies(@Param("today") java.time.LocalDate today, @Param("cutoffDate") java.time.LocalDate cutoffDate);

    @Query("SELECT p FROM Policy p WHERE p.vehicle.id = :vehicleId AND p.status = 'ISSUED' AND p.endDate >= :today")
    List<Policy> findActivePoliciesForVehicle(@Param("vehicleId") Long vehicleId, @Param("today") java.time.LocalDate today);
}

package com.insurance.repository;

import com.insurance.entity.Payment;
import com.insurance.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByPolicyIdOrderByPaymentDateDesc(Long policyId);

    @Query("SELECT p FROM Payment p JOIN FETCH p.policy pol JOIN FETCH pol.customer c JOIN FETCH pol.vehicle v WHERE pol.id = :policyId ORDER BY p.paymentDate DESC")
    List<Payment> findByPolicyIdWithDetails(@Param("policyId") Long policyId);

    boolean existsByTransactionReference(String transactionReference);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.policy.id = :policyId AND p.status = 'SUCCESS'")
    BigDecimal sumSuccessfulPaymentsByPolicyId(@Param("policyId") Long policyId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.status = 'SUCCESS'")
    BigDecimal sumAllSuccessfulPayments();

    @Query("SELECT p FROM Payment p JOIN FETCH p.policy pol JOIN FETCH pol.customer c JOIN FETCH pol.vehicle v " +
           "WHERE (:status IS NULL OR p.status = :status) " +
           "AND (:query IS NULL OR :query = '' OR " +
           "LOWER(p.transactionReference) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(pol.policyNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(v.registrationNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY p.paymentDate DESC")
    List<Payment> searchPayments(@Param("query") String query, @Param("status") PaymentStatus status);

    @Query("SELECT p FROM Payment p JOIN FETCH p.policy pol JOIN FETCH pol.customer c JOIN FETCH pol.vehicle v " +
           "WHERE c.id = :customerId " +
           "ORDER BY p.paymentDate DESC")
    List<Payment> findByCustomerIdWithDetails(@Param("customerId") Long customerId);
}

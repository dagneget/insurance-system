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

    boolean existsByTransactionReference(String transactionReference);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.policy.id = :policyId AND p.status = 'SUCCESS'")
    BigDecimal sumSuccessfulPaymentsByPolicyId(@Param("policyId") Long policyId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.status = 'SUCCESS'")
    BigDecimal sumAllSuccessfulPayments();
}

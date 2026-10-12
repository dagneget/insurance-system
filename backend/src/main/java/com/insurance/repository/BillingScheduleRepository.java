package com.insurance.repository;

import com.insurance.entity.BillingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BillingScheduleRepository extends JpaRepository<BillingSchedule, Long> {
    List<BillingSchedule> findByPolicyIdOrderByInstallmentNumberAsc(Long policyId);
    List<BillingSchedule> findByDueDateBeforeAndStatusNot(LocalDate date, String status);
    List<BillingSchedule> findByPolicyIdAndStatusNot(Long policyId, String status);
}

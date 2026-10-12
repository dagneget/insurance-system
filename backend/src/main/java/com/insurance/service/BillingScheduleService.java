package com.insurance.service;

import com.insurance.dto.BillingScheduleDto;
import com.insurance.entity.BillingSchedule;
import com.insurance.repository.BillingScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BillingScheduleService {

    private final BillingScheduleRepository billingScheduleRepository;

    public BillingScheduleService(BillingScheduleRepository billingScheduleRepository) {
        this.billingScheduleRepository = billingScheduleRepository;
    }

    @Transactional(readOnly = true)
    public List<BillingScheduleDto> getAllSchedules() {
        return billingScheduleRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BillingScheduleDto> getSchedulesByPolicy(Long policyId) {
        return billingScheduleRepository.findByPolicyIdOrderByInstallmentNumberAsc(policyId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<BillingScheduleDto> getOverdueSchedules() {
        LocalDate today = LocalDate.now();
        List<BillingSchedule> candidates = billingScheduleRepository.findByDueDateBeforeAndStatusNot(today, "PAID");

        for (BillingSchedule s : candidates) {
            LocalDate cutoff = s.getDueDate().plusDays(s.getGracePeriodDays() != null ? s.getGracePeriodDays() : 15);
            if (today.isAfter(cutoff) && !"OVERDUE".equals(s.getStatus())) {
                s.setStatus("OVERDUE");
                billingScheduleRepository.save(s);
            }
        }

        return candidates.stream().map(this::toDto).collect(Collectors.toList());
    }

    public BillingScheduleDto toDto(BillingSchedule s) {
        String policyNumber = s.getPolicy() != null ? s.getPolicy().getPolicyNumber() : null;
        String customerName = s.getPolicy() != null && s.getPolicy().getCustomer() != null
                ? s.getPolicy().getCustomer().getFullName() : null;

        return new BillingScheduleDto(
                s.getId(),
                s.getPolicy() != null ? s.getPolicy().getId() : null,
                policyNumber,
                customerName,
                s.getInstallmentNumber(),
                s.getTotalInstallments(),
                s.getDueDate(),
                s.getAmountDue(),
                s.getAmountPaid(),
                s.getGracePeriodDays(),
                s.getStatus()
        );
    }
}

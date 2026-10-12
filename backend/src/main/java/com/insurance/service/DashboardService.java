package com.insurance.service;

import com.insurance.dto.DashboardSummaryDto;
import com.insurance.entity.PolicyStatus;
import com.insurance.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class DashboardService {

    private final PolicyRepository policyRepository;
    private final PaymentRepository paymentRepository;
    private final ClaimRepository claimRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;

    public DashboardService(PolicyRepository policyRepository,
                            PaymentRepository paymentRepository,
                            ClaimRepository claimRepository,
                            CustomerRepository customerRepository,
                            VehicleRepository vehicleRepository) {
        this.policyRepository = policyRepository;
        this.paymentRepository = paymentRepository;
        this.claimRepository = claimRepository;
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryDto getSummary() {
        long totalPolicies = policyRepository.count();
        long activePolicies = policyRepository.countByStatus(PolicyStatus.ISSUED);
        long draftPolicies = policyRepository.countByStatus(PolicyStatus.DRAFT);
        long expiredPolicies = policyRepository.countByStatus(PolicyStatus.EXPIRED);
        long renewedPolicies = policyRepository.countByStatus(PolicyStatus.RENEWED);

        LocalDate today = LocalDate.now();
        long expiringPolicies = policyRepository.countExpiringPolicies(today, today.plusDays(30));

        BigDecimal totalPremium = policyRepository.sumIssuedPremiums();
        if (totalPremium == null) {
            totalPremium = BigDecimal.ZERO;
        }

        BigDecimal totalPaid = paymentRepository.sumAllSuccessfulPayments();
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }

        BigDecimal totalOutstanding = totalPremium.subtract(totalPaid);
        if (totalOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            totalOutstanding = BigDecimal.ZERO;
        }

        long openClaimsCount = claimRepository.countOpenClaims();
        long totalCustomers = customerRepository.count();
        long totalVehicles = vehicleRepository.count();

        return new DashboardSummaryDto(
                totalPolicies,
                activePolicies,
                draftPolicies,
                expiringPolicies,
                expiredPolicies,
                renewedPolicies,
                totalPremium,
                totalPaid,
                totalOutstanding,
                openClaimsCount,
                totalCustomers,
                totalVehicles
        );
    }
}

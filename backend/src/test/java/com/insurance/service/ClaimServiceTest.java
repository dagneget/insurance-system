package com.insurance.service;

import com.insurance.dto.ClaimCreateRequest;
import com.insurance.dto.ClaimDto;
import com.insurance.dto.ClaimSettlementRequest;
import com.insurance.dto.ClaimStatusUpdateRequest;
import com.insurance.entity.*;
import com.insurance.exception.BusinessRuleException;
import com.insurance.repository.ClaimRepository;
import com.insurance.repository.PolicyRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private PolicyRepository policyRepository;

    @InjectMocks
    private ClaimService claimService;

    private Policy issuedPolicy;

    @BeforeEach
    void setUp() {
        Customer customer = new Customer("Test Customer", "+251911000000", "test@demo.com");
        customer.setId(1L);
        Vehicle vehicle = new Vehicle(customer, "3-12345", "Toyota", "Vitz", 2018);
        vehicle.setId(1L);

        issuedPolicy = new Policy(
                "POL-2026-1001",
                customer,
                vehicle,
                "Third-party",
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31),
                new BigDecimal("5000.00"),
                PolicyStatus.ISSUED
        );
        issuedPolicy.setId(10L);
    }

    @Test
    void createClaim_SuccessWithinCoverage() {
        ClaimCreateRequest request = new ClaimCreateRequest(
                10L,
                LocalDate.of(2026, 6, 15),
                "Fender bender",
                new BigDecimal("2000.00")
        );

        when(policyRepository.findById(10L)).thenReturn(Optional.of(issuedPolicy));
        when(claimRepository.save(any(Claim.class))).thenAnswer(inv -> {
            Claim c = inv.getArgument(0);
            c.setId(100L);
            return c;
        });

        ClaimDto result = claimService.createClaim(request);

        assertNotNull(result);
        assertEquals(ClaimStatus.SUBMITTED, result.getStatus());
        assertEquals(new BigDecimal("2000.00"), result.getRequestedAmount());
        verify(claimRepository).save(any(Claim.class));
    }

    @Test
    void createClaim_RejectsIncidentDateOutsideCoverage() {
        // Incident date is before policy starts
        ClaimCreateRequest requestBefore = new ClaimCreateRequest(
                10L,
                LocalDate.of(2025, 12, 31),
                "Accident before coverage",
                new BigDecimal("2000.00")
        );

        when(policyRepository.findById(10L)).thenReturn(Optional.of(issuedPolicy));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> claimService.createClaim(requestBefore));
        assertTrue(ex.getMessage().contains("must fall within policy coverage period"));
        verify(claimRepository, never()).save(any());
    }

    @Test
    void updateStatus_AllowsSubmittedToUnderReview() {
        Claim claim = new Claim("CLM-2026-0001", issuedPolicy, LocalDate.of(2026, 5, 1), "Dent", new BigDecimal("1000.00"));
        claim.setId(100L);

        when(claimRepository.findById(100L)).thenReturn(Optional.of(claim));
        when(claimRepository.save(any(Claim.class))).thenAnswer(inv -> inv.getArgument(0));

        ClaimStatusUpdateRequest request = new ClaimStatusUpdateRequest(ClaimStatus.UNDER_REVIEW, "Assigned to assessor", null);
        ClaimDto result = claimService.updateStatus(100L, request);

        assertEquals(ClaimStatus.UNDER_REVIEW, result.getStatus());
    }

    @Test
    void updateStatus_AllowsUnderReviewToApproved() {
        Claim claim = new Claim("CLM-2026-0001", issuedPolicy, LocalDate.of(2026, 5, 1), "Dent", new BigDecimal("1000.00"));
        claim.setId(100L);
        claim.setStatus(ClaimStatus.UNDER_REVIEW);

        when(claimRepository.findById(100L)).thenReturn(Optional.of(claim));
        when(claimRepository.save(any(Claim.class))).thenAnswer(inv -> inv.getArgument(0));

        ClaimStatusUpdateRequest request = new ClaimStatusUpdateRequest(ClaimStatus.APPROVED, "Approved by manager", new BigDecimal("900.00"));
        ClaimDto result = claimService.updateStatus(100L, request);

        assertEquals(ClaimStatus.APPROVED, result.getStatus());
        assertEquals(new BigDecimal("900.00"), result.getApprovedAmount());
    }

    @Test
    void updateStatus_RejectsInvalidTransitionFromSubmittedToApproved() {
        Claim claim = new Claim("CLM-2026-0001", issuedPolicy, LocalDate.of(2026, 5, 1), "Dent", new BigDecimal("1000.00"));
        claim.setId(100L);
        claim.setStatus(ClaimStatus.SUBMITTED);

        when(claimRepository.findById(100L)).thenReturn(Optional.of(claim));

        ClaimStatusUpdateRequest request = new ClaimStatusUpdateRequest(ClaimStatus.APPROVED, "Skipping review", new BigDecimal("900.00"));
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> claimService.updateStatus(100L, request));
        assertTrue(ex.getMessage().contains("Invalid claim status transition"));
    }

    @Test
    void recordSettlement_SuccessForApprovedClaim() {
        Claim claim = new Claim("CLM-2026-0001", issuedPolicy, LocalDate.of(2026, 5, 1), "Dent", new BigDecimal("1000.00"));
        claim.setId(100L);
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setApprovedAmount(new BigDecimal("900.00"));

        when(claimRepository.findById(100L)).thenReturn(Optional.of(claim));
        when(claimRepository.save(any(Claim.class))).thenAnswer(inv -> inv.getArgument(0));

        ClaimSettlementRequest request = new ClaimSettlementRequest(new BigDecimal("900.00"), "SETTLE-001", "Payment to body shop");
        ClaimDto result = claimService.recordSettlement(100L, request);

        assertEquals(ClaimStatus.SETTLED, result.getStatus());
        assertEquals(new BigDecimal("900.00"), result.getSettlementAmount());
    }

    @Test
    void recordSettlement_RejectsSettlementExceedingApprovedAmount() {
        Claim claim = new Claim("CLM-2026-0001", issuedPolicy, LocalDate.of(2026, 5, 1), "Dent", new BigDecimal("1000.00"));
        claim.setId(100L);
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setApprovedAmount(new BigDecimal("900.00"));

        when(claimRepository.findById(100L)).thenReturn(Optional.of(claim));

        ClaimSettlementRequest request = new ClaimSettlementRequest(new BigDecimal("1000.00"), "SETTLE-001", "Over payment");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> claimService.recordSettlement(100L, request));
        assertTrue(ex.getMessage().contains("cannot exceed approved amount"));
    }

    @Test
    void recordSettlement_RejectsSettlementOnUnapprovedClaim() {
        Claim claim = new Claim("CLM-2026-0001", issuedPolicy, LocalDate.of(2026, 5, 1), "Dent", new BigDecimal("1000.00"));
        claim.setId(100L);
        claim.setStatus(ClaimStatus.UNDER_REVIEW);

        when(claimRepository.findById(100L)).thenReturn(Optional.of(claim));

        ClaimSettlementRequest request = new ClaimSettlementRequest(new BigDecimal("500.00"), "SETTLE-001", "Premature");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> claimService.recordSettlement(100L, request));
        assertTrue(ex.getMessage().contains("Only APPROVED claims can be settled"));
    }
}

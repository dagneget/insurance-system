package com.insurance.service;

import com.insurance.dto.*;
import com.insurance.entity.Claim;
import com.insurance.entity.ClaimStatus;
import com.insurance.entity.Policy;
import com.insurance.entity.PolicyStatus;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.ClaimRepository;
import com.insurance.repository.PolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyRepository policyRepository;

    public ClaimService(ClaimRepository claimRepository, PolicyRepository policyRepository) {
        this.claimRepository = claimRepository;
        this.policyRepository = policyRepository;
    }

    @Transactional(readOnly = true)
    public List<ClaimDto> getClaims(ClaimStatus status) {
        List<Claim> claims = claimRepository.findByStatusWithDetails(status);
        return claims.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClaimDto getClaimById(Long id) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));
        return toDto(claim);
    }

    @Transactional
    public ClaimDto createClaim(ClaimCreateRequest request) {
        Policy policy = policyRepository.findById(request.getPolicyId())
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + request.getPolicyId()));

        if (policy.getStatus() != PolicyStatus.ISSUED) {
            throw new BusinessRuleException("Claims can only be filed against ISSUED policies (current status: " + policy.getStatus() + ")");
        }

        // Incident date must fall within the policy coverage dates
        if (request.getIncidentDate().isBefore(policy.getStartDate()) || request.getIncidentDate().isAfter(policy.getEndDate())) {
            throw new BusinessRuleException("Claim incident date (" + request.getIncidentDate() +
                    ") must fall within policy coverage period (" + policy.getStartDate() + " to " + policy.getEndDate() + ")");
        }

        if (request.getRequestedAmount() == null || request.getRequestedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Requested amount must be greater than zero");
        }

        String claimNumber = generateClaimNumber();

        Claim claim = new Claim(
                claimNumber,
                policy,
                request.getIncidentDate(),
                request.getDescription().trim(),
                request.getRequestedAmount()
        );

        Claim saved = claimRepository.save(claim);
        return toDto(saved);
    }

    @Transactional
    public ClaimDto updateStatus(Long id, ClaimStatusUpdateRequest request) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));

        ClaimStatus current = claim.getStatus();
        ClaimStatus next = request.getStatus();

        // Valid transitions:
        // SUBMITTED -> UNDER_REVIEW
        // UNDER_REVIEW -> APPROVED or REJECTED
        if (current == ClaimStatus.SUBMITTED && next == ClaimStatus.UNDER_REVIEW) {
            claim.setStatus(ClaimStatus.UNDER_REVIEW);
            if (request.getDecisionNote() != null) {
                claim.setDecisionNote(request.getDecisionNote().trim());
            }
        } else if (current == ClaimStatus.UNDER_REVIEW && (next == ClaimStatus.APPROVED || next == ClaimStatus.REJECTED)) {
            if (next == ClaimStatus.APPROVED) {
                if (request.getApprovedAmount() == null || request.getApprovedAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BusinessRuleException("Approved amount is required and must be greater than zero when approving a claim");
                }
                if (request.getApprovedAmount().compareTo(claim.getRequestedAmount()) > 0) {
                    throw new BusinessRuleException("Approved amount (" + request.getApprovedAmount() +
                            ") cannot exceed requested amount (" + claim.getRequestedAmount() + ")");
                }
                claim.setApprovedAmount(request.getApprovedAmount());
            } else {
                // REJECTED
                claim.setApprovedAmount(BigDecimal.ZERO);
            }
            claim.setStatus(next);
            claim.setDecisionNote(request.getDecisionNote() != null ? request.getDecisionNote().trim() : null);
            claim.setDecisionDate(OffsetDateTime.now());
        } else {
            throw new BusinessRuleException("Invalid claim status transition from " + current + " to " + next +
                    ". Allowed transitions: SUBMITTED -> UNDER_REVIEW, UNDER_REVIEW -> APPROVED or REJECTED");
        }

        Claim saved = claimRepository.save(claim);
        return toDto(saved);
    }

    @Transactional
    public ClaimDto recordSettlement(Long id, ClaimSettlementRequest request) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));

        // Rule: Only approved claims can be settled
        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new BusinessRuleException("Claim cannot be settled because current status is " + claim.getStatus() + ". Only APPROVED claims can be settled.");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Settlement amount must be greater than zero");
        }

        // Rule: Settlement amount cannot exceed approved amount
        if (request.getAmount().compareTo(claim.getApprovedAmount()) > 0) {
            throw new BusinessRuleException("Settlement amount (" + request.getAmount() +
                    ") cannot exceed approved amount (" + claim.getApprovedAmount() + ")");
        }

        claim.setStatus(ClaimStatus.SETTLED);
        claim.setSettlementAmount(request.getAmount());
        claim.setSettlementReference(request.getReference().trim());
        claim.setSettlementNote(request.getNote() != null ? request.getNote().trim() : null);
        claim.setSettlementDate(OffsetDateTime.now());

        Claim saved = claimRepository.save(claim);
        return toDto(saved);
    }

    public ClaimDto toDto(Claim claim) {
        return new ClaimDto(
                claim.getId(),
                claim.getClaimNumber(),
                claim.getPolicy().getId(),
                claim.getPolicy().getPolicyNumber(),
                claim.getPolicy().getCustomer().getFullName(),
                claim.getPolicy().getVehicle().getRegistrationNumber(),
                claim.getIncidentDate(),
                claim.getDescription(),
                claim.getRequestedAmount(),
                claim.getStatus(),
                claim.getDecisionNote(),
                claim.getApprovedAmount(),
                claim.getDecisionDate(),
                claim.getSettlementAmount(),
                claim.getSettlementReference(),
                claim.getSettlementNote(),
                claim.getSettlementDate(),
                claim.getCreatedAt()
        );
    }

    private String generateClaimNumber() {
        int year = LocalDate.now().getYear();
        for (int i = 0; i < 20; i++) {
            int randomNum = ThreadLocalRandom.current().nextInt(1000, 9999);
            String candidate = String.format("CLM-%d-%04d", year, randomNum);
            if (claimRepository.findByClaimNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        return "CLM-" + year + "-" + System.currentTimeMillis() % 100000;
    }
}

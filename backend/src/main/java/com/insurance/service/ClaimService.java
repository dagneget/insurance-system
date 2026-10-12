package com.insurance.service;

import com.insurance.dto.*;
import com.insurance.entity.*;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.ClaimPayoutRepository;
import com.insurance.repository.ClaimRepository;
import com.insurance.repository.PolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyRepository policyRepository;
    private final ClaimPayoutRepository claimPayoutRepository;
    private final com.insurance.repository.ClaimInvestigationRepository claimInvestigationRepository;
    private final com.insurance.repository.UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public ClaimService(ClaimRepository claimRepository,
                        PolicyRepository policyRepository,
                        ClaimPayoutRepository claimPayoutRepository,
                        com.insurance.repository.ClaimInvestigationRepository claimInvestigationRepository,
                        com.insurance.repository.UserRepository userRepository,
                        AuditLogService auditLogService,
                        NotificationService notificationService) {
        this.claimRepository = claimRepository;
        this.policyRepository = policyRepository;
        this.claimPayoutRepository = claimPayoutRepository;
        this.claimInvestigationRepository = claimInvestigationRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
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

        Claim claim = new Claim(
                generateClaimNumber(),
                policy,
                request.getIncidentDate(),
                request.getDescription().trim(),
                request.getRequestedAmount()
        );

        Claim saved = claimRepository.save(claim);
        return toDto(saved);
    }

    @Transactional
    public ClaimDto reviewClaim(Long id, ClaimStatusUpdateRequest request) {
        return reviewClaim(id, request, "sarah.adjuster");
    }

    @Transactional
    public ClaimDto reviewClaim(Long id, ClaimStatusUpdateRequest request, String adjusterUsername) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));

        // State Machine validation
        if (claim.getStatus() == ClaimStatus.SETTLED) {
            throw new BusinessRuleException("Cannot modify a SETTLED claim");
        }
        if (claim.getStatus() == ClaimStatus.REJECTED) {
            throw new BusinessRuleException("Cannot modify a REJECTED claim");
        }
        if (claim.getStatus() == ClaimStatus.SUBMITTED && request.getStatus() == ClaimStatus.APPROVED) {
            throw new BusinessRuleException("Invalid claim status transition: SUBMITTED claims must move to UNDER_REVIEW before approval");
        }

        ClaimStatus newStatus = request.getStatus();

        if (newStatus == ClaimStatus.APPROVED) {
            if (request.getApprovedAmount() == null || request.getApprovedAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException("Approved amount is required and must be greater than zero when approving a claim");
            }
            if (request.getApprovedAmount().compareTo(claim.getRequestedAmount()) > 0) {
                throw new BusinessRuleException("Approved amount (" + request.getApprovedAmount() +
                        ") cannot exceed requested amount (" + claim.getRequestedAmount() + ")");
            }

            // Maker-Checker threshold: claims > $10,000 require Senior Manager sign-off
            if (request.getApprovedAmount().compareTo(new BigDecimal("10000.00")) > 0) {
                if (adjusterUsername != null && !"elena.admin".equalsIgnoreCase(adjusterUsername) && !"elena.manager".equalsIgnoreCase(adjusterUsername)) {
                    throw new BusinessRuleException("Maker-Checker Control: Claim approvals exceeding $10,000 require Senior Manager (Elena Rostova) authorization.");
                }
            }

            claim.setApprovedAmount(request.getApprovedAmount());

            // Initialize ClaimPayout voucher for Finance desk
            ClaimPayout payout = claimPayoutRepository.findByClaimId(claim.getId())
                    .orElse(new ClaimPayout(claim, request.getApprovedAmount()));
            payout.setApprovedAmount(request.getApprovedAmount());
            payout.setStatus("PENDING_FINANCE");
            claimPayoutRepository.save(payout);
        } else if (newStatus == ClaimStatus.REJECTED) {
            if (request.getDecisionNote() == null || request.getDecisionNote().trim().isEmpty()) {
                throw new BusinessRuleException("Decision note is required when rejecting a claim");
            }
            claim.setApprovedAmount(null);
        }

        claim.setStatus(newStatus);
        claim.setDecisionNote(request.getDecisionNote() != null ? request.getDecisionNote().trim() : null);
        claim.setDecisionDate(OffsetDateTime.now());

        Claim saved = claimRepository.save(claim);

        // Audit log
        auditLogService.recordAction(
                adjusterUsername != null ? adjusterUsername : "sarah.adjuster",
                "ROLE_CLAIMS_OFFICER",
                "CLAIM_STATUS_UPDATED",
                "Claim",
                saved.getId(),
                null,
                Map.of("status", newStatus.name(), "approvedAmount", saved.getApprovedAmount() != null ? saved.getApprovedAmount() : "N/A"),
                null
        );

        // Notification to customer
        if (saved.getPolicy() != null && saved.getPolicy().getCustomer() != null) {
            notificationService.sendCustomerNotification(
                    saved.getPolicy().getCustomer().getId(),
                    "Claim #" + saved.getClaimNumber() + " " + newStatus,
                    "Your claim has been " + newStatus + (newStatus == ClaimStatus.APPROVED ? " with approved payout of $" + saved.getApprovedAmount() : ". Note: " + saved.getDecisionNote()),
                    newStatus == ClaimStatus.APPROVED ? "SUCCESS" : "WARNING",
                    "/claims/" + saved.getId()
            );
        }

        return toDto(saved);
    }

    @Transactional
    public ClaimDto updateStatus(Long id, ClaimStatusUpdateRequest request) {
        return reviewClaim(id, request);
    }

    @Transactional
    public ClaimDto investigateClaim(Long id, ClaimInvestigationRequest request, String adjusterUsername) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));

        ClaimInvestigation investigation = claimInvestigationRepository.findByClaimId(claim.getId())
                .orElse(new ClaimInvestigation(claim, null));

        if (request.getAssignedAdjusterId() != null) {
            userRepository.findById(request.getAssignedAdjusterId()).ifPresent(investigation::setAssignedAdjuster);
        } else if (adjusterUsername != null) {
            userRepository.findByUsername(adjusterUsername).ifPresent(investigation::setAssignedAdjuster);
        }

        if (request.getClaimType() != null) {
            investigation.setClaimType(request.getClaimType());
        }
        if (request.getSurveyorName() != null) {
            investigation.setSurveyorName(request.getSurveyorName().trim());
        }
        if (request.getSurveyorNotes() != null) {
            investigation.setSurveyorNotes(request.getSurveyorNotes().trim());
        }
        if (request.getRepairEstimate() != null) {
            investigation.setRepairEstimate(request.getRepairEstimate());
        }
        if (request.getDepreciationAmount() != null) {
            investigation.setDepreciationAmount(request.getDepreciationAmount());
        }
        if (request.getExcessApplied() != null) {
            investigation.setExcessApplied(request.getExcessApplied());
        } else if (claim.getPolicy() != null && claim.getPolicy().getDeductibleAmount() != null) {
            investigation.setExcessApplied(claim.getPolicy().getDeductibleAmount());
        }
        if (request.getSalvageValue() != null) {
            investigation.setSalvageValue(request.getSalvageValue());
        }
        if (request.getSumInsured() != null) {
            investigation.setSumInsured(request.getSumInsured());
        } else if (claim.getPolicy() != null && claim.getPolicy().getVehicleMarketValue() != null) {
            investigation.setSumInsured(claim.getPolicy().getVehicleMarketValue());
        }
        if (request.getMarketValue() != null) {
            investigation.setMarketValue(request.getMarketValue());
        } else if (claim.getPolicy() != null && claim.getPolicy().getVehicleMarketValue() != null) {
            investigation.setMarketValue(claim.getPolicy().getVehicleMarketValue());
        }

        // Fraud Advisory Flags Evaluation
        java.util.List<String> fraudFlags = new java.util.ArrayList<>();
        Policy policy = claim.getPolicy();
        if (policy != null) {
            if (claim.getIncidentDate().isBefore(policy.getStartDate()) || claim.getIncidentDate().isAfter(policy.getEndDate())) {
                fraudFlags.add("INCIDENT_OUTSIDE_COVER_PERIOD");
            }
        }
        if (claim.getCreatedAt() != null && claim.getIncidentDate().isBefore(claim.getCreatedAt().toLocalDate().minusDays(30))) {
            fraudFlags.add("LATE_REPORTING_30_DAYS");
        }
        investigation.setFraudFlags(fraudFlags.isEmpty() ? null : String.join(", ", fraudFlags));

        // Total loss threshold: repair estimate >= 75% of sum insured / market value
        BigDecimal valueBase = investigation.getSumInsured() != null ? investigation.getSumInsured() : investigation.getMarketValue();
        if (valueBase != null && valueBase.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal threshold = valueBase.multiply(new BigDecimal("0.75"));
            if (investigation.getRepairEstimate().compareTo(threshold) >= 0) {
                investigation.setTotalLoss(true);
            } else {
                investigation.setTotalLoss(false);
            }
        }

        if (request.getInvestigationStatus() != null) {
            investigation.setInvestigationStatus(request.getInvestigationStatus());
        }

        ClaimInvestigation savedInv = claimInvestigationRepository.save(investigation);
        claim.setInvestigation(savedInv);

        auditLogService.recordAction(
                adjusterUsername != null ? adjusterUsername : "sarah.adjuster",
                "ROLE_CLAIMS_OFFICER",
                "CLAIM_INVESTIGATION_UPDATED",
                "Claim",
                claim.getId(),
                null,
                Map.of(
                        "claimNumber", claim.getClaimNumber(),
                        "repairEstimate", savedInv.getRepairEstimate(),
                        "isTotalLoss", savedInv.getTotalLoss(),
                        "fraudFlags", savedInv.getFraudFlags() != null ? savedInv.getFraudFlags() : "NONE"
                ),
                null
        );

        return toDto(claim);
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

    @Transactional
    public ClaimPayoutDto disburseClaim(Long id, ClaimDisbursementRequest request, String financeOfficerUsername) {
        Claim claim = claimRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));

        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new BusinessRuleException("Only APPROVED claims can be disbursed by Finance. Current status is " + claim.getStatus());
        }

        // Idempotency verification
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<ClaimPayout> existing = claimPayoutRepository.findByIdempotencyKey(request.getIdempotencyKey().trim());
            if (existing.isPresent() && "DISBURSED".equals(existing.get().getStatus())) {
                return toPayoutDto(existing.get());
            }
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Disbursement amount must be greater than zero");
        }

        if (request.getAmount().compareTo(claim.getApprovedAmount()) > 0) {
            throw new BusinessRuleException("Disbursement amount (" + request.getAmount() +
                    ") exceeds claim approved authorization (" + claim.getApprovedAmount() + ")");
        }

        ClaimPayout payout = claimPayoutRepository.findByClaimId(claim.getId())
                .orElse(new ClaimPayout(claim, claim.getApprovedAmount()));

        payout.setDisbursedAmount(request.getAmount());
        payout.setPayoutMethod(request.getPayoutMethod().trim().toUpperCase());
        payout.setTransactionReference(request.getTransactionReference().trim());
        payout.setIdempotencyKey(request.getIdempotencyKey() != null ? request.getIdempotencyKey().trim() : null);
        payout.setDisbursedBy(financeOfficerUsername != null ? financeOfficerUsername : "marcus.finance");
        payout.setDisbursedAt(OffsetDateTime.now());
        payout.setStatus("DISBURSED");
        payout.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);

        ClaimPayout savedPayout = claimPayoutRepository.save(payout);

        // Update claim to SETTLED
        claim.setStatus(ClaimStatus.SETTLED);
        claim.setSettlementAmount(request.getAmount());
        claim.setSettlementReference(request.getTransactionReference().trim());
        claim.setSettlementDate(OffsetDateTime.now());
        claim.setSettlementNote(request.getNotes());
        claimRepository.save(claim);

        // Audit log
        auditLogService.recordAction(
                financeOfficerUsername != null ? financeOfficerUsername : "marcus.finance",
                "ROLE_FINANCE_OFFICER",
                "CLAIM_PAYOUT_DISBURSED",
                "ClaimPayout",
                savedPayout.getId(),
                null,
                Map.of(
                        "claimNumber", claim.getClaimNumber(),
                        "disbursedAmount", savedPayout.getDisbursedAmount(),
                        "payoutMethod", savedPayout.getPayoutMethod(),
                        "reference", savedPayout.getTransactionReference()
                ),
                null
        );

        // Customer Notification
        if (claim.getPolicy() != null && claim.getPolicy().getCustomer() != null) {
            notificationService.sendCustomerNotification(
                    claim.getPolicy().getCustomer().getId(),
                    "Claim Settlement Disbursed · $" + savedPayout.getDisbursedAmount(),
                    "Your settlement for claim #" + claim.getClaimNumber() + " of $" + savedPayout.getDisbursedAmount() +
                            " has been disbursed via " + savedPayout.getPayoutMethod() + ". Ref: " + savedPayout.getTransactionReference(),
                    "SUCCESS",
                    "/claims/" + claim.getId()
            );
        }

        return toPayoutDto(savedPayout);
    }

    @Transactional(readOnly = true)
    public List<ClaimPayoutDto> getPendingDisbursements() {
        return claimRepository.findByStatusWithDetails(ClaimStatus.APPROVED).stream().map(claim -> {
            ClaimPayout payout = claimPayoutRepository.findByClaimId(claim.getId())
                    .orElse(new ClaimPayout(claim, claim.getApprovedAmount()));
            return toPayoutDto(payout);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClaimPayoutDto getPayoutByClaimId(Long claimId) {
        ClaimPayout payout = claimPayoutRepository.findByClaimId(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Payout record not found for claim id: " + claimId));
        return toPayoutDto(payout);
    }

    public ClaimDto toDto(Claim claim) {
        ClaimDto dto = new ClaimDto(
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
        if (claim.getInvestigation() != null) {
            dto.setInvestigation(toInvestigationDto(claim.getInvestigation()));
        } else {
            claimInvestigationRepository.findByClaimId(claim.getId())
                    .ifPresent(inv -> dto.setInvestigation(toInvestigationDto(inv)));
        }
        return dto;
    }

    public ClaimInvestigationDto toInvestigationDto(ClaimInvestigation inv) {
        if (inv == null) return null;
        ClaimInvestigationDto dto = new ClaimInvestigationDto();
        dto.setId(inv.getId());
        dto.setClaimId(inv.getClaim() != null ? inv.getClaim().getId() : null);
        dto.setAssignedAdjusterId(inv.getAssignedAdjuster() != null ? inv.getAssignedAdjuster().getId() : null);
        dto.setAssignedAdjusterName(inv.getAssignedAdjuster() != null ? inv.getAssignedAdjuster().getFullName() : null);
        dto.setClaimType(inv.getClaimType());
        dto.setSurveyorName(inv.getSurveyorName());
        dto.setSurveyorNotes(inv.getSurveyorNotes());
        dto.setRepairEstimate(inv.getRepairEstimate());
        dto.setDepreciationAmount(inv.getDepreciationAmount());
        dto.setExcessApplied(inv.getExcessApplied());
        dto.setSalvageValue(inv.getSalvageValue());
        dto.setSumInsured(inv.getSumInsured());
        dto.setMarketValue(inv.getMarketValue());
        dto.setTotalLoss(inv.getTotalLoss());
        dto.setFraudFlags(inv.getFraudFlags());
        dto.setInvestigationStatus(inv.getInvestigationStatus());

        // Recommended payout formula
        BigDecimal payout;
        if (Boolean.TRUE.equals(inv.getTotalLoss())) {
            BigDecimal base = inv.getSumInsured() != null ? inv.getSumInsured() : (inv.getMarketValue() != null ? inv.getMarketValue() : BigDecimal.ZERO);
            payout = base.subtract(inv.getSalvageValue() != null ? inv.getSalvageValue() : BigDecimal.ZERO)
                    .subtract(inv.getExcessApplied() != null ? inv.getExcessApplied() : BigDecimal.ZERO);
        } else if ("THIRD_PARTY".equalsIgnoreCase(inv.getClaimType())) {
            payout = inv.getRepairEstimate() != null ? inv.getRepairEstimate() : BigDecimal.ZERO;
        } else {
            payout = (inv.getRepairEstimate() != null ? inv.getRepairEstimate() : BigDecimal.ZERO)
                    .subtract(inv.getDepreciationAmount() != null ? inv.getDepreciationAmount() : BigDecimal.ZERO)
                    .subtract(inv.getExcessApplied() != null ? inv.getExcessApplied() : BigDecimal.ZERO);
        }
        if (payout.compareTo(BigDecimal.ZERO) < 0) {
            payout = BigDecimal.ZERO;
        }
        dto.setRecommendedPayout(payout);
        return dto;
    }

    public ClaimPayoutDto toPayoutDto(ClaimPayout p) {
        String claimNum = p.getClaim() != null ? p.getClaim().getClaimNumber() : null;
        String claimant = p.getClaim() != null && p.getClaim().getPolicy() != null && p.getClaim().getPolicy().getCustomer() != null
                ? p.getClaim().getPolicy().getCustomer().getFullName() : null;

        return new ClaimPayoutDto(
                p.getId(),
                p.getClaim() != null ? p.getClaim().getId() : null,
                claimNum,
                claimant,
                p.getApprovedAmount(),
                p.getDisbursedAmount(),
                p.getPayoutMethod(),
                p.getTransactionReference(),
                p.getIdempotencyKey(),
                p.getDisbursedBy(),
                p.getDisbursedAt(),
                p.getStatus(),
                p.getNotes()
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

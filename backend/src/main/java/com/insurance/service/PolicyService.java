package com.insurance.service;

import com.insurance.dto.*;
import com.insurance.entity.*;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final PaymentRepository paymentRepository;
    private final EndorsementRepository endorsementRepository;
    private final TariffRepository tariffRepository;
    private final UnderwriterAuthorityRepository authorityRepository;
    private final UserRepository userRepository;
    private final BillingScheduleRepository billingScheduleRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public PolicyService(PolicyRepository policyRepository,
                         CustomerRepository customerRepository,
                         VehicleRepository vehicleRepository,
                         PaymentRepository paymentRepository,
                         EndorsementRepository endorsementRepository,
                         TariffRepository tariffRepository,
                         UnderwriterAuthorityRepository authorityRepository,
                         UserRepository userRepository,
                         BillingScheduleRepository billingScheduleRepository,
                         AuditLogService auditLogService,
                         NotificationService notificationService) {
        this.policyRepository = policyRepository;
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.paymentRepository = paymentRepository;
        this.endorsementRepository = endorsementRepository;
        this.tariffRepository = tariffRepository;
        this.authorityRepository = authorityRepository;
        this.userRepository = userRepository;
        this.billingScheduleRepository = billingScheduleRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<PolicyDto> getPolicies(String search, PolicyStatus status) {
        List<Policy> policies = policyRepository.search(search, status);
        return policies.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PolicyDto> getPoliciesByAgent(Long agentId) {
        List<Policy> policies = policyRepository.findByAgentIdOrderByIdDesc(agentId);
        return policies.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PolicyDto> getReferralQueue() {
        List<Policy> policies = policyRepository.findByReferralFlagTrueOrderByIdDesc();
        return policies.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PolicyDto getPolicyById(Long id) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + id));
        return toDto(policy);
    }

    @Transactional(readOnly = true)
    public List<PolicyDto> getExpiringPolicies(int days) {
        LocalDate today = LocalDate.now();
        LocalDate cutoff = today.plusDays(days > 0 ? days : 30);
        return policyRepository.findExpiringPolicies(today, cutoff).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PolicyDto createPolicy(PolicyCreateRequest request) {
        return createPolicy(request, null);
    }

    @Transactional
    public PolicyDto createPolicy(PolicyCreateRequest request, String actorUsername) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        // Business Rule: Vehicle must belong to the specified customer
        if (!vehicle.getCustomer().getId().equals(customer.getId())) {
            throw new BusinessRuleException("Vehicle " + vehicle.getRegistrationNumber() + " does not belong to customer " + customer.getFullName());
        }

        // Business Rule: endDate must not be before startDate
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessRuleException("Policy end date (" + request.getEndDate() + ") must not be before start date (" + request.getStartDate() + ")");
        }

        String productCode = request.getProductCode() != null && !request.getProductCode().isBlank()
                ? request.getProductCode().trim().toUpperCase() : "COMPREHENSIVE";
        BigDecimal deductible = request.getDeductibleAmount() != null
                ? request.getDeductibleAmount() : new BigDecimal("500.00");

        BigDecimal vehicleMarketValue = request.getVehicleMarketValue() != null
                ? request.getVehicleMarketValue() : BigDecimal.valueOf(25000.00);

        // Resolve referral conditions
        boolean requiresReferral = Boolean.TRUE.equals(request.getReferralFlag());
        StringBuilder referralReasons = new StringBuilder();
        if (request.getReferralReason() != null && !request.getReferralReason().isBlank()) {
            referralReasons.append(request.getReferralReason().trim());
        }

        int currentYear = LocalDate.now().getYear();
        int vehicleAge = Math.max(0, currentYear - vehicle.getManufactureYear());
        if (vehicleAge > 15) {
            requiresReferral = true;
            if (referralReasons.length() > 0) referralReasons.append("; ");
            referralReasons.append("Vehicle age exceeds 15 years (Manufactured ").append(vehicle.getManufactureYear()).append(")");
        }

        // Authority boundary check for underwriter if actorUsername is provided
        if (actorUsername != null) {
            Optional<User> actorOpt = userRepository.findByUsername(actorUsername);
            if (actorOpt.isPresent()) {
                Optional<UnderwriterAuthority> authOpt = authorityRepository.findByUserId(actorOpt.get().getId());
                if (authOpt.isPresent()) {
                    UnderwriterAuthority auth = authOpt.get();
                    if (vehicleMarketValue.compareTo(auth.getMaxSumInsured()) > 0) {
                        requiresReferral = true;
                        if (referralReasons.length() > 0) referralReasons.append("; ");
                        referralReasons.append("Sum insured ($").append(vehicleMarketValue)
                                .append(") exceeds underwriter authority ($").append(auth.getMaxSumInsured()).append(")");
                    }
                }
            }
        }

        PolicyStatus status = requiresReferral ? PolicyStatus.QUOTED : (request.getStatus() != null ? request.getStatus() : PolicyStatus.ISSUED);

        String policyNumber = generatePolicyNumber();
        Policy policy = new Policy(
                policyNumber,
                customer,
                vehicle,
                request.getCoverageDescription().trim(),
                request.getStartDate(),
                request.getEndDate(),
                request.getPremium(),
                status
        );
        policy.setProductCode(productCode);
        policy.setDeductibleAmount(deductible);
        policy.setVehicleMarketValue(vehicleMarketValue);
        policy.setReferralFlag(requiresReferral);
        policy.setReferralReason(requiresReferral ? referralReasons.toString() : null);
        policy.setUnderwritingSubjectivities(request.getUnderwritingSubjectivities());

        // Assign broker/agent if provided
        if (request.getAgentId() != null) {
            userRepository.findById(request.getAgentId()).ifPresent(policy::setAgent);
        }

        Policy saved = policyRepository.save(policy);

        // Generate billing installment schedules
        int installmentsCount = request.getInstallmentsCount() != null && request.getInstallmentsCount() > 0
                ? request.getInstallmentsCount() : 1;
        createBillingScheduleForPolicy(saved, installmentsCount);

        // Audit log
        auditLogService.recordAction(
                actorUsername != null ? actorUsername : "SYSTEM",
                "ROLE_UNDERWRITER",
                requiresReferral ? "POLICY_SUBMITTED_FOR_REFERRAL" : "POLICY_ISSUED",
                "Policy",
                saved.getId(),
                null,
                Map.of("policyNumber", saved.getPolicyNumber(), "premium", saved.getPremium(), "referral", requiresReferral),
                null
        );

        // Notification to customer
        notificationService.sendCustomerNotification(
                customer.getId(),
                "Policy " + (requiresReferral ? "Referred for Approval" : "Bound & Issued"),
                "Policy " + saved.getPolicyNumber() + " for " + vehicle.getRegistrationNumber() +
                        (requiresReferral ? " has been routed to senior underwriting referral queue." : " is now active."),
                requiresReferral ? "WARNING" : "SUCCESS",
                "/policies/" + saved.getId()
        );

        return toDto(saved);
    }

    private void createBillingScheduleForPolicy(Policy policy, int installmentsCount) {
        BigDecimal totalPremium = policy.getPremium();
        BigDecimal installmentAmount = totalPremium.divide(BigDecimal.valueOf(installmentsCount), 2, RoundingMode.HALF_UP);
        BigDecimal remainder = totalPremium.subtract(installmentAmount.multiply(BigDecimal.valueOf(installmentsCount)));

        List<BillingSchedule> schedules = new ArrayList<>();
        int monthInterval = installmentsCount == 4 ? 3 : (installmentsCount == 2 ? 6 : 12);

        for (int i = 1; i <= installmentsCount; i++) {
            BigDecimal currentAmount = (i == 1) ? installmentAmount.add(remainder) : installmentAmount;
            LocalDate dueDate = policy.getStartDate().plusMonths((long) (i - 1) * monthInterval);

            BillingSchedule schedule = new BillingSchedule(
                    policy,
                    i,
                    installmentsCount,
                    dueDate,
                    currentAmount,
                    15
            );
            schedules.add(schedule);
        }

        billingScheduleRepository.saveAll(schedules);
    }

    @Transactional
    public QuoteCalculationDto calculateQuote(QuoteCalculationRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + request.getVehicleId()));

        String productCode = request.getProductCode() != null ? request.getProductCode().toUpperCase() : "COMPREHENSIVE";
        Tariff tariff = tariffRepository.findByProductCode(productCode).orElse(null);

        int currentYear = LocalDate.now().getYear();
        int age = Math.max(0, currentYear - vehicle.getManufactureYear());

        BigDecimal baseRate;
        BigDecimal minPremium;
        BigDecimal taxRate;
        BigDecimal deductible;
        BigDecimal commissionRate;
        String productName;
        String coverageDesc;

        if (tariff != null) {
            baseRate = tariff.getBaseRatePercentage();
            minPremium = tariff.getMinPremium();
            taxRate = tariff.getTaxPercentage();
            deductible = tariff.getStandardExcess();
            commissionRate = tariff.getBrokerCommissionPercentage();
            productName = tariff.getProductName();
            coverageDesc = productCode.equals("COMPREHENSIVE")
                    ? "All-inclusive motor coverage including collision, third-party liability, fire, theft, and natural hazards."
                    : (productCode.equals("THIRD_PARTY") ? "Covers bodily injury and property damage to third parties as legally required." : "Covers third-party liability plus loss or damage due to fire and theft.");
        } else {
            baseRate = productCode.equals("THIRD_PARTY") ? BigDecimal.valueOf(0.0150) : (productCode.equals("FIRE_THEFT") ? BigDecimal.valueOf(0.0300) : BigDecimal.valueOf(0.0450));
            minPremium = productCode.equals("THIRD_PARTY") ? new BigDecimal("2500.00") : (productCode.equals("FIRE_THEFT") ? new BigDecimal("4500.00") : new BigDecimal("6500.00"));
            taxRate = new BigDecimal("0.1500");
            deductible = productCode.equals("THIRD_PARTY") ? BigDecimal.ZERO : (productCode.equals("FIRE_THEFT") ? new BigDecimal("350.00") : new BigDecimal("500.00"));
            commissionRate = new BigDecimal("0.1000");
            productName = productCode.equals("THIRD_PARTY") ? "Third-Party Liability Only" : (productCode.equals("FIRE_THEFT") ? "Third-Party, Fire & Theft" : "Comprehensive Motor Insurance");
            coverageDesc = productCode.equals("COMPREHENSIVE")
                    ? "All-inclusive motor coverage including collision, third-party liability, fire, theft, and natural hazards."
                    : (productCode.equals("THIRD_PARTY") ? "Covers bodily injury and property damage to third parties as legally required." : "Covers third-party liability plus loss or damage due to fire and theft.");
        }

        BigDecimal basePremium;
        BigDecimal sumInsured;
        if (request.getEstimatedValue() != null && request.getEstimatedValue().compareTo(BigDecimal.ZERO) > 0) {
            sumInsured = request.getEstimatedValue();
            basePremium = sumInsured.multiply(baseRate).max(minPremium).setScale(2, RoundingMode.HALF_UP);
        } else {
            sumInsured = BigDecimal.valueOf(25000.00);
            basePremium = minPremium.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal riskAdjustment;
        if (productCode.equals("THIRD_PARTY")) {
            riskAdjustment = age > 8 ? new BigDecimal("250.00") : BigDecimal.ZERO;
        } else if (productCode.equals("FIRE_THEFT")) {
            riskAdjustment = new BigDecimal(Math.min(age * 50, 600)).setScale(2, RoundingMode.HALF_UP);
        } else {
            riskAdjustment = new BigDecimal(Math.min(age * 120, 1500)).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal subtotal = basePremium.add(riskAdjustment);
        BigDecimal taxesAndFees = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPremium = subtotal.add(taxesAndFees);
        BigDecimal brokerCommission = totalPremium.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);

        boolean referralRequired = sumInsured.compareTo(BigDecimal.valueOf(50000.00)) > 0 || age > 15;

        return new QuoteCalculationDto(
                productCode,
                productName,
                coverageDesc,
                basePremium,
                riskAdjustment,
                taxesAndFees,
                totalPremium,
                deductible,
                brokerCommission,
                referralRequired
        );
    }

    @Transactional
    public PolicyDto approveReferral(Long policyId, String notes, String underwriterUsername) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + policyId));

        if (!Boolean.TRUE.equals(policy.getReferralFlag())) {
            throw new BusinessRuleException("Policy " + policy.getPolicyNumber() + " is not currently in referral state.");
        }

        // Verify that underwriter has authority to approve referrals
        User underwriter = userRepository.findByUsername(underwriterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Underwriter user not found: " + underwriterUsername));

        UnderwriterAuthority authority = authorityRepository.findByUserId(underwriter.getId()).orElse(null);
        boolean canApprove = (authority != null && Boolean.TRUE.equals(authority.getCanApproveReferrals()))
                || underwriter.getRoles().contains("ROLE_ADMIN");

        if (!canApprove) {
            throw new BusinessRuleException("Underwriter '" + underwriterUsername + "' does not possess authority to approve referred policies.");
        }

        policy.setReferralFlag(false);
        policy.setStatus(PolicyStatus.ISSUED);
        if (notes != null && !notes.isBlank()) {
            String existingNotes = policy.getUnderwritingSubjectivities();
            policy.setUnderwritingSubjectivities((existingNotes != null ? existingNotes + " | " : "") + notes.trim());
        }

        Policy saved = policyRepository.save(policy);

        auditLogService.recordAction(
                underwriterUsername,
                "ROLE_UNDERWRITER",
                "REFERRAL_APPROVED",
                "Policy",
                saved.getId(),
                Map.of("referralFlag", true, "status", "QUOTED"),
                Map.of("referralFlag", false, "status", "ISSUED", "notes", notes != null ? notes : ""),
                null
        );

        notificationService.sendCustomerNotification(
                saved.getCustomer().getId(),
                "Policy Referral Approved",
                "Referred policy " + saved.getPolicyNumber() + " has been approved by " + underwriter.getFullName() + " and bound to ISSUED status.",
                "SUCCESS",
                "/policies/" + saved.getId()
        );

        return toDto(saved);
    }

    @Transactional
    public PolicyDto rejectReferral(Long policyId, String reason, String underwriterUsername) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + policyId));

        policy.setReferralFlag(false);
        policy.setStatus(PolicyStatus.CANCELLED);
        policy.setCancellationReason("Referral declined by underwriter: " + (reason != null ? reason : "Risk profile unacceptable"));
        policy.setCancelledAt(OffsetDateTime.now());

        Policy saved = policyRepository.save(policy);

        auditLogService.recordAction(
                underwriterUsername,
                "ROLE_UNDERWRITER",
                "REFERRAL_REJECTED",
                "Policy",
                saved.getId(),
                null,
                Map.of("reason", policy.getCancellationReason()),
                null
        );

        return toDto(saved);
    }

    @Transactional
    public PolicyDto renewPolicy(Long policyId, PolicyRenewalRequest request) {
        Policy existing = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + policyId));

        if (existing.getStatus() != PolicyStatus.ISSUED && existing.getStatus() != PolicyStatus.EXPIRED) {
            throw new BusinessRuleException("Only ISSUED or EXPIRED policies can be renewed. Current status: " + existing.getStatus());
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BusinessRuleException("Renewal end date cannot be before start date.");
        }

        // Prevent duplicate renewal
        boolean alreadyRenewed = policyRepository.search(null, null).stream()
                .anyMatch(p -> p.getRenewedFrom() != null && p.getRenewedFrom().getId().equals(policyId));
        if (alreadyRenewed) {
            throw new BusinessRuleException("Policy " + existing.getPolicyNumber() + " has already been renewed.");
        }

        // Mark existing policy as RENEWED
        existing.setStatus(PolicyStatus.RENEWED);
        policyRepository.save(existing);

        // Create the new renewed policy
        String newPolicyNumber = generatePolicyNumber();
        String coverage = request.getCoverageDescription() != null && !request.getCoverageDescription().isBlank()
                ? request.getCoverageDescription().trim() : existing.getCoverageDescription();
        BigDecimal deductible = request.getDeductibleAmount() != null
                ? request.getDeductibleAmount() : existing.getDeductibleAmount();

        Policy renewedPolicy = new Policy(
                newPolicyNumber,
                existing.getCustomer(),
                existing.getVehicle(),
                coverage,
                request.getStartDate(),
                request.getEndDate(),
                request.getPremium(),
                PolicyStatus.ISSUED
        );
        renewedPolicy.setProductCode(existing.getProductCode());
        renewedPolicy.setDeductibleAmount(deductible);
        renewedPolicy.setVehicleMarketValue(existing.getVehicleMarketValue());
        renewedPolicy.setAgent(existing.getAgent());
        renewedPolicy.setRenewedFrom(existing);

        Policy saved = policyRepository.save(renewedPolicy);
        createBillingScheduleForPolicy(saved, 1);

        return toDto(saved);
    }

    @Transactional
    public PolicyDto cancelPolicy(Long policyId, PolicyCancelRequest request) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + policyId));

        if (policy.getStatus() == PolicyStatus.CANCELLED) {
            throw new BusinessRuleException("Policy " + policy.getPolicyNumber() + " is already cancelled.");
        }

        policy.setStatus(PolicyStatus.CANCELLED);
        policy.setCancellationReason(request.getCancellationReason().trim());
        policy.setCancelledAt(OffsetDateTime.now());

        Policy saved = policyRepository.save(policy);
        return toDto(saved);
    }

    @Transactional
    public PolicyDto approvePolicy(Long policyId) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + policyId));

        if (policy.getStatus() == PolicyStatus.ISSUED) {
            throw new BusinessRuleException("Policy " + policy.getPolicyNumber() + " is already approved and issued.");
        }
        if (policy.getStatus() == PolicyStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot approve a cancelled policy.");
        }

        policy.setStatus(PolicyStatus.ISSUED);
        policy.setReferralFlag(false);
        Policy saved = policyRepository.save(policy);
        return toDto(saved);
    }

    @Transactional
    public EndorsementDto addEndorsement(Long policyId, EndorsementCreateRequest request) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + policyId));

        if (policy.getStatus() != PolicyStatus.ISSUED) {
            throw new BusinessRuleException("Endorsements can only be applied to active ISSUED policies (current status: " + policy.getStatus() + ")");
        }

        String endorsementNumber = generateEndorsementNumber();
        Endorsement endorsement = new Endorsement(
                endorsementNumber,
                policy,
                request.getEndorsementType().trim().toUpperCase(),
                request.getReason().trim(),
                request.getChangesSummary().trim(),
                request.getEffectiveDate()
        );

        Endorsement saved = endorsementRepository.save(endorsement);
        return toEndorsementDto(saved);
    }

    @Transactional(readOnly = true)
    public List<EndorsementDto> getEndorsements(Long policyId) {
        if (!policyRepository.existsById(policyId)) {
            throw new ResourceNotFoundException("Policy not found with id: " + policyId);
        }
        return endorsementRepository.findByPolicyIdOrderByCreatedAtDesc(policyId).stream()
                .map(this::toEndorsementDto)
                .collect(Collectors.toList());
    }

    public PolicyDto toDto(Policy policy) {
        BigDecimal totalPaid = paymentRepository.sumSuccessfulPaymentsByPolicyId(policy.getId());
        if (totalPaid == null) {
            totalPaid = BigDecimal.ZERO;
        }

        BigDecimal balance = policy.getPremium().subtract(totalPaid);
        if (balance.compareTo(BigDecimal.ZERO) < 0) {
            balance = BigDecimal.ZERO;
        }

        String vehicleDesc = policy.getVehicle().getMake() + " " + policy.getVehicle().getModel() + " (" + policy.getVehicle().getManufactureYear() + ")";
        Long renewedFromId = policy.getRenewedFrom() != null ? policy.getRenewedFrom().getId() : null;
        String renewedFromNumber = policy.getRenewedFrom() != null ? policy.getRenewedFrom().getPolicyNumber() : null;
        int endorsementCount = policy.getEndorsements() != null ? policy.getEndorsements().size() : 0;

        PolicyDto dto = new PolicyDto(
                policy.getId(),
                policy.getPolicyNumber(),
                policy.getCustomer().getId(),
                policy.getCustomer().getFullName(),
                policy.getCustomer().getPhone(),
                policy.getVehicle().getId(),
                policy.getVehicle().getRegistrationNumber(),
                vehicleDesc,
                policy.getProductCode() != null ? policy.getProductCode() : "COMPREHENSIVE",
                policy.getDeductibleAmount() != null ? policy.getDeductibleAmount() : new BigDecimal("500.00"),
                policy.getCoverageDescription(),
                policy.getStartDate(),
                policy.getEndDate(),
                policy.getPremium(),
                totalPaid,
                balance,
                policy.getStatus(),
                policy.getCancellationReason(),
                policy.getCancelledAt(),
                renewedFromId,
                renewedFromNumber,
                endorsementCount,
                policy.getCreatedAt()
        );

        dto.setReferralFlag(policy.getReferralFlag());
        dto.setReferralReason(policy.getReferralReason());
        dto.setUnderwritingSubjectivities(policy.getUnderwritingSubjectivities());
        dto.setVehicleMarketValue(policy.getVehicleMarketValue());
        if (policy.getAgent() != null) {
            dto.setAgentId(policy.getAgent().getId());
            dto.setAgentName(policy.getAgent().getFullName());
        }

        // Fetch billing installments if repository available
        if (billingScheduleRepository != null && policy.getId() != null) {
            List<BillingSchedule> schedules = billingScheduleRepository.findByPolicyIdOrderByInstallmentNumberAsc(policy.getId());
            if (schedules != null && !schedules.isEmpty()) {
                dto.setBillingSchedules(schedules.stream().map(s -> new BillingScheduleDto(
                        s.getId(),
                        policy.getId(),
                        policy.getPolicyNumber(),
                        s.getInstallmentNumber(),
                        s.getTotalInstallments(),
                        s.getDueDate(),
                        s.getAmountDue(),
                        s.getAmountPaid(),
                        s.getGracePeriodDays(),
                        s.getStatus()
                )).collect(Collectors.toList()));
            }
        }

        return dto;
    }

    public EndorsementDto toEndorsementDto(Endorsement e) {
        return new EndorsementDto(
                e.getId(),
                e.getEndorsementNumber(),
                e.getPolicy().getId(),
                e.getEndorsementType(),
                e.getReason(),
                e.getChangesSummary(),
                e.getEffectiveDate(),
                e.getCreatedAt()
        );
    }

    private String generatePolicyNumber() {
        int year = LocalDate.now().getYear();
        for (int i = 0; i < 20; i++) {
            int randomNum = ThreadLocalRandom.current().nextInt(1000, 9999);
            String candidate = String.format("POL-%d-%04d", year, randomNum);
            if (policyRepository.findByPolicyNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        return "POL-" + year + "-" + System.currentTimeMillis() % 100000;
    }

    private String generateEndorsementNumber() {
        int year = LocalDate.now().getYear();
        for (int i = 0; i < 20; i++) {
            int randomNum = ThreadLocalRandom.current().nextInt(1000, 9999);
            String candidate = String.format("END-%d-%04d", year, randomNum);
            if (!endorsementRepository.existsByEndorsementNumber(candidate)) {
                return candidate;
            }
        }
        return "END-" + year + "-" + System.currentTimeMillis() % 100000;
    }

    @Transactional(readOnly = true)
    public CommissionStatementDto getCommissionStatement(Long agentId) {
        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent user not found with id: " + agentId));

        List<Policy> policies = policyRepository.findByAgentIdOrderByIdDesc(agentId);
        Map<String, Tariff> tariffMap = tariffRepository.findAll().stream()
                .collect(Collectors.toMap(t -> t.getProductCode().toUpperCase(), t -> t, (a, b) -> a));

        List<CommissionLineItemDto> items = new ArrayList<>();
        BigDecimal totalGrossPremium = BigDecimal.ZERO;
        BigDecimal totalCommissionEarned = BigDecimal.ZERO;

        for (Policy p : policies) {
            String pCode = p.getProductCode() != null ? p.getProductCode().toUpperCase() : "COMPREHENSIVE";
            Tariff tariff = tariffMap.get(pCode);
            BigDecimal commissionRate = tariff != null && tariff.getBrokerCommissionPercentage() != null
                    ? tariff.getBrokerCommissionPercentage() : new BigDecimal("0.1000");

            BigDecimal premium = p.getPremium() != null ? p.getPremium() : BigDecimal.ZERO;
            BigDecimal commAmount = premium.multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);

            String payoutStatus;
            if (p.getStatus() == PolicyStatus.ISSUED || p.getStatus() == PolicyStatus.RENEWED) {
                payoutStatus = "EARNED";
                totalGrossPremium = totalGrossPremium.add(premium);
                totalCommissionEarned = totalCommissionEarned.add(commAmount);
            } else if (p.getStatus() == PolicyStatus.CANCELLED) {
                payoutStatus = "VOIDED";
            } else {
                payoutStatus = "PIPELINE_PENDING";
            }

            items.add(new CommissionLineItemDto(
                    p.getId(),
                    p.getPolicyNumber(),
                    p.getCustomer().getFullName(),
                    p.getVehicle().getRegistrationNumber(),
                    pCode,
                    premium,
                    commissionRate.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP),
                    commAmount,
                    p.getStatus().name(),
                    p.getStartDate(),
                    payoutStatus
            ));
        }

        return new CommissionStatementDto(
                agent.getId(),
                agent.getFullName(),
                totalGrossPremium,
                totalCommissionEarned,
                items.size(),
                items
        );
    }

    @Transactional
    public void sendRenewalReminder(Long policyId, String actorUsername) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + policyId));

        notificationService.sendCustomerNotification(
                policy.getCustomer().getId(),
                "Renewal Notice · Policy #" + policy.getPolicyNumber(),
                "Dear " + policy.getCustomer().getFullName() + ", your motor policy #" + policy.getPolicyNumber() +
                        " for " + policy.getVehicle().getRegistrationNumber() + " is due for renewal on " +
                        policy.getEndDate() + ". Please consult your agent (" +
                        (policy.getAgent() != null ? policy.getAgent().getFullName() : "David Kim") + ") to preserve continuous coverage.",
                "INFO",
                "/policies/" + policy.getId()
        );

        auditLogService.recordAction(
                actorUsername != null ? actorUsername : "david.agent",
                "ROLE_AGENT",
                "RENEWAL_REMINDER_SENT",
                "Policy",
                policy.getId(),
                null,
                Map.of("policyNumber", policy.getPolicyNumber(), "customer", policy.getCustomer().getFullName(), "expiry", policy.getEndDate().toString()),
                null
        );
    }

    @Transactional
    public void sendPaymentReminder(Long policyId, String actorUsername) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + policyId));

        notificationService.sendCustomerNotification(
                policy.getCustomer().getId(),
                "Payment Reminder · Policy #" + policy.getPolicyNumber(),
                "Dear " + policy.getCustomer().getFullName() + ", you have an upcoming premium installment due on policy #" +
                        policy.getPolicyNumber() + " for " + policy.getVehicle().getRegistrationNumber() +
                        ". Outstanding amount: $" + policy.getPremium() + ". Please settle via mobile money, card, or bank transfer.",
                "WARNING",
                "/policies/" + policy.getId()
        );

        auditLogService.recordAction(
                actorUsername != null ? actorUsername : "david.agent",
                "ROLE_AGENT",
                "PAYMENT_REMINDER_SENT",
                "Policy",
                policy.getId(),
                null,
                Map.of("policyNumber", policy.getPolicyNumber(), "customer", policy.getCustomer().getFullName(), "premium", policy.getPremium()),
                null
        );
    }
}

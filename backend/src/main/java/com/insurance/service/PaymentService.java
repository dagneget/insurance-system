package com.insurance.service;

import com.insurance.dto.PaymentAllocationDto;
import com.insurance.dto.PaymentCreateRequest;
import com.insurance.dto.PaymentDto;
import com.insurance.dto.PaymentVoidRequest;
import com.insurance.entity.*;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.BillingScheduleRepository;
import com.insurance.repository.PaymentAllocationRepository;
import com.insurance.repository.PaymentRepository;
import com.insurance.repository.PolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PolicyRepository policyRepository;
    private final BillingScheduleRepository billingScheduleRepository;
    private final PaymentAllocationRepository paymentAllocationRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public PaymentService(PaymentRepository paymentRepository,
                          PolicyRepository policyRepository,
                          BillingScheduleRepository billingScheduleRepository,
                          PaymentAllocationRepository paymentAllocationRepository,
                          AuditLogService auditLogService,
                          NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.policyRepository = policyRepository;
        this.billingScheduleRepository = billingScheduleRepository;
        this.paymentAllocationRepository = paymentAllocationRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getAllPayments(String query, PaymentStatus status) {
        return paymentRepository.searchPayments(query, status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getPaymentsByPolicy(Long policyId) {
        if (!policyRepository.existsById(policyId)) {
            throw new ResourceNotFoundException("Policy not found with id: " + policyId);
        }
        return paymentRepository.findByPolicyIdWithDetails(policyId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
        return toDto(payment);
    }

    @Transactional
    public PaymentDto recordPayment(Long policyId, PaymentCreateRequest request) {
        return recordPayment(policyId, request, "marcus.finance");
    }

    @Transactional
    public PaymentDto recordPayment(Long policyId, PaymentCreateRequest request, String financeOfficerUsername) {
        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + policyId));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Payment amount must be greater than zero");
        }

        String ref = request.getTransactionReference().trim();
        if (paymentRepository.existsByTransactionReference(ref)) {
            throw new BusinessRuleException("Transaction reference '" + ref + "' already exists");
        }

        // Calculate remaining balance
        BigDecimal alreadyPaid = paymentRepository.sumSuccessfulPaymentsByPolicyId(policy.getId());
        if (alreadyPaid == null) {
            alreadyPaid = BigDecimal.ZERO;
        }
        BigDecimal remainingBalance = policy.getPremium().subtract(alreadyPaid);
        if (remainingBalance.compareTo(BigDecimal.ZERO) < 0) {
            remainingBalance = BigDecimal.ZERO;
        }

        // Rule: Prohibit payments exceeding the remaining balance
        if (request.getAmount().compareTo(remainingBalance) > 0) {
            throw new BusinessRuleException("Payment amount (" + request.getAmount() +
                    ") exceeds remaining policy balance (" + remainingBalance + ")");
        }

        String method = (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank())
                ? request.getPaymentMethod().trim()
                : "CASH";

        Payment payment = new Payment(
                policy,
                request.getAmount(),
                ref,
                method,
                PaymentStatus.SUCCESS,
                request.getNote() != null ? request.getNote().trim() : null
        );
        payment.setMakerUsername(financeOfficerUsername != null ? financeOfficerUsername : "marcus.finance");
        payment.setVoidStatus("NONE");

        Payment saved = paymentRepository.save(payment);

        // Allocate to Billing Schedules
        allocatePaymentToSchedules(saved, request.getBillingScheduleId());

        // Audit log
        auditLogService.recordAction(
                financeOfficerUsername != null ? financeOfficerUsername : "marcus.finance",
                "ROLE_FINANCE_OFFICER",
                "PAYMENT_COLLECTED",
                "Payment",
                saved.getId(),
                null,
                Map.of(
                        "amount", saved.getAmount(),
                        "policyNumber", policy.getPolicyNumber(),
                        "method", saved.getPaymentMethod(),
                        "reference", saved.getTransactionReference()
                ),
                null
        );

        // Customer notification
        if (policy.getCustomer() != null) {
            notificationService.sendCustomerNotification(
                    policy.getCustomer().getId(),
                    "Payment Receipt · $" + saved.getAmount(),
                    "Payment of $" + saved.getAmount() + " via " + saved.getPaymentMethod() +
                            " for Policy #" + policy.getPolicyNumber() + " has been recorded. Ref: " + saved.getTransactionReference(),
                    "SUCCESS",
                    "/policies/" + policy.getId()
            );
        }

        return toDto(saved);
    }

    private void allocatePaymentToSchedules(Payment payment, Long targetScheduleId) {
        BigDecimal unallocated = payment.getAmount();

        List<BillingSchedule> schedules;
        if (targetScheduleId != null) {
            BillingSchedule specific = billingScheduleRepository.findById(targetScheduleId).orElse(null);
            schedules = specific != null ? List.of(specific) : billingScheduleRepository.findByPolicyIdOrderByInstallmentNumberAsc(payment.getPolicy().getId());
        } else {
            schedules = billingScheduleRepository.findByPolicyIdOrderByInstallmentNumberAsc(payment.getPolicy().getId());
        }

        for (BillingSchedule s : schedules) {
            if (unallocated.compareTo(BigDecimal.ZERO) <= 0) break;
            BigDecimal currentPaid = s.getAmountPaid() != null ? s.getAmountPaid() : BigDecimal.ZERO;
            BigDecimal needed = s.getAmountDue().subtract(currentPaid);
            if (needed.compareTo(BigDecimal.ZERO) <= 0) continue;

            BigDecimal allocate = unallocated.min(needed);
            PaymentAllocation alloc = new PaymentAllocation(payment, s, allocate);
            paymentAllocationRepository.save(alloc);

            BigDecimal newPaid = currentPaid.add(allocate);
            s.setAmountPaid(newPaid);
            if (newPaid.compareTo(s.getAmountDue()) >= 0) {
                s.setStatus("PAID");
            } else {
                s.setStatus("PARTIAL");
            }
            billingScheduleRepository.save(s);

            unallocated = unallocated.subtract(allocate);
        }
    }

    @Transactional
    public PaymentDto voidPayment(Long paymentId, PaymentVoidRequest request) {
        return voidPayment(paymentId, request, null);
    }

    @Transactional
    public PaymentDto voidPayment(Long paymentId, PaymentVoidRequest request, String actorUsername) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new BusinessRuleException("Only successful payments can be voided. Current status is " + payment.getStatus());
        }

        String maker = request.getMakerUsername() != null && !request.getMakerUsername().isBlank()
                ? request.getMakerUsername().trim()
                : (actorUsername != null ? actorUsername : "marcus.finance");

        BigDecimal threshold = new BigDecimal("2500.00");
        boolean requiresDualSignoff = payment.getAmount().compareTo(threshold) > 0;

        if (requiresDualSignoff) {
            String checker = request.getCheckerUsername() != null ? request.getCheckerUsername().trim() : null;
            if (checker == null || checker.isBlank() || checker.equalsIgnoreCase(maker)) {
                // Submit for Maker-Checker Dual sign-off
                payment.setVoidStatus("PENDING_APPROVAL");
                payment.setMakerUsername(maker);
                payment.setVoidReason(request.getVoidReason().trim());
                Payment saved = paymentRepository.save(payment);

                auditLogService.recordAction(
                        maker,
                        "ROLE_FINANCE_OFFICER",
                        "PAYMENT_VOID_SUBMITTED_FOR_CO_SIGN",
                        "Payment",
                        saved.getId(),
                        null,
                        Map.of("amount", saved.getAmount(), "reason", saved.getVoidReason(), "requiresCoSign", true),
                        null
                );

                return toDto(saved);
            }

            // Both maker and checker provided
            payment.setCheckerUsername(checker);
        }

        // Execute void
        executePaymentVoid(payment, maker, request.getCheckerUsername(), request.getVoidReason().trim());
        Payment saved = paymentRepository.save(payment);
        return toDto(saved);
    }

    @Transactional
    public PaymentDto approveVoid(Long paymentId, String checkerUsername) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        if (!"PENDING_APPROVAL".equals(payment.getVoidStatus())) {
            throw new BusinessRuleException("Payment void is not pending managerial approval. Current voidStatus: " + payment.getVoidStatus());
        }

        if (checkerUsername != null && checkerUsername.equalsIgnoreCase(payment.getMakerUsername())) {
            throw new BusinessRuleException("Maker and checker cannot be the same user for dual sign-off controls.");
        }

        executePaymentVoid(payment, payment.getMakerUsername(), checkerUsername, payment.getVoidReason());
        Payment saved = paymentRepository.save(payment);
        return toDto(saved);
    }

    private void executePaymentVoid(Payment payment, String maker, String checker, String reason) {
        payment.setStatus(PaymentStatus.VOIDED);
        payment.setVoidStatus("APPROVED");
        payment.setMakerUsername(maker);
        if (checker != null) {
            payment.setCheckerUsername(checker);
        }
        payment.setVoidReason(reason);
        payment.setVoidedAt(OffsetDateTime.now());

        // Revert schedule allocations
        List<PaymentAllocation> allocations = paymentAllocationRepository.findByPaymentId(payment.getId());
        for (PaymentAllocation a : allocations) {
            BillingSchedule s = a.getBillingSchedule();
            if (s != null) {
                BigDecimal currentPaid = s.getAmountPaid() != null ? s.getAmountPaid() : BigDecimal.ZERO;
                BigDecimal reverted = currentPaid.subtract(a.getAllocatedAmount());
                if (reverted.compareTo(BigDecimal.ZERO) < 0) reverted = BigDecimal.ZERO;
                s.setAmountPaid(reverted);
                if (reverted.compareTo(BigDecimal.ZERO) == 0) {
                    s.setStatus("PENDING");
                } else if (reverted.compareTo(s.getAmountDue()) < 0) {
                    s.setStatus("PARTIAL");
                }
                billingScheduleRepository.save(s);
            }
        }

        auditLogService.recordAction(
                checker != null ? checker : maker,
                "ROLE_FINANCE_OFFICER",
                "PAYMENT_VOID_EXECUTED",
                "Payment",
                payment.getId(),
                null,
                Map.of("amount", payment.getAmount(), "maker", maker, "checker", checker != null ? checker : "N/A", "reason", reason),
                null
        );
    }

    public PaymentDto toDto(Payment payment) {
        String customerName = payment.getPolicy() != null && payment.getPolicy().getCustomer() != null
                ? payment.getPolicy().getCustomer().getFullName()
                : "";
        String vehicleReg = payment.getPolicy() != null && payment.getPolicy().getVehicle() != null
                ? payment.getPolicy().getVehicle().getRegistrationNumber()
                : "";

        List<PaymentAllocationDto> allocDtos = new ArrayList<>();
        if (payment.getPaymentAllocations() != null) {
            for (PaymentAllocation a : payment.getPaymentAllocations()) {
                allocDtos.add(new PaymentAllocationDto(
                        a.getId(),
                        payment.getId(),
                        a.getBillingSchedule() != null ? a.getBillingSchedule().getId() : null,
                        a.getBillingSchedule() != null ? a.getBillingSchedule().getInstallmentNumber() : null,
                        a.getAllocatedAmount(),
                        a.getAllocatedAt()
                ));
            }
        }

        return new PaymentDto(
                payment.getId(),
                payment.getPolicy().getId(),
                payment.getPolicy().getPolicyNumber(),
                customerName,
                vehicleReg,
                payment.getAmount(),
                payment.getTransactionReference(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                payment.getNote(),
                payment.getVoidReason(),
                payment.getVoidedAt(),
                payment.getPaymentDate(),
                payment.getMakerUsername(),
                payment.getCheckerUsername(),
                payment.getVoidStatus(),
                allocDtos
        );
    }
}

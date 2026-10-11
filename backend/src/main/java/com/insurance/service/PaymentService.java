package com.insurance.service;

import com.insurance.dto.PaymentCreateRequest;
import com.insurance.dto.PaymentDto;
import com.insurance.entity.Payment;
import com.insurance.entity.PaymentStatus;
import com.insurance.entity.Policy;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.PaymentRepository;
import com.insurance.repository.PolicyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PolicyRepository policyRepository;

    public PaymentService(PaymentRepository paymentRepository, PolicyRepository policyRepository) {
        this.paymentRepository = paymentRepository;
        this.policyRepository = policyRepository;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getPaymentsByPolicy(Long policyId) {
        if (!policyRepository.existsById(policyId)) {
            throw new ResourceNotFoundException("Policy not found with id: " + policyId);
        }
        return paymentRepository.findByPolicyIdOrderByPaymentDateDesc(policyId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentDto recordPayment(Long policyId, PaymentCreateRequest request) {
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

        // Rule: Prohibit payments exceeding the remaining balance under MVP rule
        if (request.getAmount().compareTo(remainingBalance) > 0) {
            throw new BusinessRuleException("Payment amount (" + request.getAmount() +
                    ") exceeds remaining policy balance (" + remainingBalance + ")");
        }

        String method = (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank())
                ? request.getPaymentMethod().trim()
                : "DEMO";

        Payment payment = new Payment(
                policy,
                request.getAmount(),
                ref,
                method,
                PaymentStatus.SUCCESS,
                request.getNote() != null ? request.getNote().trim() : null
        );

        Payment saved = paymentRepository.save(payment);
        return toDto(saved);
    }

    public PaymentDto toDto(Payment payment) {
        return new PaymentDto(
                payment.getId(),
                payment.getPolicy().getId(),
                payment.getPolicy().getPolicyNumber(),
                payment.getAmount(),
                payment.getTransactionReference(),
                payment.getPaymentMethod(),
                payment.getStatus(),
                payment.getNote(),
                payment.getPaymentDate()
        );
    }
}

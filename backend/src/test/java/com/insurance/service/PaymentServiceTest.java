package com.insurance.service;

import com.insurance.dto.PaymentCreateRequest;
import com.insurance.dto.PaymentDto;
import com.insurance.entity.*;
import com.insurance.exception.BusinessRuleException;
import com.insurance.repository.PaymentRepository;
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
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PolicyRepository policyRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Policy policy;

    @BeforeEach
    void setUp() {
        Customer customer = new Customer("Test Customer", "+251911000000", "test@demo.com");
        customer.setId(1L);
        Vehicle vehicle = new Vehicle(customer, "3-12345", "Toyota", "Vitz", 2018);
        vehicle.setId(1L);

        policy = new Policy(
                "POL-2026-1001",
                customer,
                vehicle,
                "Third-party",
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31),
                new BigDecimal("5000.00"),
                PolicyStatus.ISSUED
        );
        policy.setId(10L);
    }

    @Test
    void recordPayment_Success() {
        PaymentCreateRequest request = new PaymentCreateRequest(
                new BigDecimal("2000.00"),
                "DEMO-REF-001",
                "DEMO",
                "Installment 1"
        );

        when(policyRepository.findById(10L)).thenReturn(Optional.of(policy));
        when(paymentRepository.existsByTransactionReference("DEMO-REF-001")).thenReturn(false);
        when(paymentRepository.sumSuccessfulPaymentsByPolicyId(10L)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(100L);
            return p;
        });

        PaymentDto result = paymentService.recordPayment(10L, request);

        assertNotNull(result);
        assertEquals(new BigDecimal("2000.00"), result.getAmount());
        assertEquals("DEMO-REF-001", result.getTransactionReference());
        assertEquals(PaymentStatus.SUCCESS, result.getStatus());
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void recordPayment_RejectsDuplicateTransactionReference() {
        PaymentCreateRequest request = new PaymentCreateRequest(
                new BigDecimal("1000.00"),
                "DUPLICATE-REF",
                "DEMO",
                "Note"
        );

        when(policyRepository.findById(10L)).thenReturn(Optional.of(policy));
        when(paymentRepository.existsByTransactionReference("DUPLICATE-REF")).thenReturn(true);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> paymentService.recordPayment(10L, request));
        assertTrue(ex.getMessage().contains("already exists"));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void recordPayment_RejectsAmountExceedingRemainingBalance() {
        // Premium is 5000. Already paid 4000. Remaining balance is 1000. Attempt to pay 1500.
        PaymentCreateRequest request = new PaymentCreateRequest(
                new BigDecimal("1500.00"),
                "DEMO-REF-002",
                "DEMO",
                "Overpayment attempt"
        );

        when(policyRepository.findById(10L)).thenReturn(Optional.of(policy));
        when(paymentRepository.existsByTransactionReference("DEMO-REF-002")).thenReturn(false);
        when(paymentRepository.sumSuccessfulPaymentsByPolicyId(10L)).thenReturn(new BigDecimal("4000.00"));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> paymentService.recordPayment(10L, request));
        assertTrue(ex.getMessage().contains("exceeds remaining policy balance"));
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void recordPayment_RejectsNonPositiveAmount() {
        PaymentCreateRequest request = new PaymentCreateRequest(
                new BigDecimal("0.00"),
                "DEMO-REF-003",
                "DEMO",
                "Zero amount"
        );

        when(policyRepository.findById(10L)).thenReturn(Optional.of(policy));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> paymentService.recordPayment(10L, request));
        assertTrue(ex.getMessage().contains("greater than zero"));
        verify(paymentRepository, never()).save(any());
    }
}

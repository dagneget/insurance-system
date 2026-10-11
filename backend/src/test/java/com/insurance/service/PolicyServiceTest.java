package com.insurance.service;

import com.insurance.dto.PolicyCreateRequest;
import com.insurance.dto.PolicyDto;
import com.insurance.entity.Customer;
import com.insurance.entity.Policy;
import com.insurance.entity.PolicyStatus;
import com.insurance.entity.Vehicle;
import com.insurance.exception.BusinessRuleException;
import com.insurance.repository.CustomerRepository;
import com.insurance.repository.PaymentRepository;
import com.insurance.repository.PolicyRepository;
import com.insurance.repository.VehicleRepository;
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
class PolicyServiceTest {

    @Mock
    private PolicyRepository policyRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PolicyService policyService;

    private Customer customer1;
    private Customer customer2;
    private Vehicle vehicle1;

    @BeforeEach
    void setUp() {
        customer1 = new Customer("Customer One", "+251911111111", "c1@test.com");
        customer1.setId(1L);

        customer2 = new Customer("Customer Two", "+251922222222", "c2@test.com");
        customer2.setId(2L);

        vehicle1 = new Vehicle(customer1, "3-A12345", "Toyota", "Corolla", 2021);
        vehicle1.setId(10L);
    }

    @Test
    void createPolicy_Success() {
        PolicyCreateRequest request = new PolicyCreateRequest(
                1L, 10L, "Comprehensive",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("5000.00"), PolicyStatus.ISSUED
        );

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer1));
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(vehicle1));
        when(policyRepository.save(any(Policy.class))).thenAnswer(invocation -> {
            Policy p = invocation.getArgument(0);
            p.setId(100L);
            return p;
        });
        when(paymentRepository.sumSuccessfulPaymentsByPolicyId(any())).thenReturn(BigDecimal.ZERO);

        PolicyDto result = policyService.createPolicy(request);

        assertNotNull(result);
        assertEquals("5000.00", result.getPremium().toString());
        assertEquals("5000.00", result.getOutstandingBalance().toString());
        assertEquals(PolicyStatus.ISSUED, result.getStatus());
        verify(policyRepository).save(any(Policy.class));
    }

    @Test
    void createPolicy_RejectsVehicleBelongingToDifferentCustomer() {
        // Vehicle belongs to customer 1, but request is for customer 2
        PolicyCreateRequest request = new PolicyCreateRequest(
                2L, 10L, "Comprehensive",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("5000.00"), PolicyStatus.ISSUED
        );

        when(customerRepository.findById(2L)).thenReturn(Optional.of(customer2));
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(vehicle1));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> policyService.createPolicy(request));
        assertTrue(ex.getMessage().contains("does not belong to customer"));
        verify(policyRepository, never()).save(any());
    }

    @Test
    void createPolicy_RejectsEndDateBeforeStartDate() {
        PolicyCreateRequest request = new PolicyCreateRequest(
                1L, 10L, "Comprehensive",
                LocalDate.of(2026, 12, 31), LocalDate.of(2026, 1, 1),
                new BigDecimal("5000.00"), PolicyStatus.ISSUED
        );

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer1));
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(vehicle1));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> policyService.createPolicy(request));
        assertTrue(ex.getMessage().contains("must not be before start date"));
        verify(policyRepository, never()).save(any());
    }
}

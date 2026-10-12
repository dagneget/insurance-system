package com.insurance.service;

import com.insurance.dto.*;
import com.insurance.entity.*;
import com.insurance.exception.BusinessRuleException;
import com.insurance.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
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

    @Mock
    private EndorsementRepository endorsementRepository;

    @Mock
    private TariffRepository tariffRepository;

    @Mock
    private UnderwriterAuthorityRepository authorityRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BillingScheduleRepository billingScheduleRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PolicyService policyService;

    private Customer customer1;
    private Customer customer2;
    private Vehicle vehicle1;
    private Policy policy1;

    @BeforeEach
    void setUp() {
        customer1 = new Customer("Customer One", "+251911111111", "c1@test.com");
        customer1.setId(1L);

        customer2 = new Customer("Customer Two", "+251922222222", "c2@test.com");
        customer2.setId(2L);

        vehicle1 = new Vehicle(customer1, "3-A12345", "Toyota", "Corolla", 2021);
        vehicle1.setId(10L);

        policy1 = new Policy("POL-2026-1001", customer1, vehicle1, "Comprehensive Motor Insurance",
                "COMPREHENSIVE", new BigDecimal("500.00"),
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("5000.00"), PolicyStatus.ISSUED);
        policy1.setId(100L);
    }

    @Test
    void createPolicy_Success() {
        PolicyCreateRequest request = new PolicyCreateRequest(
                1L, 10L, "Comprehensive", "COMPREHENSIVE", new BigDecimal("500.00"),
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
        assertEquals("COMPREHENSIVE", result.getProductCode());
        verify(policyRepository).save(any(Policy.class));
    }

    @Test
    void createPolicy_RejectsVehicleBelongingToDifferentCustomer() {
        PolicyCreateRequest request = new PolicyCreateRequest(
                2L, 10L, "Comprehensive", "COMPREHENSIVE", new BigDecimal("500.00"),
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
                1L, 10L, "Comprehensive", "COMPREHENSIVE", new BigDecimal("500.00"),
                LocalDate.of(2026, 12, 31), LocalDate.of(2026, 1, 1),
                new BigDecimal("5000.00"), PolicyStatus.ISSUED
        );

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer1));
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(vehicle1));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> policyService.createPolicy(request));
        assertTrue(ex.getMessage().contains("must not be before start date"));
        verify(policyRepository, never()).save(any());
    }

    @Test
    void calculateQuote_Comprehensive() {
        QuoteCalculationRequest req = new QuoteCalculationRequest(10L, "COMPREHENSIVE", null);
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(vehicle1));

        QuoteCalculationDto quote = policyService.calculateQuote(req);

        assertNotNull(quote);
        assertEquals("COMPREHENSIVE", quote.getProductCode());
        assertEquals(new BigDecimal("6500.00"), quote.getBasePremium());
        assertEquals(new BigDecimal("500.00"), quote.getDeductibleAmount());
        assertTrue(quote.getTotalPremium().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void calculateQuote_ThirdParty() {
        QuoteCalculationRequest req = new QuoteCalculationRequest(10L, "THIRD_PARTY", null);
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(vehicle1));

        QuoteCalculationDto quote = policyService.calculateQuote(req);

        assertNotNull(quote);
        assertEquals("THIRD_PARTY", quote.getProductCode());
        assertEquals(new BigDecimal("2500.00"), quote.getBasePremium());
        assertEquals(BigDecimal.ZERO, quote.getDeductibleAmount());
    }

    @Test
    void renewPolicy_Success() {
        PolicyRenewalRequest req = new PolicyRenewalRequest(
                LocalDate.of(2027, 1, 1), LocalDate.of(2027, 12, 31),
                new BigDecimal("5200.00"), "Renewed Comprehensive", new BigDecimal("500.00")
        );

        when(policyRepository.findById(100L)).thenReturn(Optional.of(policy1));
        when(policyRepository.search(null, null)).thenReturn(List.of(policy1));
        when(policyRepository.save(any(Policy.class))).thenAnswer(invocation -> {
            Policy p = invocation.getArgument(0);
            if (p.getId() == null) {
                p.setId(200L);
            }
            return p;
        });

        PolicyDto renewed = policyService.renewPolicy(100L, req);

        assertNotNull(renewed);
        assertEquals(PolicyStatus.RENEWED, policy1.getStatus());
        assertEquals(PolicyStatus.ISSUED, renewed.getStatus());
        assertEquals(100L, renewed.getRenewedFromId());
        verify(policyRepository, times(2)).save(any(Policy.class));
    }

    @Test
    void cancelPolicy_Success() {
        PolicyCancelRequest req = new PolicyCancelRequest("Customer sold the insured vehicle");
        when(policyRepository.findById(100L)).thenReturn(Optional.of(policy1));
        when(policyRepository.save(any(Policy.class))).thenReturn(policy1);

        PolicyDto cancelled = policyService.cancelPolicy(100L, req);

        assertEquals(PolicyStatus.CANCELLED, cancelled.getStatus());
        assertEquals("Customer sold the insured vehicle", cancelled.getCancellationReason());
        assertNotNull(cancelled.getCancelledAt());
    }

    @Test
    void addEndorsement_Success() {
        EndorsementCreateRequest req = new EndorsementCreateRequest(
                "VEHICLE_AMENDMENT", "License plate update", "Updated plate from 3-A12345 to 3-A99999", LocalDate.now()
        );

        when(policyRepository.findById(100L)).thenReturn(Optional.of(policy1));
        when(endorsementRepository.save(any(Endorsement.class))).thenAnswer(invocation -> {
            Endorsement e = invocation.getArgument(0);
            e.setId(50L);
            return e;
        });

        EndorsementDto dto = policyService.addEndorsement(100L, req);

        assertNotNull(dto);
        assertEquals("VEHICLE_AMENDMENT", dto.getEndorsementType());
        assertEquals("License plate update", dto.getReason());
        assertNotNull(dto.getEndorsementNumber());
        verify(endorsementRepository).save(any(Endorsement.class));
    }

    @Test
    void approvePolicy_Success() {
        policy1.setStatus(PolicyStatus.DRAFT);
        when(policyRepository.findById(100L)).thenReturn(Optional.of(policy1));
        when(policyRepository.save(any(Policy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PolicyDto dto = policyService.approvePolicy(100L);

        assertNotNull(dto);
        assertEquals(PolicyStatus.ISSUED, dto.getStatus());
        verify(policyRepository).save(policy1);
    }

    @Test
    void approvePolicy_AlreadyIssued_Throws() {
        policy1.setStatus(PolicyStatus.ISSUED);
        when(policyRepository.findById(100L)).thenReturn(Optional.of(policy1));

        assertThrows(BusinessRuleException.class, () -> policyService.approvePolicy(100L));
        verify(policyRepository, never()).save(any(Policy.class));
    }

    @Test
    void createPolicy_ExceedsUnderwriterSumInsured_TriggersReferral() {
        PolicyCreateRequest req = new PolicyCreateRequest(
                1L, 10L, "Comprehensive High Value",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
                new BigDecimal("8000.00"), PolicyStatus.ISSUED
        );
        req.setVehicleMarketValue(new BigDecimal("120000.00"));

        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer1));
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(vehicle1));

        User uwUser = new User("junior.uw", "hash", "Junior UW", "jr@demo.com", null);
        uwUser.setId(50L);
        UnderwriterAuthority authority = new UnderwriterAuthority(
                uwUser, new BigDecimal("50000.00"), new BigDecimal("0.2000"), new BigDecimal("0.1500"), false
        );

        when(userRepository.findByUsername("junior.uw")).thenReturn(Optional.of(uwUser));
        when(authorityRepository.findByUserId(50L)).thenReturn(Optional.of(authority));
        when(policyRepository.save(any(Policy.class))).thenAnswer(inv -> inv.getArgument(0));

        PolicyDto result = policyService.createPolicy(req, "junior.uw");

        assertNotNull(result);
        assertTrue(result.getReferralFlag());
        assertEquals(PolicyStatus.QUOTED, result.getStatus());
        assertTrue(result.getReferralReason().contains("exceeds underwriter authority"));
        verify(billingScheduleRepository).saveAll(any());
        verify(auditLogService).recordAction(eq("junior.uw"), eq("ROLE_UNDERWRITER"), eq("POLICY_SUBMITTED_FOR_REFERRAL"), eq("Policy"), any(), any(), any(), any());
    }

    @Test
    void approveReferral_AuthorizedUnderwriter_Success() {
        policy1.setReferralFlag(true);
        policy1.setStatus(PolicyStatus.QUOTED);

        User leadUw = new User("alexander.uw", "hash", "Alexander Reed", "alex@uw.com", null);
        leadUw.setId(3L);
        UnderwriterAuthority authority = new UnderwriterAuthority(
                leadUw, new BigDecimal("150000.00"), new BigDecimal("0.3000"), new BigDecimal("0.2000"), true
        );

        when(policyRepository.findById(100L)).thenReturn(Optional.of(policy1));
        when(userRepository.findByUsername("alexander.uw")).thenReturn(Optional.of(leadUw));
        when(authorityRepository.findByUserId(3L)).thenReturn(Optional.of(authority));
        when(policyRepository.save(any(Policy.class))).thenAnswer(inv -> inv.getArgument(0));

        PolicyDto result = policyService.approveReferral(100L, "Tracker required within 14 days", "alexander.uw");

        assertNotNull(result);
        assertFalse(result.getReferralFlag());
        assertEquals(PolicyStatus.ISSUED, result.getStatus());
        assertTrue(result.getUnderwritingSubjectivities().contains("Tracker required"));
        verify(auditLogService).recordAction(eq("alexander.uw"), eq("ROLE_UNDERWRITER"), eq("REFERRAL_APPROVED"), eq("Policy"), eq(100L), any(), any(), any());
    }

    @Test
    void approveReferral_UnauthorizedUnderwriter_Throws() {
        policy1.setReferralFlag(true);
        policy1.setStatus(PolicyStatus.QUOTED);

        User juniorUw = new User("junior.uw", "hash", "Junior UW", "jr@uw.com", null);
        juniorUw.setId(4L);
        UnderwriterAuthority authority = new UnderwriterAuthority(
                juniorUw, new BigDecimal("50000.00"), new BigDecimal("0.1000"), new BigDecimal("0.1000"), false
        );

        when(policyRepository.findById(100L)).thenReturn(Optional.of(policy1));
        when(userRepository.findByUsername("junior.uw")).thenReturn(Optional.of(juniorUw));
        when(authorityRepository.findByUserId(4L)).thenReturn(Optional.of(authority));

        assertThrows(BusinessRuleException.class, () ->
                policyService.approveReferral(100L, "Approved", "junior.uw")
        );
        verify(policyRepository, never()).save(policy1);
    }

    @Test
    void getCommissionStatement_CalculatesAccurately() {
        User agent = new User("david.agent", "hash", "David Kim", "david@agent.com", null);
        agent.setId(5L);

        policy1.setPremium(new BigDecimal("3000.00"));
        policy1.setStatus(PolicyStatus.ISSUED);
        policy1.setProductCode("COMPREHENSIVE");

        Tariff compTariff = new Tariff("COMPREHENSIVE", "Comprehensive Cover", new BigDecimal("0.0450"),
                new BigDecimal("2500.00"), new BigDecimal("0.1500"), new BigDecimal("500.00"),
                new BigDecimal("0.3000"), new BigDecimal("0.2000"), new BigDecimal("0.1000"));

        when(userRepository.findById(5L)).thenReturn(Optional.of(agent));
        when(policyRepository.findByAgentIdOrderByIdDesc(5L)).thenReturn(List.of(policy1));
        when(tariffRepository.findAll()).thenReturn(List.of(compTariff));

        CommissionStatementDto statement = policyService.getCommissionStatement(5L);

        assertNotNull(statement);
        assertEquals(5L, statement.getAgentId());
        assertEquals("David Kim", statement.getAgentName());
        assertEquals(1, statement.getTotalPoliciesCount());
        assertEquals(new BigDecimal("3000.00"), statement.getTotalGrossPremium());
        // 10% commission on 3000.00 = 300.00
        assertEquals(new BigDecimal("300.00"), statement.getTotalCommissionEarned());
        assertEquals(1, statement.getLineItems().size());
        assertEquals("EARNED", statement.getLineItems().get(0).getPayoutStatus());
    }

    @Test
    void sendRenewalReminder_DispatchesNotificationAndLogsAudit() {
        when(policyRepository.findById(100L)).thenReturn(Optional.of(policy1));

        policyService.sendRenewalReminder(100L, "david.agent");

        verify(notificationService).sendCustomerNotification(
                eq(1L), contains("Renewal Notice"), contains(policy1.getPolicyNumber()), eq("INFO"), any()
        );
        verify(auditLogService).recordAction(
                eq("david.agent"), eq("ROLE_AGENT"), eq("RENEWAL_REMINDER_SENT"), eq("Policy"), eq(100L), any(), any(), any()
        );
    }

    @Test
    void sendPaymentReminder_DispatchesNotificationAndLogsAudit() {
        when(policyRepository.findById(100L)).thenReturn(Optional.of(policy1));

        policyService.sendPaymentReminder(100L, "david.agent");

        verify(notificationService).sendCustomerNotification(
                eq(1L), contains("Payment Reminder"), contains(policy1.getPolicyNumber()), eq("WARNING"), any()
        );
        verify(auditLogService).recordAction(
                eq("david.agent"), eq("ROLE_AGENT"), eq("PAYMENT_REMINDER_SENT"), eq("Policy"), eq(100L), any(), any(), any()
        );
    }
}

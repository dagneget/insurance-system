package com.insurance.service;

import com.insurance.dto.*;
import com.insurance.entity.*;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private PolicyRepository policyRepository;
    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ClaimRepository claimRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PolicyService policyService;
    @Mock
    private VehicleService vehicleService;
    @Mock
    private PaymentService paymentService;
    @Mock
    private ClaimService claimService;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private NotificationService notificationService;

    private CustomerService customerService;

    @BeforeEach
    void setUp() {
        customerService = new CustomerService(
                customerRepository,
                policyRepository,
                vehicleRepository,
                paymentRepository,
                claimRepository,
                userRepository,
                policyService,
                vehicleService,
                paymentService,
                claimService,
                auditLogService,
                notificationService
        );
    }

    @Test
    @DisplayName("createCustomer saves new customer with KYC and logs audit")
    void createCustomer_success() {
        CustomerCreateRequest request = new CustomerCreateRequest("Abebe Bikila", "+251911223344", "abebe@example.com");
        request.setKycStatus("PENDING");

        Customer savedCustomer = new Customer("Abebe Bikila", "+251911223344", "abebe@example.com");
        savedCustomer.setId(10L);
        savedCustomer.setKycStatus("PENDING");

        when(customerRepository.save(any(Customer.class))).thenReturn(savedCustomer);

        CustomerDto dto = customerService.createCustomer(request, "david.agent");

        assertNotNull(dto);
        assertEquals(10L, dto.getId());
        assertEquals("Abebe Bikila", dto.getFullName());
        assertEquals("PENDING", dto.getKycStatus());

        verify(auditLogService).recordAction(
                eq("david.agent"),
                eq("ROLE_AGENT"),
                eq("CUSTOMER_CREATED"),
                eq("Customer"),
                eq(10L),
                isNull(),
                any(),
                isNull()
        );
    }

    @Test
    @DisplayName("createCustomer assigns agent by agentId if specified")
    void createCustomer_withAgentId() {
        CustomerCreateRequest request = new CustomerCreateRequest("Fleet Client", "+251922334455", "fleet@example.com");
        request.setAgentId(5L);

        User agent = new User("david.agent", "pass", "David Kim", "david@example.com", null);
        agent.setId(5L);
        agent.getRoles().add("ROLE_AGENT");

        when(userRepository.findById(5L)).thenReturn(Optional.of(agent));

        Customer savedCustomer = new Customer("Fleet Client", "+251922334455", "fleet@example.com");
        savedCustomer.setId(11L);
        savedCustomer.setAgent(agent);

        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer c = invocation.getArgument(0);
            c.setId(11L);
            return c;
        });

        CustomerDto dto = customerService.createCustomer(request, "david.agent");

        assertNotNull(dto);
        assertEquals(5L, dto.getAgentId());
        assertEquals("David Kim", dto.getAgentName());
    }

    @Test
    @DisplayName("onboardClient registers client and initial vehicle, logs audit, and sends notification")
    void onboardClient_withInitialVehicle_success() {
        ClientOnboardingRequest request = new ClientOnboardingRequest();
        request.setFullName("Chala Tadesse");
        request.setPhone("+251911998877");
        request.setEmail("chala@example.com");
        request.setKycStatus("VERIFIED");
        request.setRegistrationNumber("AA-3-99887");
        request.setMake("Toyota");
        request.setModel("Hilux");
        request.setManufactureYear(2022);

        User agent = new User("david.agent", "pass", "David Kim", "david@example.com", null);
        agent.setId(3L);
        agent.getRoles().add("ROLE_AGENT");
        when(userRepository.findByUsername("david.agent")).thenReturn(Optional.of(agent));

        Customer savedCustomer = new Customer("Chala Tadesse", "+251911998877", "chala@example.com");
        savedCustomer.setId(20L);
        savedCustomer.setAgent(agent);
        savedCustomer.setKycStatus("VERIFIED");

        when(customerRepository.save(any(Customer.class))).thenReturn(savedCustomer);
        when(vehicleRepository.existsByRegistrationNumber("AA-3-99887")).thenReturn(false);

        Vehicle savedVehicle = new Vehicle(savedCustomer, "AA-3-99887", "Toyota", "Hilux", 2022);
        savedVehicle.setId(100L);
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(savedVehicle);

        VehicleDto vDto = new VehicleDto(100L, 20L, "Chala Tadesse", "AA-3-99887", "Toyota", "Hilux", 2022, OffsetDateTime.now());
        when(vehicleService.toDto(savedVehicle)).thenReturn(vDto);

        ClientOnboardingResponseDto response = customerService.onboardClient(request, "david.agent");

        assertNotNull(response);
        assertEquals(20L, response.getCustomer().getId());
        assertEquals("AA-3-99887", response.getVehicle().getRegistrationNumber());
        assertTrue(response.getMessage().contains("onboarded successfully"));

        verify(notificationService).sendCustomerNotification(
                eq(20L),
                eq("Welcome to SafeMotor Portal"),
                contains("David Kim"),
                eq("SUCCESS"),
                eq("/customers/20")
        );

        verify(auditLogService).recordAction(
                eq("david.agent"),
                eq("ROLE_AGENT"),
                eq("CLIENT_ONBOARDED_BY_AGENT"),
                eq("Customer"),
                eq(20L),
                isNull(),
                any(),
                isNull()
        );
    }

    @Test
    @DisplayName("onboardClient throws exception if vehicle plate already exists")
    void onboardClient_duplicateVehicle_throwsException() {
        ClientOnboardingRequest request = new ClientOnboardingRequest();
        request.setFullName("Dup Client");
        request.setPhone("+251911111111");
        request.setRegistrationNumber("ET-DUP-001");

        Customer customer = new Customer("Dup Client", "+251911111111", null);
        customer.setId(25L);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        when(vehicleRepository.existsByRegistrationNumber("ET-DUP-001")).thenReturn(true);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                customerService.onboardClient(request, "david.agent"));

        assertTrue(ex.getMessage().contains("already registered"));
        verify(vehicleRepository, never()).save(any(Vehicle.class));
    }

    @Test
    @DisplayName("onboardClient throws exception if vehicle year is invalid")
    void onboardClient_invalidYear_throwsException() {
        ClientOnboardingRequest request = new ClientOnboardingRequest();
        request.setFullName("Old Car Owner");
        request.setPhone("+251911111112");
        request.setRegistrationNumber("ET-OLD-001");
        request.setManufactureYear(1975); // < 1980

        Customer customer = new Customer("Old Car Owner", "+251911111112", null);
        customer.setId(26L);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        when(vehicleRepository.existsByRegistrationNumber("ET-OLD-001")).thenReturn(false);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                customerService.onboardClient(request, "david.agent"));

        assertTrue(ex.getMessage().contains("Manufacture year must be between 1980"));
    }

    @Test
    @DisplayName("updateCustomer updates contact profile and logs state diff")
    void updateCustomer_success() {
        Customer customer = new Customer("Abebe Bikila", "+251911000000", "old@example.com");
        customer.setId(30L);

        when(customerRepository.findById(30L)).thenReturn(Optional.of(customer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerCreateRequest updateReq = new CustomerCreateRequest("Abebe Bikila", "+251911888888", "new@example.com");

        CustomerDto updated = customerService.updateCustomer(30L, updateReq, "abebe.user");

        assertNotNull(updated);
        assertEquals("+251911888888", updated.getPhone());
        assertEquals("new@example.com", updated.getEmail());

        verify(auditLogService).recordAction(
                eq("abebe.user"),
                eq("ROLE_CUSTOMER"),
                eq("CUSTOMER_PROFILE_UPDATED"),
                eq("Customer"),
                eq(30L),
                argThat(obj -> obj instanceof Map && "+251911000000".equals(((Map<?, ?>) obj).get("phone"))),
                argThat(obj -> obj instanceof Map && "+251911888888".equals(((Map<?, ?>) obj).get("phone"))),
                isNull()
        );
    }

    @Test
    @DisplayName("updateCustomer throws ResourceNotFoundException if customer does not exist")
    void updateCustomer_notFound_throwsException() {
        when(customerRepository.findById(999L)).thenReturn(Optional.empty());

        CustomerCreateRequest updateReq = new CustomerCreateRequest("Nobody", "+251911000000", null);

        assertThrows(ResourceNotFoundException.class, () ->
                customerService.updateCustomer(999L, updateReq, "admin"));
    }

    @Test
    @DisplayName("updateKycStatus transitions KYC state, records audit log, and notifies customer")
    void updateKycStatus_success() {
        Customer customer = new Customer("Kyc Client", "+251911000000", "kyc@example.com");
        customer.setId(40L);
        customer.setKycStatus("PENDING");

        when(customerRepository.findById(40L)).thenReturn(Optional.of(customer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerDto result = customerService.updateKycStatus(40L, "VERIFIED", "DRIVING_LICENSE", "alexander.lead");

        assertEquals("VERIFIED", result.getKycStatus());

        verify(auditLogService).recordAction(
                eq("alexander.lead"),
                eq("ROLE_CUSTOMER"),
                eq("CUSTOMER_KYC_UPDATED"),
                eq("Customer"),
                eq(40L),
                argThat(obj -> obj instanceof Map && "PENDING".equals(((Map<?, ?>) obj).get("kycStatus"))),
                argThat(obj -> obj instanceof Map && "VERIFIED".equals(((Map<?, ?>) obj).get("kycStatus")) && "DRIVING_LICENSE".equals(((Map<?, ?>) obj).get("documentType"))),
                isNull()
        );

        verify(notificationService).sendCustomerNotification(
                eq(40L),
                eq("KYC Document Status Updated"),
                contains("VERIFIED"),
                eq("INFO"),
                eq("/customers/40")
        );
    }

    @Test
    @DisplayName("getDirectory calculates summary counts, balances, and open claims")
    void getDirectory_calculatesSummaryCorrectly() {
        Customer customer = new Customer("Fleet Corp", "+251911555555", "fleet@corp.et");
        customer.setId(50L);

        when(customerRepository.search(any())).thenReturn(List.of(customer));

        Policy policy1 = new Policy();
        policy1.setId(101L);
        policy1.setStatus(PolicyStatus.ISSUED);
        policy1.setPremium(new BigDecimal("15000.00"));

        when(policyRepository.findByCustomerIdOrderByIdDesc(50L)).thenReturn(List.of(policy1));
        when(paymentRepository.sumSuccessfulPaymentsByPolicyId(101L)).thenReturn(new BigDecimal("10000.00"));

        Claim claim = new Claim();
        claim.setStatus(ClaimStatus.SUBMITTED);
        when(claimRepository.findByCustomerIdWithDetails(50L)).thenReturn(List.of(claim));

        List<CustomerDirectoryItemDto> directory = customerService.getDirectory(null);

        assertEquals(1, directory.size());
        CustomerDirectoryItemDto item = directory.get(0);
        assertEquals(50L, item.getId());
        assertEquals(1, item.getTotalPoliciesCount());
        assertEquals(1, item.getActivePoliciesCount());
        assertEquals(new BigDecimal("15000.00"), item.getTotalPremium());
        assertEquals(new BigDecimal("10000.00"), item.getTotalPaid());
        assertEquals(new BigDecimal("5000.00"), item.getOutstandingBalance());
        assertEquals(1, item.getOpenClaimsCount());
    }
}

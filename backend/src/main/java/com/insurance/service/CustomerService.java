package com.insurance.service;

import com.insurance.dto.*;
import com.insurance.entity.*;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final PolicyRepository policyRepository;
    private final VehicleRepository vehicleRepository;
    private final PaymentRepository paymentRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final PolicyService policyService;
    private final VehicleService vehicleService;
    private final PaymentService paymentService;
    private final ClaimService claimService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final AuthService authService;

    public CustomerService(CustomerRepository customerRepository,
                           PolicyRepository policyRepository,
                           VehicleRepository vehicleRepository,
                           PaymentRepository paymentRepository,
                           ClaimRepository claimRepository,
                           UserRepository userRepository,
                           PolicyService policyService,
                           VehicleService vehicleService,
                           PaymentService paymentService,
                           ClaimService claimService,
                           AuditLogService auditLogService,
                           NotificationService notificationService,
                           AuthService authService) {
        this.customerRepository = customerRepository;
        this.policyRepository = policyRepository;
        this.vehicleRepository = vehicleRepository;
        this.paymentRepository = paymentRepository;
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.policyService = policyService;
        this.vehicleService = vehicleService;
        this.paymentService = paymentService;
        this.claimService = claimService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> getCustomers(String search) {
        List<Customer> customers = customerRepository.search(search);
        return customers.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> getCustomersByAgent(Long agentId) {
        List<Customer> customers = customerRepository.findByAgentIdOrderByIdDesc(agentId);
        return customers.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CustomerDirectoryItemDto> getDirectory(String search) {
        List<Customer> customers = customerRepository.search(search);
        List<CustomerDirectoryItemDto> directory = new ArrayList<>();

        for (Customer c : customers) {
            int vehicleCount = c.getVehicles() != null ? c.getVehicles().size() : 0;
            List<Policy> policies = policyRepository.findByCustomerIdOrderByIdDesc(c.getId());

            int totalPolicies = policies.size();
            int activePolicies = 0;
            BigDecimal totalPremium = BigDecimal.ZERO;
            BigDecimal totalPaid = BigDecimal.ZERO;
            BigDecimal outstandingBalance = BigDecimal.ZERO;

            for (Policy p : policies) {
                if (p.getStatus() == PolicyStatus.ISSUED) {
                    activePolicies++;
                }
                if (p.getPremium() != null) {
                    totalPremium = totalPremium.add(p.getPremium());
                }
                BigDecimal paidForPolicy = paymentRepository.sumSuccessfulPaymentsByPolicyId(p.getId());
                if (paidForPolicy != null) {
                    totalPaid = totalPaid.add(paidForPolicy);
                    if (p.getStatus() == PolicyStatus.ISSUED) {
                        BigDecimal policyBal = p.getPremium().subtract(paidForPolicy);
                        if (policyBal.compareTo(BigDecimal.ZERO) > 0) {
                            outstandingBalance = outstandingBalance.add(policyBal);
                        }
                    }
                } else if (p.getStatus() == PolicyStatus.ISSUED && p.getPremium() != null) {
                    outstandingBalance = outstandingBalance.add(p.getPremium());
                }
            }

            List<Claim> claims = claimRepository.findByCustomerIdWithDetails(c.getId());
            int openClaims = (int) claims.stream()
                    .filter(cl -> cl.getStatus() == ClaimStatus.SUBMITTED ||
                                  cl.getStatus() == ClaimStatus.UNDER_REVIEW ||
                                  cl.getStatus() == ClaimStatus.APPROVED)
                    .count();

            directory.add(new CustomerDirectoryItemDto(
                    c.getId(),
                    c.getFullName(),
                    c.getPhone(),
                    c.getEmail(),
                    vehicleCount,
                    totalPolicies,
                    activePolicies,
                    totalPremium,
                    totalPaid,
                    outstandingBalance,
                    openClaims,
                    c.getCreatedAt()
            ));
        }

        return directory;
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return toDto(customer);
    }

    @Transactional(readOnly = true)
    public CustomerDashboardDto getCustomerDashboard(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        CustomerDto customerDto = toDto(customer);

        List<PolicyDto> policies = policyRepository.findByCustomerIdOrderByIdDesc(id).stream()
                .map(policyService::toDto)
                .collect(Collectors.toList());

        List<VehicleDto> vehicles = vehicleRepository.findByCustomerIdOrderByIdDesc(id).stream()
                .map(vehicleService::toDto)
                .collect(Collectors.toList());

        List<PaymentDto> payments = paymentRepository.findByCustomerIdWithDetails(id).stream()
                .map(paymentService::toDto)
                .collect(Collectors.toList());

        List<ClaimDto> claims = claimRepository.findByCustomerIdWithDetails(id).stream()
                .map(claimService::toDto)
                .collect(Collectors.toList());

        int totalPolicies = policies.size();
        int activePolicies = (int) policies.stream()
                .filter(p -> p.getStatus() == PolicyStatus.ISSUED)
                .count();
        int totalVehicles = vehicles.size();

        BigDecimal totalPremium = policies.stream()
                .map(PolicyDto::getPremium)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCESS)
                .map(PaymentDto::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstandingBalance = policies.stream()
                .filter(p -> p.getStatus() == PolicyStatus.ISSUED)
                .map(PolicyDto::getOutstandingBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int openClaimsCount = (int) claims.stream()
                .filter(c -> c.getStatus() == ClaimStatus.SUBMITTED ||
                             c.getStatus() == ClaimStatus.UNDER_REVIEW ||
                             c.getStatus() == ClaimStatus.APPROVED)
                .count();

        CustomerDashboardDto.CustomerMetrics metrics = new CustomerDashboardDto.CustomerMetrics(
                totalPolicies,
                activePolicies,
                totalVehicles,
                totalPremium,
                totalPaid,
                outstandingBalance,
                openClaimsCount
        );

        return new CustomerDashboardDto(
                customerDto,
                metrics,
                policies,
                vehicles,
                payments,
                claims
        );
    }

    @Transactional
    public CustomerDto createCustomer(CustomerCreateRequest request) {
        return createCustomer(request, null);
    }

    @Transactional
    public CustomerDto createCustomer(CustomerCreateRequest request, String actorUsername) {
        Customer customer = new Customer(
                request.getFullName().trim(),
                request.getPhone().trim(),
                request.getEmail() != null ? request.getEmail().trim() : null
        );

        if (request.getKycStatus() != null && !request.getKycStatus().isBlank()) {
            customer.setKycStatus(request.getKycStatus().trim().toUpperCase());
        }

        if (request.getAgentId() != null) {
            userRepository.findById(request.getAgentId()).ifPresent(customer::setAgent);
        } else if (actorUsername != null) {
            userRepository.findByUsername(actorUsername).ifPresent(u -> {
                if (u.getRoles().contains("ROLE_AGENT")) {
                    customer.setAgent(u);
                }
            });
        }

        Customer saved = customerRepository.save(customer);

        // Auto-provision policyholder login account so client can immediately authenticate
        User portalUser = provisionCustomerUser(saved);

        auditLogService.recordAction(
                actorUsername != null ? actorUsername : "SYSTEM",
                "ROLE_AGENT",
                "CUSTOMER_CREATED",
                "Customer",
                saved.getId(),
                null,
                Map.of(
                        "fullName", saved.getFullName(),
                        "phone", saved.getPhone(),
                        "kycStatus", saved.getKycStatus(),
                        "loginUsername", portalUser.getUsername()
                ),
                null
        );

        CustomerDto dto = toDto(saved);
        dto.setLoginUsername(portalUser.getUsername());
        dto.setTemporaryPassword("password123");
        return dto;
    }

    @Transactional
    public ClientOnboardingResponseDto onboardClient(ClientOnboardingRequest request, String agentUsername) {
        // 1. Create and save customer
        Customer customer = new Customer(
                request.getFullName().trim(),
                request.getPhone().trim(),
                request.getEmail() != null ? request.getEmail().trim() : null
        );

        String kyc = request.getKycStatus() != null && !request.getKycStatus().isBlank()
                ? request.getKycStatus().trim().toUpperCase() : "VERIFIED";
        customer.setKycStatus(kyc);

        User agent = null;
        if (agentUsername != null) {
            agent = userRepository.findByUsername(agentUsername).orElse(null);
            if (agent != null) {
                customer.setAgent(agent);
            }
        }

        Customer savedCustomer = customerRepository.save(customer);

        // 2. Register initial vehicle if provided
        Vehicle savedVehicle = null;
        if (request.getRegistrationNumber() != null && !request.getRegistrationNumber().isBlank()) {
            String regNumber = request.getRegistrationNumber().trim().toUpperCase();
            if (vehicleRepository.existsByRegistrationNumber(regNumber)) {
                throw new BusinessRuleException("A vehicle with registration plate '" + regNumber + "' is already registered.");
            }

            int currentYear = LocalDate.now().getYear();
            int year = request.getManufactureYear() != null ? request.getManufactureYear() : currentYear;
            if (year < 1980 || year > currentYear + 1) {
                throw new BusinessRuleException("Manufacture year must be between 1980 and " + (currentYear + 1));
            }

            Vehicle vehicle = new Vehicle(
                    savedCustomer,
                    regNumber,
                    request.getMake() != null && !request.getMake().isBlank() ? request.getMake().trim() : "Standard Make",
                    request.getModel() != null && !request.getModel().isBlank() ? request.getModel().trim() : "Standard Model",
                    year
            );
            savedVehicle = vehicleRepository.save(vehicle);
        }

        // 3. Auto-provision policyholder login account in app_users
        User portalUser = provisionCustomerUser(savedCustomer);
        String finalUsername = portalUser.getUsername();
        String tempPassword = "password123";

        // 4. Immutable audit trail
        auditLogService.recordAction(
                agentUsername != null ? agentUsername : "david.agent",
                "ROLE_AGENT",
                "CLIENT_ONBOARDED_BY_AGENT",
                "Customer",
                savedCustomer.getId(),
                null,
                Map.of(
                        "customerName", savedCustomer.getFullName(),
                        "phone", savedCustomer.getPhone(),
                        "vehiclePlate", savedVehicle != null ? savedVehicle.getRegistrationNumber() : "NONE",
                        "agent", agent != null ? agent.getUsername() : "UNASSIGNED",
                        "loginUsername", finalUsername
                ),
                null
        );

        CustomerDto customerDto = toDto(savedCustomer);
        customerDto.setLoginUsername(finalUsername);
        customerDto.setTemporaryPassword(tempPassword);
        VehicleDto vehicleDto = savedVehicle != null ? vehicleService.toDto(savedVehicle) : null;
        String msg = "Client " + savedCustomer.getFullName() + " onboarded successfully" +
                (savedVehicle != null ? " with initial vehicle " + savedVehicle.getRegistrationNumber() : "");

        return new ClientOnboardingResponseDto(customerDto, vehicleDto, msg, finalUsername, tempPassword);
    }

    public User provisionCustomerUser(Customer customer) {
        if (customer.getId() != null) {
            Optional<User> existing = userRepository.findByCustomerId(customer.getId());
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        String cleanName = customer.getFullName().trim().toLowerCase().replaceAll("[^a-z0-9]+", ".");
        cleanName = cleanName.replaceAll("\\.+", ".");
        if (cleanName.startsWith(".")) {
            cleanName = cleanName.substring(1);
        }
        if (cleanName.endsWith(".")) {
            cleanName = cleanName.substring(0, cleanName.length() - 1);
        }
        if (cleanName.isBlank()) {
            cleanName = "customer." + (customer.getId() != null ? customer.getId() : "user");
        }

        String baseUsername = cleanName + ".customer";
        String finalUsername = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(finalUsername)) {
            finalUsername = baseUsername + suffix++;
        }

        String tempPassword = "password123";
        String passHash = authService.hashPassword(tempPassword);
        User portalUser = new User(
                finalUsername,
                passHash,
                customer.getFullName(),
                customer.getEmail(),
                customer
        );
        portalUser.getRoles().add("ROLE_CUSTOMER");
        portalUser.setActive(true);
        User savedUser = userRepository.save(portalUser);

        // Welcome notification with credentials to customer
        notificationService.sendCustomerNotification(
                customer.getId(),
                "SafeMotor Portal Credentials Dispatched",
                "Welcome " + customer.getFullName() + "! Your policyholder portal account is active. Username: " +
                        finalUsername + " (or email: " + (customer.getEmail() != null ? customer.getEmail() : finalUsername) +
                        ") | Password: " + tempPassword + " (log in at /login).",
                "SUCCESS",
                "/dashboards/customer"
        );

        return savedUser;
    }

    @Transactional
    public CustomerDto updateCustomer(Long id, CustomerCreateRequest request, String actorUsername) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        Map<String, Object> oldSnapshot = Map.of(
                "fullName", customer.getFullName(),
                "phone", customer.getPhone(),
                "email", customer.getEmail() != null ? customer.getEmail() : ""
        );

        customer.setFullName(request.getFullName().trim());
        customer.setPhone(request.getPhone().trim());
        if (request.getEmail() != null) {
            customer.setEmail(request.getEmail().trim());
        }
        Customer saved = customerRepository.save(customer);

        auditLogService.recordAction(
                actorUsername != null ? actorUsername : "customer",
                "ROLE_CUSTOMER",
                "CUSTOMER_PROFILE_UPDATED",
                "Customer",
                saved.getId(),
                oldSnapshot,
                Map.of("fullName", saved.getFullName(), "phone", saved.getPhone(), "email", saved.getEmail() != null ? saved.getEmail() : ""),
                null
        );

        return toDto(saved);
    }

    @Transactional
    public CustomerDto updateKycStatus(Long id, String kycStatus, String documentType, String actorUsername) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        String oldKyc = customer.getKycStatus();
        customer.setKycStatus(kycStatus);
        Customer saved = customerRepository.save(customer);

        auditLogService.recordAction(
                actorUsername != null ? actorUsername : "customer",
                "ROLE_CUSTOMER",
                "CUSTOMER_KYC_UPDATED",
                "Customer",
                saved.getId(),
                Map.of("kycStatus", oldKyc),
                Map.of("kycStatus", kycStatus, "documentType", documentType != null ? documentType : "NATIONAL_ID"),
                null
        );

        notificationService.sendCustomerNotification(
                saved.getId(),
                "KYC Document Status Updated",
                "Your KYC document (" + (documentType != null ? documentType : "Identification") + ") is now " + kycStatus + ".",
                "INFO",
                "/customers/" + saved.getId()
        );

        return toDto(saved);
    }

    public CustomerDto toDto(Customer customer) {
        int vehicleCount = customer.getVehicles() != null ? customer.getVehicles().size() : 0;
        return new CustomerDto(
                customer.getId(),
                customer.getFullName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getCreatedAt(),
                customer.getUpdatedAt(),
                vehicleCount,
                customer.getAgent() != null ? customer.getAgent().getId() : null,
                customer.getAgent() != null ? customer.getAgent().getFullName() : null,
                customer.getKycStatus() != null ? customer.getKycStatus() : "VERIFIED"
        );
    }
}

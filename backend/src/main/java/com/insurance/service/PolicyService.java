package com.insurance.service;

import com.insurance.dto.PolicyCreateRequest;
import com.insurance.dto.PolicyDto;
import com.insurance.entity.Customer;
import com.insurance.entity.Policy;
import com.insurance.entity.PolicyStatus;
import com.insurance.entity.Vehicle;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.CustomerRepository;
import com.insurance.repository.PaymentRepository;
import com.insurance.repository.PolicyRepository;
import com.insurance.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final PaymentRepository paymentRepository;

    public PolicyService(PolicyRepository policyRepository,
                         CustomerRepository customerRepository,
                         VehicleRepository vehicleRepository,
                         PaymentRepository paymentRepository) {
        this.policyRepository = policyRepository;
        this.customerRepository = customerRepository;
        this.vehicleRepository = vehicleRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public List<PolicyDto> getPolicies(String search, PolicyStatus status) {
        List<Policy> policies = policyRepository.search(search, status);
        return policies.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PolicyDto getPolicyById(Long id) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found with id: " + id));
        return toDto(policy);
    }

    @Transactional
    public PolicyDto createPolicy(PolicyCreateRequest request) {
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

        String policyNumber = generatePolicyNumber();
        PolicyStatus status = request.getStatus() != null ? request.getStatus() : PolicyStatus.ISSUED;

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

        Policy saved = policyRepository.save(policy);
        return toDto(saved);
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

        return new PolicyDto(
                policy.getId(),
                policy.getPolicyNumber(),
                policy.getCustomer().getId(),
                policy.getCustomer().getFullName(),
                policy.getCustomer().getPhone(),
                policy.getVehicle().getId(),
                policy.getVehicle().getRegistrationNumber(),
                vehicleDesc,
                policy.getCoverageDescription(),
                policy.getStartDate(),
                policy.getEndDate(),
                policy.getPremium(),
                totalPaid,
                balance,
                policy.getStatus(),
                policy.getCreatedAt()
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
}

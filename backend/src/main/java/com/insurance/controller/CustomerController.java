package com.insurance.controller;

import com.insurance.dto.*;
import com.insurance.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public ResponseEntity<List<CustomerDto>> getCustomers(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(customerService.getCustomers(search));
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<CustomerDto>> getCustomersByAgent(@PathVariable Long agentId) {
        return ResponseEntity.ok(customerService.getCustomersByAgent(agentId));
    }

    @GetMapping("/directory")
    public ResponseEntity<List<CustomerDirectoryItemDto>> getDirectory(
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(customerService.getDirectory(search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDto> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<CustomerDashboardDto> getCustomerDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerDashboard(id));
    }

    @PostMapping
    public ResponseEntity<CustomerDto> createCustomer(
            @Valid @RequestBody CustomerCreateRequest request,
            @RequestParam(required = false) String actorUsername) {
        CustomerDto created = customerService.createCustomer(request, actorUsername);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/onboard")
    public ResponseEntity<ClientOnboardingResponseDto> onboardClient(
            @Valid @RequestBody ClientOnboardingRequest request,
            @RequestParam(required = false, defaultValue = "david.agent") String agentUsername) {
        ClientOnboardingResponseDto result = customerService.onboardClient(request, agentUsername);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerDto> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerCreateRequest request,
            @RequestParam(required = false, defaultValue = "customer") String actorUsername) {
        CustomerDto updated = customerService.updateCustomer(id, request, actorUsername);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/kyc")
    public ResponseEntity<CustomerDto> updateKycStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            @RequestParam(required = false, defaultValue = "customer") String actorUsername) {
        String kycStatus = body.getOrDefault("kycStatus", "VERIFIED");
        String documentType = body.getOrDefault("documentType", "NATIONAL_ID");
        CustomerDto updated = customerService.updateKycStatus(id, kycStatus, documentType, actorUsername);
        return ResponseEntity.ok(updated);
    }
}

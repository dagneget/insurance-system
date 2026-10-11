package com.insurance.controller;

import com.insurance.dto.PaymentCreateRequest;
import com.insurance.dto.PaymentDto;
import com.insurance.dto.PolicyCreateRequest;
import com.insurance.dto.PolicyDto;
import com.insurance.entity.PolicyStatus;
import com.insurance.service.PaymentService;
import com.insurance.service.PolicyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/policies")
public class PolicyController {

    private final PolicyService policyService;
    private final PaymentService paymentService;

    public PolicyController(PolicyService policyService, PaymentService paymentService) {
        this.policyService = policyService;
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<PolicyDto>> getPolicies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PolicyStatus status) {
        return ResponseEntity.ok(policyService.getPolicies(search, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PolicyDto> getPolicyById(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.getPolicyById(id));
    }

    @PostMapping
    public ResponseEntity<PolicyDto> createPolicy(
            @Valid @RequestBody PolicyCreateRequest request) {
        PolicyDto created = policyService.createPolicy(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}/payments")
    public ResponseEntity<List<PaymentDto>> getPaymentsByPolicy(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentsByPolicy(id));
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<PaymentDto> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentCreateRequest request) {
        PaymentDto created = paymentService.recordPayment(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}

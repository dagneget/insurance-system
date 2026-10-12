package com.insurance.controller;

import com.insurance.dto.*;
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

    @GetMapping("/expiring")
    public ResponseEntity<List<PolicyDto>> getExpiringPolicies(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(policyService.getExpiringPolicies(days));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PolicyDto> getPolicyById(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.getPolicyById(id));
    }

    @GetMapping("/referrals")
    public ResponseEntity<List<PolicyDto>> getReferralQueue() {
        return ResponseEntity.ok(policyService.getReferralQueue());
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<PolicyDto>> getPoliciesByAgent(@PathVariable Long agentId) {
        return ResponseEntity.ok(policyService.getPoliciesByAgent(agentId));
    }

    @PostMapping("/{id}/referrals/approve")
    public ResponseEntity<PolicyDto> approveReferral(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body,
            @RequestParam(required = false, defaultValue = "alexander.uw") String underwriterUsername) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(policyService.approveReferral(id, notes, underwriterUsername));
    }

    @PostMapping("/{id}/referrals/reject")
    public ResponseEntity<PolicyDto> rejectReferral(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body,
            @RequestParam(required = false, defaultValue = "alexander.uw") String underwriterUsername) {
        String reason = body != null ? body.get("reason") : "Risk deemed unacceptable";
        return ResponseEntity.ok(policyService.rejectReferral(id, reason, underwriterUsername));
    }

    @PostMapping
    public ResponseEntity<PolicyDto> createPolicy(
            @Valid @RequestBody PolicyCreateRequest request,
            @RequestParam(required = false) String actorUsername) {
        PolicyDto created = policyService.createPolicy(request, actorUsername);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/quote")
    public ResponseEntity<QuoteCalculationDto> calculateQuote(
            @Valid @RequestBody QuoteCalculationRequest request) {
        return ResponseEntity.ok(policyService.calculateQuote(request));
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<PolicyDto> renewPolicy(
            @PathVariable Long id,
            @Valid @RequestBody PolicyRenewalRequest request) {
        PolicyDto renewed = policyService.renewPolicy(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(renewed);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PolicyDto> cancelPolicy(
            @PathVariable Long id,
            @Valid @RequestBody PolicyCancelRequest request) {
        return ResponseEntity.ok(policyService.cancelPolicy(id, request));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<PolicyDto> approvePolicy(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.approvePolicy(id));
    }

    @GetMapping("/{id}/endorsements")
    public ResponseEntity<List<EndorsementDto>> getEndorsements(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.getEndorsements(id));
    }

    @PostMapping("/{id}/endorsements")
    public ResponseEntity<EndorsementDto> addEndorsement(
            @PathVariable Long id,
            @Valid @RequestBody EndorsementCreateRequest request) {
        EndorsementDto created = policyService.addEndorsement(id, request);
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

    @GetMapping("/commissions/agent/{agentId}")
    public ResponseEntity<CommissionStatementDto> getCommissionStatement(@PathVariable Long agentId) {
        return ResponseEntity.ok(policyService.getCommissionStatement(agentId));
    }

    @PostMapping("/{id}/reminders/renewal")
    public ResponseEntity<java.util.Map<String, String>> sendRenewalReminder(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "david.agent") String actorUsername) {
        policyService.sendRenewalReminder(id, actorUsername);
        return ResponseEntity.ok(java.util.Map.of("message", "Renewal reminder successfully dispatched to policyholder."));
    }

    @PostMapping("/{id}/reminders/payment")
    public ResponseEntity<java.util.Map<String, String>> sendPaymentReminder(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "david.agent") String actorUsername) {
        policyService.sendPaymentReminder(id, actorUsername);
        return ResponseEntity.ok(java.util.Map.of("message", "Payment reminder successfully dispatched to policyholder."));
    }
}

package com.insurance.controller;

import com.insurance.dto.*;
import com.insurance.entity.ClaimStatus;
import com.insurance.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @GetMapping
    public ResponseEntity<List<ClaimDto>> getClaims(
            @RequestParam(required = false) ClaimStatus status) {
        return ResponseEntity.ok(claimService.getClaims(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClaimDto> getClaimById(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.getClaimById(id));
    }

    @PostMapping
    public ResponseEntity<ClaimDto> createClaim(
            @Valid @RequestBody ClaimCreateRequest request) {
        ClaimDto created = claimService.createClaim(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ClaimDto> reviewClaim(
            @PathVariable Long id,
            @Valid @RequestBody ClaimStatusUpdateRequest request) {
        ClaimDto reviewed = claimService.reviewClaim(id, request);
        return ResponseEntity.ok(reviewed);
    }

    @PostMapping("/{id}/settlements")
    public ResponseEntity<ClaimDto> recordSettlement(
            @PathVariable Long id,
            @Valid @RequestBody ClaimSettlementRequest request) {
        ClaimDto settled = claimService.recordSettlement(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(settled);
    }

    @PostMapping("/{id}/disburse")
    public ResponseEntity<ClaimPayoutDto> disburseClaim(
            @PathVariable Long id,
            @Valid @RequestBody ClaimDisbursementRequest request,
            @RequestParam(required = false, defaultValue = "marcus.finance") String financeOfficerUsername) {
        ClaimPayoutDto payout = claimService.disburseClaim(id, request, financeOfficerUsername);
        return ResponseEntity.status(HttpStatus.CREATED).body(payout);
    }

    @GetMapping("/disbursements/pending")
    public ResponseEntity<List<ClaimPayoutDto>> getPendingDisbursements() {
        return ResponseEntity.ok(claimService.getPendingDisbursements());
    }

    @GetMapping("/{id}/payout")
    public ResponseEntity<ClaimPayoutDto> getPayoutByClaimId(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.getPayoutByClaimId(id));
    }

    @PostMapping("/{id}/investigate")
    public ResponseEntity<ClaimDto> investigateClaim(
            @PathVariable Long id,
            @RequestBody ClaimInvestigationRequest request,
            @RequestParam(required = false, defaultValue = "sarah.adjuster") String adjusterUsername) {
        ClaimDto investigated = claimService.investigateClaim(id, request, adjusterUsername);
        return ResponseEntity.ok(investigated);
    }
}

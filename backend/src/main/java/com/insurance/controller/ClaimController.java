package com.insurance.controller;

import com.insurance.dto.ClaimCreateRequest;
import com.insurance.dto.ClaimDto;
import com.insurance.dto.ClaimSettlementRequest;
import com.insurance.dto.ClaimStatusUpdateRequest;
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

    @PatchMapping("/{id}/status")
    public ResponseEntity<ClaimDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ClaimStatusUpdateRequest request) {
        ClaimDto updated = claimService.updateStatus(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/settlements")
    public ResponseEntity<ClaimDto> recordSettlement(
            @PathVariable Long id,
            @Valid @RequestBody ClaimSettlementRequest request) {
        ClaimDto settled = claimService.recordSettlement(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(settled);
    }
}

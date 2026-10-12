package com.insurance.controller;

import com.insurance.dto.BillingScheduleDto;
import com.insurance.service.BillingScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
public class BillingScheduleController {

    private final BillingScheduleService billingScheduleService;

    public BillingScheduleController(BillingScheduleService billingScheduleService) {
        this.billingScheduleService = billingScheduleService;
    }

    @GetMapping("/schedules")
    public ResponseEntity<List<BillingScheduleDto>> getAllSchedules() {
        return ResponseEntity.ok(billingScheduleService.getAllSchedules());
    }

    @GetMapping("/schedules/policy/{policyId}")
    public ResponseEntity<List<BillingScheduleDto>> getSchedulesByPolicy(@PathVariable Long policyId) {
        return ResponseEntity.ok(billingScheduleService.getSchedulesByPolicy(policyId));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<BillingScheduleDto>> getOverdueSchedules() {
        return ResponseEntity.ok(billingScheduleService.getOverdueSchedules());
    }
}

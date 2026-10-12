package com.insurance.controller;

import com.insurance.dto.PaymentDto;
import com.insurance.dto.PaymentVoidRequest;
import com.insurance.entity.PaymentStatus;
import com.insurance.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentDto>> getAllPayments(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) PaymentStatus status) {
        List<PaymentDto> payments = paymentService.getAllPayments(query, status);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDto> getPaymentById(@PathVariable Long id) {
        PaymentDto payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/{id}/void")
    public ResponseEntity<PaymentDto> voidPayment(
            @PathVariable Long id,
            @Valid @RequestBody PaymentVoidRequest request,
            @RequestParam(required = false, defaultValue = "marcus.finance") String actorUsername) {
        PaymentDto voided = paymentService.voidPayment(id, request, actorUsername);
        return ResponseEntity.ok(voided);
    }

    @PostMapping("/{id}/approve-void")
    public ResponseEntity<PaymentDto> approveVoid(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @RequestParam(required = false, defaultValue = "elena.manager") String checkerUsername) {
        String checker = body != null && body.containsKey("checkerUsername") ? body.get("checkerUsername") : checkerUsername;
        PaymentDto approved = paymentService.approveVoid(id, checker);
        return ResponseEntity.ok(approved);
    }
}

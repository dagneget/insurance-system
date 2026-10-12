package com.insurance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class PaymentCreateRequest {

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Transaction reference is required")
    @Size(max = 100, message = "Transaction reference cannot exceed 100 characters")
    private String transactionReference;

    @Size(max = 50, message = "Payment method cannot exceed 50 characters")
    private String paymentMethod;

    @Size(max = 255, message = "Note cannot exceed 255 characters")
    private String note;

    private Long billingScheduleId;

    public PaymentCreateRequest() {
    }

    public PaymentCreateRequest(BigDecimal amount, String transactionReference, String paymentMethod, String note) {
        this.amount = amount;
        this.transactionReference = transactionReference;
        this.paymentMethod = paymentMethod;
        this.note = note;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Long getBillingScheduleId() {
        return billingScheduleId;
    }

    public void setBillingScheduleId(Long billingScheduleId) {
        this.billingScheduleId = billingScheduleId;
    }
}

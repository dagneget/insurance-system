package com.insurance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class ClaimSettlementRequest {

    @NotNull(message = "Settlement amount is required")
    @DecimalMin(value = "0.01", message = "Settlement amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Settlement reference is required")
    @Size(max = 100, message = "Settlement reference cannot exceed 100 characters")
    private String reference;

    @Size(max = 255, message = "Note cannot exceed 255 characters")
    private String note;

    public ClaimSettlementRequest() {
    }

    public ClaimSettlementRequest(BigDecimal amount, String reference, String note) {
        this.amount = amount;
        this.reference = reference;
        this.note = note;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getReference() {
        return reference;
    }

    public void setReference(String reference) {
        this.reference = reference;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}

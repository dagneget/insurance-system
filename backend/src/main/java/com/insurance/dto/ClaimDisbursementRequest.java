package com.insurance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ClaimDisbursementRequest {

    @NotNull(message = "Disbursement amount is required")
    @DecimalMin(value = "0.01", message = "Disbursement amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Payout method is required (e.g. BANK_TRANSFER, MOBILE_MONEY, CHEQUE)")
    private String payoutMethod;

    @NotBlank(message = "Transaction reference is required")
    private String transactionReference;

    private String idempotencyKey;
    private String notes;

    public ClaimDisbursementRequest() {}

    public ClaimDisbursementRequest(BigDecimal amount, String payoutMethod, String transactionReference,
                                    String idempotencyKey, String notes) {
        this.amount = amount;
        this.payoutMethod = payoutMethod;
        this.transactionReference = transactionReference;
        this.idempotencyKey = idempotencyKey;
        this.notes = notes;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPayoutMethod() {
        return payoutMethod;
    }

    public void setPayoutMethod(String payoutMethod) {
        this.payoutMethod = payoutMethod;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

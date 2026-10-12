package com.insurance.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class ClaimPayoutDto {
    private Long id;
    private Long claimId;
    private String claimNumber;
    private String claimantName;
    private BigDecimal approvedAmount;
    private BigDecimal disbursedAmount;
    private String payoutMethod;
    private String transactionReference;
    private String idempotencyKey;
    private String disbursedBy;
    private OffsetDateTime disbursedAt;
    private String status;
    private String notes;

    public ClaimPayoutDto() {}

    public ClaimPayoutDto(Long id, Long claimId, String claimNumber, String claimantName,
                          BigDecimal approvedAmount, BigDecimal disbursedAmount, String payoutMethod,
                          String transactionReference, String idempotencyKey, String disbursedBy,
                          OffsetDateTime disbursedAt, String status, String notes) {
        this.id = id;
        this.claimId = claimId;
        this.claimNumber = claimNumber;
        this.claimantName = claimantName;
        this.approvedAmount = approvedAmount;
        this.disbursedAmount = disbursedAmount;
        this.payoutMethod = payoutMethod;
        this.transactionReference = transactionReference;
        this.idempotencyKey = idempotencyKey;
        this.disbursedBy = disbursedBy;
        this.disbursedAt = disbursedAt;
        this.status = status;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClaimId() {
        return claimId;
    }

    public void setClaimId(Long claimId) {
        this.claimId = claimId;
    }

    public String getClaimNumber() {
        return claimNumber;
    }

    public void setClaimNumber(String claimNumber) {
        this.claimNumber = claimNumber;
    }

    public String getClaimantName() {
        return claimantName;
    }

    public void setClaimantName(String claimantName) {
        this.claimantName = claimantName;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }

    public BigDecimal getDisbursedAmount() {
        return disbursedAmount;
    }

    public void setDisbursedAmount(BigDecimal disbursedAmount) {
        this.disbursedAmount = disbursedAmount;
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

    public String getDisbursedBy() {
        return disbursedBy;
    }

    public void setDisbursedBy(String disbursedBy) {
        this.disbursedBy = disbursedBy;
    }

    public OffsetDateTime getDisbursedAt() {
        return disbursedAt;
    }

    public void setDisbursedAt(OffsetDateTime disbursedAt) {
        this.disbursedAt = disbursedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

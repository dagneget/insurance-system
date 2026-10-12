package com.insurance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "claim_payouts")
public class ClaimPayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", unique = true, nullable = false)
    private Claim claim;

    @Column(name = "approved_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "disbursed_amount", precision = 12, scale = 2)
    private BigDecimal disbursedAmount;

    @Column(name = "payout_method", length = 50)
    private String payoutMethod; // BANK_TRANSFER, MOBILE_MONEY, CHEQUE

    @Column(name = "transaction_reference", unique = true, length = 100)
    private String transactionReference;

    @Column(name = "idempotency_key", unique = true, length = 100)
    private String idempotencyKey;

    @Column(name = "disbursed_by", length = 100)
    private String disbursedBy;

    @Column(name = "disbursed_at")
    private OffsetDateTime disbursedAt;

    @Column(nullable = false, length = 50)
    private String status = "PENDING_FINANCE"; // PENDING_FINANCE, DISBURSED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String notes;

    public ClaimPayout() {
    }

    public ClaimPayout(Claim claim, BigDecimal approvedAmount) {
        this.claim = claim;
        this.approvedAmount = approvedAmount;
        this.status = "PENDING_FINANCE";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Claim getClaim() {
        return claim;
    }

    public void setClaim(Claim claim) {
        this.claim = claim;
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

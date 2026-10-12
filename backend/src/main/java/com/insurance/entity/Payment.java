package com.insurance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_reference", nullable = false, unique = true, length = 100)
    private String transactionReference;

    @Column(name = "payment_method", nullable = false, length = 50)
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    @Column(length = 255)
    private String note;

    @Column(name = "payment_date", nullable = false)
    private OffsetDateTime paymentDate;

    @Column(name = "void_reason", length = 255)
    private String voidReason;

    @Column(name = "voided_at")
    private OffsetDateTime voidedAt;

    @Column(name = "maker_username", length = 100)
    private String makerUsername;

    @Column(name = "checker_username", length = 100)
    private String checkerUsername;

    @Column(name = "void_status", nullable = false, length = 50)
    private String voidStatus = "NONE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL)
    private List<PaymentAllocation> paymentAllocations = new ArrayList<>();

    public Payment() {
    }

    public Payment(Policy policy, BigDecimal amount, String transactionReference,
                   String paymentMethod, PaymentStatus status, String note) {
        this.policy = policy;
        this.amount = amount;
        this.transactionReference = transactionReference;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.note = note;
    }

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (paymentDate == null) {
            paymentDate = now;
        }
        if (paymentMethod == null) {
            paymentMethod = "DEMO";
        }
        if (status == null) {
            status = PaymentStatus.SUCCESS;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Policy getPolicy() {
        return policy;
    }

    public void setPolicy(Policy policy) {
        this.policy = policy;
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

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public OffsetDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(OffsetDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getVoidReason() {
        return voidReason;
    }

    public void setVoidReason(String voidReason) {
        this.voidReason = voidReason;
    }

    public OffsetDateTime getVoidedAt() {
        return voidedAt;
    }

    public void setVoidedAt(OffsetDateTime voidedAt) {
        this.voidedAt = voidedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getMakerUsername() {
        return makerUsername;
    }

    public void setMakerUsername(String makerUsername) {
        this.makerUsername = makerUsername;
    }

    public String getCheckerUsername() {
        return checkerUsername;
    }

    public void setCheckerUsername(String checkerUsername) {
        this.checkerUsername = checkerUsername;
    }

    public String getVoidStatus() {
        return voidStatus;
    }

    public void setVoidStatus(String voidStatus) {
        this.voidStatus = voidStatus;
    }

    public List<PaymentAllocation> getPaymentAllocations() {
        return paymentAllocations;
    }

    public void setPaymentAllocations(List<PaymentAllocation> paymentAllocations) {
        this.paymentAllocations = paymentAllocations;
    }
}

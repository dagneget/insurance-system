package com.insurance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "payment_allocations")
public class PaymentAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billing_schedule_id", nullable = false)
    private BillingSchedule billingSchedule;

    @Column(name = "allocated_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal allocatedAmount;

    @Column(name = "allocated_at", nullable = false, updatable = false)
    private OffsetDateTime allocatedAt;

    public PaymentAllocation() {
    }

    public PaymentAllocation(Payment payment, BillingSchedule billingSchedule, BigDecimal allocatedAmount) {
        this.payment = payment;
        this.billingSchedule = billingSchedule;
        this.allocatedAmount = allocatedAmount;
    }

    @PrePersist
    public void prePersist() {
        if (allocatedAt == null) {
            allocatedAt = OffsetDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(Payment payment) {
        this.payment = payment;
    }

    public BillingSchedule getBillingSchedule() {
        return billingSchedule;
    }

    public void setBillingSchedule(BillingSchedule billingSchedule) {
        this.billingSchedule = billingSchedule;
    }

    public BigDecimal getAllocatedAmount() {
        return allocatedAmount;
    }

    public void setAllocatedAmount(BigDecimal allocatedAmount) {
        this.allocatedAmount = allocatedAmount;
    }

    public OffsetDateTime getAllocatedAt() {
        return allocatedAt;
    }

    public void setAllocatedAt(OffsetDateTime allocatedAt) {
        this.allocatedAt = allocatedAt;
    }
}

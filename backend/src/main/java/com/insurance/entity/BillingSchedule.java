package com.insurance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "billing_schedules")
public class BillingSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(name = "total_installments", nullable = false)
    private Integer totalInstallments;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "amount_due", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountDue;

    @Column(name = "amount_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "grace_period_days", nullable = false)
    private Integer gracePeriodDays = 15;

    @Column(nullable = false, length = 50)
    private String status = "PENDING"; // PENDING, PARTIAL, PAID, OVERDUE

    @OneToMany(mappedBy = "billingSchedule", cascade = CascadeType.ALL)
    private List<PaymentAllocation> paymentAllocations = new ArrayList<>();

    public BillingSchedule() {
    }

    public BillingSchedule(Policy policy, Integer installmentNumber, Integer totalInstallments,
                           LocalDate dueDate, BigDecimal amountDue, Integer gracePeriodDays) {
        this.policy = policy;
        this.installmentNumber = installmentNumber;
        this.totalInstallments = totalInstallments;
        this.dueDate = dueDate;
        this.amountDue = amountDue;
        this.amountPaid = BigDecimal.ZERO;
        this.gracePeriodDays = gracePeriodDays != null ? gracePeriodDays : 15;
        this.status = "PENDING";
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

    public Integer getInstallmentNumber() {
        return installmentNumber;
    }

    public void setInstallmentNumber(Integer installmentNumber) {
        this.installmentNumber = installmentNumber;
    }

    public Integer getTotalInstallments() {
        return totalInstallments;
    }

    public void setTotalInstallments(Integer totalInstallments) {
        this.totalInstallments = totalInstallments;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public BigDecimal getAmountDue() {
        return amountDue;
    }

    public void setAmountDue(BigDecimal amountDue) {
        this.amountDue = amountDue;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public Integer getGracePeriodDays() {
        return gracePeriodDays;
    }

    public void setGracePeriodDays(Integer gracePeriodDays) {
        this.gracePeriodDays = gracePeriodDays;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<PaymentAllocation> getPaymentAllocations() {
        return paymentAllocations;
    }

    public void setPaymentAllocations(List<PaymentAllocation> paymentAllocations) {
        this.paymentAllocations = paymentAllocations;
    }
}

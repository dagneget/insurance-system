package com.insurance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class BillingScheduleDto {
    private Long id;
    private Long policyId;
    private String policyNumber;
    private String customerName;
    private Integer installmentNumber;
    private Integer totalInstallments;
    private LocalDate dueDate;
    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private BigDecimal balance;
    private Integer gracePeriodDays;
    private String status;

    public BillingScheduleDto() {
    }

    public BillingScheduleDto(Long id, Long policyId, String policyNumber, Integer installmentNumber,
                              Integer totalInstallments, LocalDate dueDate, BigDecimal amountDue,
                              BigDecimal amountPaid, Integer gracePeriodDays, String status) {
        this(id, policyId, policyNumber, null, installmentNumber, totalInstallments, dueDate, amountDue, amountPaid, gracePeriodDays, status);
    }

    public BillingScheduleDto(Long id, Long policyId, String policyNumber, String customerName,
                              Integer installmentNumber, Integer totalInstallments, LocalDate dueDate,
                              BigDecimal amountDue, BigDecimal amountPaid, Integer gracePeriodDays, String status) {
        this.id = id;
        this.policyId = policyId;
        this.policyNumber = policyNumber;
        this.customerName = customerName;
        this.installmentNumber = installmentNumber;
        this.totalInstallments = totalInstallments;
        this.dueDate = dueDate;
        this.amountDue = amountDue;
        this.amountPaid = amountPaid != null ? amountPaid : BigDecimal.ZERO;
        this.balance = this.amountDue.subtract(this.amountPaid);
        this.gracePeriodDays = gracePeriodDays;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Long policyId) {
        this.policyId = policyId;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
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

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
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
}

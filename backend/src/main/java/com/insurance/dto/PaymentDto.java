package com.insurance.dto;

import com.insurance.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class PaymentDto {
    private Long id;
    private Long policyId;
    private String policyNumber;
    private BigDecimal amount;
    private String transactionReference;
    private String paymentMethod;
    private PaymentStatus status;
    private String note;
    private OffsetDateTime paymentDate;

    public PaymentDto() {
    }

    public PaymentDto(Long id, Long policyId, String policyNumber, BigDecimal amount,
                      String transactionReference, String paymentMethod, PaymentStatus status,
                      String note, OffsetDateTime paymentDate) {
        this.id = id;
        this.policyId = policyId;
        this.policyNumber = policyNumber;
        this.amount = amount;
        this.transactionReference = transactionReference;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.note = note;
        this.paymentDate = paymentDate;
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
}

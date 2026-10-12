package com.insurance.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class PaymentAllocationDto {
    private Long id;
    private Long paymentId;
    private Long billingScheduleId;
    private Integer installmentNumber;
    private BigDecimal allocatedAmount;
    private OffsetDateTime allocatedAt;

    public PaymentAllocationDto() {}

    public PaymentAllocationDto(Long id, Long paymentId, Long billingScheduleId,
                                Integer installmentNumber, BigDecimal allocatedAmount,
                                OffsetDateTime allocatedAt) {
        this.id = id;
        this.paymentId = paymentId;
        this.billingScheduleId = billingScheduleId;
        this.installmentNumber = installmentNumber;
        this.allocatedAmount = allocatedAmount;
        this.allocatedAt = allocatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public Long getBillingScheduleId() {
        return billingScheduleId;
    }

    public void setBillingScheduleId(Long billingScheduleId) {
        this.billingScheduleId = billingScheduleId;
    }

    public Integer getInstallmentNumber() {
        return installmentNumber;
    }

    public void setInstallmentNumber(Integer installmentNumber) {
        this.installmentNumber = installmentNumber;
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

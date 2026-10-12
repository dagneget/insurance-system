package com.insurance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CommissionLineItemDto {
    private Long policyId;
    private String policyNumber;
    private String customerName;
    private String vehicleRegistration;
    private String productCode;
    private BigDecimal premium;
    private BigDecimal commissionRatePercentage;
    private BigDecimal commissionAmount;
    private String policyStatus;
    private LocalDate policyStartDate;
    private String payoutStatus;

    public CommissionLineItemDto() {}

    public CommissionLineItemDto(Long policyId, String policyNumber, String customerName,
                                 String vehicleRegistration, String productCode, BigDecimal premium,
                                 BigDecimal commissionRatePercentage, BigDecimal commissionAmount,
                                 String policyStatus, LocalDate policyStartDate, String payoutStatus) {
        this.policyId = policyId;
        this.policyNumber = policyNumber;
        this.customerName = customerName;
        this.vehicleRegistration = vehicleRegistration;
        this.productCode = productCode;
        this.premium = premium;
        this.commissionRatePercentage = commissionRatePercentage;
        this.commissionAmount = commissionAmount;
        this.policyStatus = policyStatus;
        this.policyStartDate = policyStartDate;
        this.payoutStatus = payoutStatus;
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

    public String getVehicleRegistration() {
        return vehicleRegistration;
    }

    public void setVehicleRegistration(String vehicleRegistration) {
        this.vehicleRegistration = vehicleRegistration;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public BigDecimal getPremium() {
        return premium;
    }

    public void setPremium(BigDecimal premium) {
        this.premium = premium;
    }

    public BigDecimal getCommissionRatePercentage() {
        return commissionRatePercentage;
    }

    public void setCommissionRatePercentage(BigDecimal commissionRatePercentage) {
        this.commissionRatePercentage = commissionRatePercentage;
    }

    public BigDecimal getCommissionAmount() {
        return commissionAmount;
    }

    public void setCommissionAmount(BigDecimal commissionAmount) {
        this.commissionAmount = commissionAmount;
    }

    public String getPolicyStatus() {
        return policyStatus;
    }

    public void setPolicyStatus(String policyStatus) {
        this.policyStatus = policyStatus;
    }

    public LocalDate getPolicyStartDate() {
        return policyStartDate;
    }

    public void setPolicyStartDate(LocalDate policyStartDate) {
        this.policyStartDate = policyStartDate;
    }

    public String getPayoutStatus() {
        return payoutStatus;
    }

    public void setPayoutStatus(String payoutStatus) {
        this.payoutStatus = payoutStatus;
    }
}

package com.insurance.dto;

import com.insurance.entity.PolicyStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class PolicyDto {
    private Long id;
    private String policyNumber;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long vehicleId;
    private String vehicleRegistrationNumber;
    private String vehicleDescription;
    private String productCode;
    private BigDecimal deductibleAmount;
    private String coverageDescription;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal premium;
    private BigDecimal totalPaid;
    private BigDecimal outstandingBalance;
    private PolicyStatus status;
    private String cancellationReason;
    private OffsetDateTime cancelledAt;
    private Long renewedFromId;
    private String renewedFromPolicyNumber;
    private int endorsementsCount;
    private OffsetDateTime createdAt;

    public PolicyDto() {
    }

    public PolicyDto(Long id, String policyNumber, Long customerId, String customerName, String customerPhone,
                     Long vehicleId, String vehicleRegistrationNumber, String vehicleDescription,
                     String productCode, BigDecimal deductibleAmount,
                     String coverageDescription, LocalDate startDate, LocalDate endDate,
                     BigDecimal premium, BigDecimal totalPaid, BigDecimal outstandingBalance,
                     PolicyStatus status, String cancellationReason, OffsetDateTime cancelledAt,
                     Long renewedFromId, String renewedFromPolicyNumber, int endorsementsCount,
                     OffsetDateTime createdAt) {
        this.id = id;
        this.policyNumber = policyNumber;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.vehicleId = vehicleId;
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
        this.vehicleDescription = vehicleDescription;
        this.productCode = productCode;
        this.deductibleAmount = deductibleAmount;
        this.coverageDescription = coverageDescription;
        this.startDate = startDate;
        this.endDate = endDate;
        this.premium = premium;
        this.totalPaid = totalPaid;
        this.outstandingBalance = outstandingBalance;
        this.status = status;
        this.cancellationReason = cancellationReason;
        this.cancelledAt = cancelledAt;
        this.renewedFromId = renewedFromId;
        this.renewedFromPolicyNumber = renewedFromPolicyNumber;
        this.endorsementsCount = endorsementsCount;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleRegistrationNumber() {
        return vehicleRegistrationNumber;
    }

    public void setVehicleRegistrationNumber(String vehicleRegistrationNumber) {
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
    }

    public String getVehicleDescription() {
        return vehicleDescription;
    }

    public void setVehicleDescription(String vehicleDescription) {
        this.vehicleDescription = vehicleDescription;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public BigDecimal getDeductibleAmount() {
        return deductibleAmount;
    }

    public void setDeductibleAmount(BigDecimal deductibleAmount) {
        this.deductibleAmount = deductibleAmount;
    }

    public String getCoverageDescription() {
        return coverageDescription;
    }

    public void setCoverageDescription(String coverageDescription) {
        this.coverageDescription = coverageDescription;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public BigDecimal getPremium() {
        return premium;
    }

    public void setPremium(BigDecimal premium) {
        this.premium = premium;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public PolicyStatus getStatus() {
        return status;
    }

    public void setStatus(PolicyStatus status) {
        this.status = status;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public OffsetDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(OffsetDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Long getRenewedFromId() {
        return renewedFromId;
    }

    public void setRenewedFromId(Long renewedFromId) {
        this.renewedFromId = renewedFromId;
    }

    public String getRenewedFromPolicyNumber() {
        return renewedFromPolicyNumber;
    }

    public void setRenewedFromPolicyNumber(String renewedFromPolicyNumber) {
        this.renewedFromPolicyNumber = renewedFromPolicyNumber;
    }

    public int getEndorsementsCount() {
        return endorsementsCount;
    }

    public void setEndorsementsCount(int endorsementsCount) {
        this.endorsementsCount = endorsementsCount;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    private Boolean referralFlag;
    private String referralReason;
    private String underwritingSubjectivities;
    private BigDecimal vehicleMarketValue;
    private Long agentId;
    private String agentName;
    private java.util.List<BillingScheduleDto> billingSchedules;

    public Boolean getReferralFlag() {
        return referralFlag;
    }

    public void setReferralFlag(Boolean referralFlag) {
        this.referralFlag = referralFlag;
    }

    public String getReferralReason() {
        return referralReason;
    }

    public void setReferralReason(String referralReason) {
        this.referralReason = referralReason;
    }

    public String getUnderwritingSubjectivities() {
        return underwritingSubjectivities;
    }

    public void setUnderwritingSubjectivities(String underwritingSubjectivities) {
        this.underwritingSubjectivities = underwritingSubjectivities;
    }

    public BigDecimal getVehicleMarketValue() {
        return vehicleMarketValue;
    }

    public void setVehicleMarketValue(BigDecimal vehicleMarketValue) {
        this.vehicleMarketValue = vehicleMarketValue;
    }

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public java.util.List<BillingScheduleDto> getBillingSchedules() {
        return billingSchedules;
    }

    public void setBillingSchedules(java.util.List<BillingScheduleDto> billingSchedules) {
        this.billingSchedules = billingSchedules;
    }
}

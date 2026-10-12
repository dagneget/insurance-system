package com.insurance.dto;

import com.insurance.entity.PolicyStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PolicyCreateRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotBlank(message = "Coverage description is required")
    @Size(max = 255, message = "Coverage description cannot exceed 255 characters")
    private String coverageDescription;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Premium amount is required")
    @DecimalMin(value = "0.01", message = "Premium must be greater than zero")
    private BigDecimal premium;

    private PolicyStatus status;

    private String productCode = "COMPREHENSIVE";

    private BigDecimal deductibleAmount = new BigDecimal("500.00");

    private BigDecimal vehicleMarketValue;

    private String underwritingSubjectivities;

    private Long agentId;

    private Integer installmentsCount = 1;

    private Boolean referralFlag = false;

    private String referralReason;

    public PolicyCreateRequest() {
    }

    public PolicyCreateRequest(Long customerId, Long vehicleId, String coverageDescription,
                               LocalDate startDate, LocalDate endDate, BigDecimal premium, PolicyStatus status) {
        this.customerId = customerId;
        this.vehicleId = vehicleId;
        this.coverageDescription = coverageDescription;
        this.startDate = startDate;
        this.endDate = endDate;
        this.premium = premium;
        this.status = status;
    }

    public PolicyCreateRequest(Long customerId, Long vehicleId, String coverageDescription,
                               String productCode, BigDecimal deductibleAmount,
                               LocalDate startDate, LocalDate endDate, BigDecimal premium, PolicyStatus status) {
        this.customerId = customerId;
        this.vehicleId = vehicleId;
        this.coverageDescription = coverageDescription;
        this.productCode = productCode;
        this.deductibleAmount = deductibleAmount;
        this.startDate = startDate;
        this.endDate = endDate;
        this.premium = premium;
        this.status = status;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
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

    public PolicyStatus getStatus() {
        return status;
    }

    public void setStatus(PolicyStatus status) {
        this.status = status;
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

    public BigDecimal getVehicleMarketValue() {
        return vehicleMarketValue;
    }

    public void setVehicleMarketValue(BigDecimal vehicleMarketValue) {
        this.vehicleMarketValue = vehicleMarketValue;
    }

    public String getUnderwritingSubjectivities() {
        return underwritingSubjectivities;
    }

    public void setUnderwritingSubjectivities(String underwritingSubjectivities) {
        this.underwritingSubjectivities = underwritingSubjectivities;
    }

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
    }

    public Integer getInstallmentsCount() {
        return installmentsCount;
    }

    public void setInstallmentsCount(Integer installmentsCount) {
        this.installmentsCount = installmentsCount;
    }

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
}

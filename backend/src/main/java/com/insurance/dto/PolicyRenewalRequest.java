package com.insurance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class PolicyRenewalRequest {

    @NotNull(message = "New start date is required")
    private LocalDate startDate;

    @NotNull(message = "New end date is required")
    private LocalDate endDate;

    @NotNull(message = "Renewal premium is required")
    @DecimalMin(value = "1.00", message = "Premium must be at least 1.00")
    private BigDecimal premium;

    private String coverageDescription;

    private BigDecimal deductibleAmount;

    public PolicyRenewalRequest() {
    }

    public PolicyRenewalRequest(LocalDate startDate, LocalDate endDate, BigDecimal premium, String coverageDescription, BigDecimal deductibleAmount) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.premium = premium;
        this.coverageDescription = coverageDescription;
        this.deductibleAmount = deductibleAmount;
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

    public String getCoverageDescription() {
        return coverageDescription;
    }

    public void setCoverageDescription(String coverageDescription) {
        this.coverageDescription = coverageDescription;
    }

    public BigDecimal getDeductibleAmount() {
        return deductibleAmount;
    }

    public void setDeductibleAmount(BigDecimal deductibleAmount) {
        this.deductibleAmount = deductibleAmount;
    }
}

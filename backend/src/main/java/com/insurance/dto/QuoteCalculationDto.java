package com.insurance.dto;

import java.math.BigDecimal;

public class QuoteCalculationDto {
    private String productCode;
    private String productName;
    private String coverageDescription;
    private BigDecimal basePremium;
    private BigDecimal riskAdjustment;
    private BigDecimal taxesAndFees;
    private BigDecimal totalPremium;
    private BigDecimal deductibleAmount;
    private BigDecimal brokerCommission;
    private Boolean referralRequired;

    public QuoteCalculationDto() {
    }

    public QuoteCalculationDto(String productCode, String productName, String coverageDescription,
                               BigDecimal basePremium, BigDecimal riskAdjustment, BigDecimal taxesAndFees,
                               BigDecimal totalPremium, BigDecimal deductibleAmount) {
        this.productCode = productCode;
        this.productName = productName;
        this.coverageDescription = coverageDescription;
        this.basePremium = basePremium;
        this.riskAdjustment = riskAdjustment;
        this.taxesAndFees = taxesAndFees;
        this.totalPremium = totalPremium;
        this.deductibleAmount = deductibleAmount;
        this.brokerCommission = BigDecimal.ZERO;
        this.referralRequired = false;
    }

    public QuoteCalculationDto(String productCode, String productName, String coverageDescription,
                               BigDecimal basePremium, BigDecimal riskAdjustment, BigDecimal taxesAndFees,
                               BigDecimal totalPremium, BigDecimal deductibleAmount,
                               BigDecimal brokerCommission, Boolean referralRequired) {
        this.productCode = productCode;
        this.productName = productName;
        this.coverageDescription = coverageDescription;
        this.basePremium = basePremium;
        this.riskAdjustment = riskAdjustment;
        this.taxesAndFees = taxesAndFees;
        this.totalPremium = totalPremium;
        this.deductibleAmount = deductibleAmount;
        this.brokerCommission = brokerCommission;
        this.referralRequired = referralRequired;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getCoverageDescription() {
        return coverageDescription;
    }

    public void setCoverageDescription(String coverageDescription) {
        this.coverageDescription = coverageDescription;
    }

    public BigDecimal getBasePremium() {
        return basePremium;
    }

    public void setBasePremium(BigDecimal basePremium) {
        this.basePremium = basePremium;
    }

    public BigDecimal getRiskAdjustment() {
        return riskAdjustment;
    }

    public void setRiskAdjustment(BigDecimal riskAdjustment) {
        this.riskAdjustment = riskAdjustment;
    }

    public BigDecimal getTaxesAndFees() {
        return taxesAndFees;
    }

    public void setTaxesAndFees(BigDecimal taxesAndFees) {
        this.taxesAndFees = taxesAndFees;
    }

    public BigDecimal getTotalPremium() {
        return totalPremium;
    }

    public void setTotalPremium(BigDecimal totalPremium) {
        this.totalPremium = totalPremium;
    }

    public BigDecimal getDeductibleAmount() {
        return deductibleAmount;
    }

    public void setDeductibleAmount(BigDecimal deductibleAmount) {
        this.deductibleAmount = deductibleAmount;
    }

    public BigDecimal getBrokerCommission() {
        return brokerCommission;
    }

    public void setBrokerCommission(BigDecimal brokerCommission) {
        this.brokerCommission = brokerCommission;
    }

    public Boolean getReferralRequired() {
        return referralRequired;
    }

    public void setReferralRequired(Boolean referralRequired) {
        this.referralRequired = referralRequired;
    }
}

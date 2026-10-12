package com.insurance.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class TariffDto {
    private Long id;
    private String productCode;
    private String productName;
    private BigDecimal baseRatePercentage;
    private BigDecimal minPremium;
    private BigDecimal taxPercentage;
    private BigDecimal standardExcess;
    private BigDecimal maxLoadingPercentage;
    private BigDecimal maxDiscountPercentage;
    private BigDecimal brokerCommissionPercentage;
    private BigDecimal thirdPartyPropertyLimit;
    private Boolean active;
    private String updatedBy;
    private OffsetDateTime updatedAt;

    public TariffDto() {
    }

    public TariffDto(Long id, String productCode, String productName, BigDecimal baseRatePercentage,
                     BigDecimal minPremium, BigDecimal taxPercentage, BigDecimal standardExcess,
                     BigDecimal maxLoadingPercentage, BigDecimal maxDiscountPercentage,
                     BigDecimal brokerCommissionPercentage, BigDecimal thirdPartyPropertyLimit,
                     Boolean active, String updatedBy, OffsetDateTime updatedAt) {
        this.id = id;
        this.productCode = productCode;
        this.productName = productName;
        this.baseRatePercentage = baseRatePercentage;
        this.minPremium = minPremium;
        this.taxPercentage = taxPercentage;
        this.standardExcess = standardExcess;
        this.maxLoadingPercentage = maxLoadingPercentage;
        this.maxDiscountPercentage = maxDiscountPercentage;
        this.brokerCommissionPercentage = brokerCommissionPercentage;
        this.thirdPartyPropertyLimit = thirdPartyPropertyLimit;
        this.active = active;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public BigDecimal getBaseRatePercentage() {
        return baseRatePercentage;
    }

    public void setBaseRatePercentage(BigDecimal baseRatePercentage) {
        this.baseRatePercentage = baseRatePercentage;
    }

    public BigDecimal getMinPremium() {
        return minPremium;
    }

    public void setMinPremium(BigDecimal minPremium) {
        this.minPremium = minPremium;
    }

    public BigDecimal getTaxPercentage() {
        return taxPercentage;
    }

    public void setTaxPercentage(BigDecimal taxPercentage) {
        this.taxPercentage = taxPercentage;
    }

    public BigDecimal getStandardExcess() {
        return standardExcess;
    }

    public void setStandardExcess(BigDecimal standardExcess) {
        this.standardExcess = standardExcess;
    }

    public BigDecimal getMaxLoadingPercentage() {
        return maxLoadingPercentage;
    }

    public void setMaxLoadingPercentage(BigDecimal maxLoadingPercentage) {
        this.maxLoadingPercentage = maxLoadingPercentage;
    }

    public BigDecimal getMaxDiscountPercentage() {
        return maxDiscountPercentage;
    }

    public void setMaxDiscountPercentage(BigDecimal maxDiscountPercentage) {
        this.maxDiscountPercentage = maxDiscountPercentage;
    }

    public BigDecimal getBrokerCommissionPercentage() {
        return brokerCommissionPercentage;
    }

    public void setBrokerCommissionPercentage(BigDecimal brokerCommissionPercentage) {
        this.brokerCommissionPercentage = brokerCommissionPercentage;
    }

    public BigDecimal getThirdPartyPropertyLimit() {
        return thirdPartyPropertyLimit;
    }

    public void setThirdPartyPropertyLimit(BigDecimal thirdPartyPropertyLimit) {
        this.thirdPartyPropertyLimit = thirdPartyPropertyLimit;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

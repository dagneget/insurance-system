package com.insurance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tariffs")
public class Tariff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_code", nullable = false, unique = true, length = 50)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;

    @Column(name = "base_rate_percentage", nullable = false, precision = 6, scale = 4)
    private BigDecimal baseRatePercentage;

    @Column(name = "min_premium", nullable = false, precision = 12, scale = 2)
    private BigDecimal minPremium;

    @Column(name = "tax_percentage", nullable = false, precision = 6, scale = 4)
    private BigDecimal taxPercentage;

    @Column(name = "standard_excess", nullable = false, precision = 12, scale = 2)
    private BigDecimal standardExcess;

    @Column(name = "max_loading_percentage", nullable = false, precision = 6, scale = 4)
    private BigDecimal maxLoadingPercentage;

    @Column(name = "max_discount_percentage", nullable = false, precision = 6, scale = 4)
    private BigDecimal maxDiscountPercentage;

    @Column(name = "broker_commission_percentage", nullable = false, precision = 6, scale = 4)
    private BigDecimal brokerCommissionPercentage;

    @Column(name = "third_party_property_limit", precision = 12, scale = 2)
    private BigDecimal thirdPartyPropertyLimit;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Tariff() {
    }

    public Tariff(String productCode, String productName, BigDecimal baseRatePercentage, BigDecimal minPremium,
                  BigDecimal taxPercentage, BigDecimal standardExcess, BigDecimal maxLoadingPercentage,
                  BigDecimal maxDiscountPercentage, BigDecimal brokerCommissionPercentage) {
        this.productCode = productCode;
        this.productName = productName;
        this.baseRatePercentage = baseRatePercentage;
        this.minPremium = minPremium;
        this.taxPercentage = taxPercentage;
        this.standardExcess = standardExcess;
        this.maxLoadingPercentage = maxLoadingPercentage;
        this.maxDiscountPercentage = maxDiscountPercentage;
        this.brokerCommissionPercentage = brokerCommissionPercentage;
        this.active = true;
    }

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
        if (this.active == null) {
            this.active = true;
        }
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

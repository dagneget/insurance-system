package com.insurance.dto;

import java.math.BigDecimal;

public class UnderwriterAuthorityDto {
    private Long id;
    private Long userId;
    private BigDecimal maxSumInsured;
    private BigDecimal maxLoadingPercentage;
    private BigDecimal maxDiscountPercentage;
    private Boolean canApproveReferrals;

    public UnderwriterAuthorityDto() {
    }

    public UnderwriterAuthorityDto(Long id, Long userId, BigDecimal maxSumInsured,
                                  BigDecimal maxLoadingPercentage, BigDecimal maxDiscountPercentage,
                                  Boolean canApproveReferrals) {
        this.id = id;
        this.userId = userId;
        this.maxSumInsured = maxSumInsured;
        this.maxLoadingPercentage = maxLoadingPercentage;
        this.maxDiscountPercentage = maxDiscountPercentage;
        this.canApproveReferrals = canApproveReferrals;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public BigDecimal getMaxSumInsured() {
        return maxSumInsured;
    }

    public void setMaxSumInsured(BigDecimal maxSumInsured) {
        this.maxSumInsured = maxSumInsured;
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

    public Boolean getCanApproveReferrals() {
        return canApproveReferrals;
    }

    public void setCanApproveReferrals(Boolean canApproveReferrals) {
        this.canApproveReferrals = canApproveReferrals;
    }
}

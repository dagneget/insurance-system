package com.insurance.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class UpdateAuthorityRequest {

    @NotNull(message = "Maximum sum insured is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Maximum sum insured must be greater than zero")
    private BigDecimal maxSumInsured;

    @NotNull(message = "Maximum loading percentage is required")
    @DecimalMin(value = "0.0", message = "Maximum loading cannot be negative")
    @DecimalMax(value = "1.0", message = "Maximum loading cannot exceed 100%")
    private BigDecimal maxLoadingPercentage;

    @NotNull(message = "Maximum discount percentage is required")
    @DecimalMin(value = "0.0", message = "Maximum discount cannot be negative")
    @DecimalMax(value = "1.0", message = "Maximum discount cannot exceed 100%")
    private BigDecimal maxDiscountPercentage;

    @NotNull(message = "canApproveReferrals flag is required")
    private Boolean canApproveReferrals;

    public UpdateAuthorityRequest() {
    }

    public UpdateAuthorityRequest(BigDecimal maxSumInsured, BigDecimal maxLoadingPercentage,
                                  BigDecimal maxDiscountPercentage, Boolean canApproveReferrals) {
        this.maxSumInsured = maxSumInsured;
        this.maxLoadingPercentage = maxLoadingPercentage;
        this.maxDiscountPercentage = maxDiscountPercentage;
        this.canApproveReferrals = canApproveReferrals;
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

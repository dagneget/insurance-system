package com.insurance.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class QuoteCalculationRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Product code is required")
    private String productCode;

    private BigDecimal estimatedValue;

    public QuoteCalculationRequest() {
    }

    public QuoteCalculationRequest(Long vehicleId, String productCode, BigDecimal estimatedValue) {
        this.vehicleId = vehicleId;
        this.productCode = productCode;
        this.estimatedValue = estimatedValue;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public BigDecimal getEstimatedValue() {
        return estimatedValue;
    }

    public void setEstimatedValue(BigDecimal estimatedValue) {
        this.estimatedValue = estimatedValue;
    }
}

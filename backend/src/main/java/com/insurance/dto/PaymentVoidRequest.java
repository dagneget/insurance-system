package com.insurance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PaymentVoidRequest {

    @NotBlank(message = "Void reason is required")
    @Size(max = 255, message = "Void reason must not exceed 255 characters")
    private String voidReason;

    private String makerUsername;
    private String checkerUsername;

    public PaymentVoidRequest() {
    }

    public PaymentVoidRequest(String voidReason) {
        this.voidReason = voidReason;
    }

    public PaymentVoidRequest(String voidReason, String makerUsername, String checkerUsername) {
        this.voidReason = voidReason;
        this.makerUsername = makerUsername;
        this.checkerUsername = checkerUsername;
    }

    public String getVoidReason() {
        return voidReason;
    }

    public void setVoidReason(String voidReason) {
        this.voidReason = voidReason;
    }

    public String getMakerUsername() {
        return makerUsername;
    }

    public void setMakerUsername(String makerUsername) {
        this.makerUsername = makerUsername;
    }

    public String getCheckerUsername() {
        return checkerUsername;
    }

    public void setCheckerUsername(String checkerUsername) {
        this.checkerUsername = checkerUsername;
    }
}

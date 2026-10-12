package com.insurance.dto;

import jakarta.validation.constraints.NotBlank;

public class PolicyCancelRequest {

    @NotBlank(message = "Cancellation reason is required")
    private String cancellationReason;

    public PolicyCancelRequest() {
    }

    public PolicyCancelRequest(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}

package com.insurance.dto;

import com.insurance.entity.ClaimStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ClaimStatusUpdateRequest {

    @NotNull(message = "Claim status is required")
    private ClaimStatus status;

    private String decisionNote;

    private BigDecimal approvedAmount;

    public ClaimStatusUpdateRequest() {
    }

    public ClaimStatusUpdateRequest(ClaimStatus status, String decisionNote, BigDecimal approvedAmount) {
        this.status = status;
        this.decisionNote = decisionNote;
        this.approvedAmount = approvedAmount;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimStatus status) {
        this.status = status;
    }

    public String getDecisionNote() {
        return decisionNote;
    }

    public void setDecisionNote(String decisionNote) {
        this.decisionNote = decisionNote;
    }

    public BigDecimal getApprovedAmount() {
        return approvedAmount;
    }

    public void setApprovedAmount(BigDecimal approvedAmount) {
        this.approvedAmount = approvedAmount;
    }
}

package com.insurance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class EndorsementCreateRequest {

    @NotBlank(message = "Endorsement type is required")
    private String endorsementType;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotBlank(message = "Changes summary is required")
    private String changesSummary;

    @NotNull(message = "Effective date is required")
    private LocalDate effectiveDate;

    public EndorsementCreateRequest() {
    }

    public EndorsementCreateRequest(String endorsementType, String reason, String changesSummary, LocalDate effectiveDate) {
        this.endorsementType = endorsementType;
        this.reason = reason;
        this.changesSummary = changesSummary;
        this.effectiveDate = effectiveDate;
    }

    public String getEndorsementType() {
        return endorsementType;
    }

    public void setEndorsementType(String endorsementType) {
        this.endorsementType = endorsementType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getChangesSummary() {
        return changesSummary;
    }

    public void setChangesSummary(String changesSummary) {
        this.changesSummary = changesSummary;
    }

    public LocalDate getEffectiveDate() {
        return effectiveDate;
    }

    public void setEffectiveDate(LocalDate effectiveDate) {
        this.effectiveDate = effectiveDate;
    }
}

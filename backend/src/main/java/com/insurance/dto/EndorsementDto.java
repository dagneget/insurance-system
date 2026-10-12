package com.insurance.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public class EndorsementDto {
    private Long id;
    private String endorsementNumber;
    private Long policyId;
    private String endorsementType;
    private String reason;
    private String changesSummary;
    private LocalDate effectiveDate;
    private OffsetDateTime createdAt;

    public EndorsementDto() {
    }

    public EndorsementDto(Long id, String endorsementNumber, Long policyId, String endorsementType,
                          String reason, String changesSummary, LocalDate effectiveDate, OffsetDateTime createdAt) {
        this.id = id;
        this.endorsementNumber = endorsementNumber;
        this.policyId = policyId;
        this.endorsementType = endorsementType;
        this.reason = reason;
        this.changesSummary = changesSummary;
        this.effectiveDate = effectiveDate;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEndorsementNumber() {
        return endorsementNumber;
    }

    public void setEndorsementNumber(String endorsementNumber) {
        this.endorsementNumber = endorsementNumber;
    }

    public Long getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Long policyId) {
        this.policyId = policyId;
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

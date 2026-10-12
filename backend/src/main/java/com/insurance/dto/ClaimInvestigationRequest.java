package com.insurance.dto;

import java.math.BigDecimal;

public class ClaimInvestigationRequest {
    private Long assignedAdjusterId;
    private String claimType = "OWN_DAMAGE";
    private String surveyorName;
    private String surveyorNotes;
    private BigDecimal repairEstimate = BigDecimal.ZERO;
    private BigDecimal depreciationAmount = BigDecimal.ZERO;
    private BigDecimal excessApplied = BigDecimal.ZERO;
    private BigDecimal salvageValue = BigDecimal.ZERO;
    private BigDecimal sumInsured;
    private BigDecimal marketValue;
    private String investigationStatus = "COMPLETED";

    public ClaimInvestigationRequest() {}

    public Long getAssignedAdjusterId() {
        return assignedAdjusterId;
    }

    public void setAssignedAdjusterId(Long assignedAdjusterId) {
        this.assignedAdjusterId = assignedAdjusterId;
    }

    public String getClaimType() {
        return claimType;
    }

    public void setClaimType(String claimType) {
        this.claimType = claimType;
    }

    public String getSurveyorName() {
        return surveyorName;
    }

    public void setSurveyorName(String surveyorName) {
        this.surveyorName = surveyorName;
    }

    public String getSurveyorNotes() {
        return surveyorNotes;
    }

    public void setSurveyorNotes(String surveyorNotes) {
        this.surveyorNotes = surveyorNotes;
    }

    public BigDecimal getRepairEstimate() {
        return repairEstimate;
    }

    public void setRepairEstimate(BigDecimal repairEstimate) {
        this.repairEstimate = repairEstimate;
    }

    public BigDecimal getDepreciationAmount() {
        return depreciationAmount;
    }

    public void setDepreciationAmount(BigDecimal depreciationAmount) {
        this.depreciationAmount = depreciationAmount;
    }

    public BigDecimal getExcessApplied() {
        return excessApplied;
    }

    public void setExcessApplied(BigDecimal excessApplied) {
        this.excessApplied = excessApplied;
    }

    public BigDecimal getSalvageValue() {
        return salvageValue;
    }

    public void setSalvageValue(BigDecimal salvageValue) {
        this.salvageValue = salvageValue;
    }

    public BigDecimal getSumInsured() {
        return sumInsured;
    }

    public void setSumInsured(BigDecimal sumInsured) {
        this.sumInsured = sumInsured;
    }

    public BigDecimal getMarketValue() {
        return marketValue;
    }

    public void setMarketValue(BigDecimal marketValue) {
        this.marketValue = marketValue;
    }

    public String getInvestigationStatus() {
        return investigationStatus;
    }

    public void setInvestigationStatus(String investigationStatus) {
        this.investigationStatus = investigationStatus;
    }
}

package com.insurance.dto;

import java.math.BigDecimal;

public class ClaimInvestigationDto {
    private Long id;
    private Long claimId;
    private Long assignedAdjusterId;
    private String assignedAdjusterName;
    private String claimType;
    private String surveyorName;
    private String surveyorNotes;
    private BigDecimal repairEstimate;
    private BigDecimal depreciationAmount;
    private BigDecimal excessApplied;
    private BigDecimal salvageValue;
    private BigDecimal sumInsured;
    private BigDecimal marketValue;
    private Boolean totalLoss;
    private String fraudFlags;
    private BigDecimal recommendedPayout;
    private String investigationStatus;

    public ClaimInvestigationDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getClaimId() {
        return claimId;
    }

    public void setClaimId(Long claimId) {
        this.claimId = claimId;
    }

    public Long getAssignedAdjusterId() {
        return assignedAdjusterId;
    }

    public void setAssignedAdjusterId(Long assignedAdjusterId) {
        this.assignedAdjusterId = assignedAdjusterId;
    }

    public String getAssignedAdjusterName() {
        return assignedAdjusterName;
    }

    public void setAssignedAdjusterName(String assignedAdjusterName) {
        this.assignedAdjusterName = assignedAdjusterName;
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

    public Boolean getTotalLoss() {
        return totalLoss;
    }

    public void setTotalLoss(Boolean totalLoss) {
        this.totalLoss = totalLoss;
    }

    public String getFraudFlags() {
        return fraudFlags;
    }

    public void setFraudFlags(String fraudFlags) {
        this.fraudFlags = fraudFlags;
    }

    public BigDecimal getRecommendedPayout() {
        return recommendedPayout;
    }

    public void setRecommendedPayout(BigDecimal recommendedPayout) {
        this.recommendedPayout = recommendedPayout;
    }

    public String getInvestigationStatus() {
        return investigationStatus;
    }

    public void setInvestigationStatus(String investigationStatus) {
        this.investigationStatus = investigationStatus;
    }
}

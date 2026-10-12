package com.insurance.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;

@Entity
@Table(name = "claim_investigations")
public class ClaimInvestigation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claim_id", unique = true, nullable = false)
    private Claim claim;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_adjuster_id")
    private User assignedAdjuster;

    @Column(name = "claim_type", nullable = false, length = 50)
    private String claimType = "OWN_DAMAGE"; // OWN_DAMAGE, THIRD_PARTY, TOTAL_LOSS

    @Column(name = "surveyor_name", length = 150)
    private String surveyorName;

    @Column(name = "surveyor_notes", columnDefinition = "TEXT")
    private String surveyorNotes;

    @Column(name = "repair_estimate", nullable = false, precision = 12, scale = 2)
    private BigDecimal repairEstimate = BigDecimal.ZERO;

    @Column(name = "depreciation_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal depreciationAmount = BigDecimal.ZERO;

    @Column(name = "excess_applied", nullable = false, precision = 12, scale = 2)
    private BigDecimal excessApplied = BigDecimal.ZERO;

    @Column(name = "salvage_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal salvageValue = BigDecimal.ZERO;

    @Column(name = "sum_insured", precision = 12, scale = 2)
    private BigDecimal sumInsured;

    @Column(name = "market_value", precision = 12, scale = 2)
    private BigDecimal marketValue;

    @Column(name = "is_total_loss", nullable = false)
    private Boolean totalLoss = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fraud_flags", columnDefinition = "jsonb")
    private String fraudFlags; // JSON string e.g. ["INCIDENT_OUTSIDE_COVER_PERIOD", "LATE_REPORTING"]

    @Column(name = "investigation_status", nullable = false, length = 50)
    private String investigationStatus = "PENDING"; // PENDING, COMPLETED, ESCALATED

    public ClaimInvestigation() {
    }

    public ClaimInvestigation(Claim claim, User assignedAdjuster) {
        this.claim = claim;
        this.assignedAdjuster = assignedAdjuster;
        this.claimType = "OWN_DAMAGE";
        this.repairEstimate = BigDecimal.ZERO;
        this.depreciationAmount = BigDecimal.ZERO;
        this.excessApplied = BigDecimal.ZERO;
        this.salvageValue = BigDecimal.ZERO;
        this.totalLoss = false;
        this.investigationStatus = "PENDING";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Claim getClaim() {
        return claim;
    }

    public void setClaim(Claim claim) {
        this.claim = claim;
    }

    public User getAssignedAdjuster() {
        return assignedAdjuster;
    }

    public void setAssignedAdjuster(User assignedAdjuster) {
        this.assignedAdjuster = assignedAdjuster;
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

    public String getInvestigationStatus() {
        return investigationStatus;
    }

    public void setInvestigationStatus(String investigationStatus) {
        this.investigationStatus = investigationStatus;
    }
}

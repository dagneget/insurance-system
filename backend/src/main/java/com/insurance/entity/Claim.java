package com.insurance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "claim_number", nullable = false, unique = true, length = 50)
    private String claimNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @Column(name = "incident_date", nullable = false)
    private LocalDate incidentDate;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "requested_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal requestedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ClaimStatus status;

    @Column(name = "decision_note", columnDefinition = "TEXT")
    private String decisionNote;

    @Column(name = "approved_amount", precision = 15, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "decision_date")
    private OffsetDateTime decisionDate;

    @Column(name = "settlement_amount", precision = 15, scale = 2)
    private BigDecimal settlementAmount;

    @Column(name = "settlement_reference", length = 100)
    private String settlementReference;

    @Column(name = "settlement_note", columnDefinition = "TEXT")
    private String settlementNote;

    @Column(name = "settlement_date")
    private OffsetDateTime settlementDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL)
    private ClaimInvestigation investigation;

    @OneToOne(mappedBy = "claim", cascade = CascadeType.ALL)
    private ClaimPayout payout;

    public Claim() {
    }

    public Claim(String claimNumber, Policy policy, LocalDate incidentDate,
                 String description, BigDecimal requestedAmount) {
        this.claimNumber = claimNumber;
        this.policy = policy;
        this.incidentDate = incidentDate;
        this.description = description;
        this.requestedAmount = requestedAmount;
        this.status = ClaimStatus.SUBMITTED;
    }

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (status == null) {
            status = ClaimStatus.SUBMITTED;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClaimNumber() {
        return claimNumber;
    }

    public void setClaimNumber(String claimNumber) {
        this.claimNumber = claimNumber;
    }

    public Policy getPolicy() {
        return policy;
    }

    public void setPolicy(Policy policy) {
        this.policy = policy;
    }

    public LocalDate getIncidentDate() {
        return incidentDate;
    }

    public void setIncidentDate(LocalDate incidentDate) {
        this.incidentDate = incidentDate;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getRequestedAmount() {
        return requestedAmount;
    }

    public void setRequestedAmount(BigDecimal requestedAmount) {
        this.requestedAmount = requestedAmount;
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

    public OffsetDateTime getDecisionDate() {
        return decisionDate;
    }

    public void setDecisionDate(OffsetDateTime decisionDate) {
        this.decisionDate = decisionDate;
    }

    public BigDecimal getSettlementAmount() {
        return settlementAmount;
    }

    public void setSettlementAmount(BigDecimal settlementAmount) {
        this.settlementAmount = settlementAmount;
    }

    public String getSettlementReference() {
        return settlementReference;
    }

    public void setSettlementReference(String settlementReference) {
        this.settlementReference = settlementReference;
    }

    public String getSettlementNote() {
        return settlementNote;
    }

    public void setSettlementNote(String settlementNote) {
        this.settlementNote = settlementNote;
    }

    public OffsetDateTime getSettlementDate() {
        return settlementDate;
    }

    public void setSettlementDate(OffsetDateTime settlementDate) {
        this.settlementDate = settlementDate;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public ClaimInvestigation getInvestigation() {
        return investigation;
    }

    public void setInvestigation(ClaimInvestigation investigation) {
        this.investigation = investigation;
    }

    public ClaimPayout getPayout() {
        return payout;
    }

    public void setPayout(ClaimPayout payout) {
        this.payout = payout;
    }
}

package com.insurance.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "endorsements")
public class Endorsement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "endorsement_number", nullable = false, unique = true, length = 50)
    private String endorsementNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    @Column(name = "endorsement_type", nullable = false, length = 50)
    private String endorsementType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "changes_summary", nullable = false, columnDefinition = "TEXT")
    private String changesSummary;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public Endorsement() {
    }

    public Endorsement(String endorsementNumber, Policy policy, String endorsementType,
                       String reason, String changesSummary, LocalDate effectiveDate) {
        this.endorsementNumber = endorsementNumber;
        this.policy = policy;
        this.endorsementType = endorsementType;
        this.reason = reason;
        this.changesSummary = changesSummary;
        this.effectiveDate = effectiveDate;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
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

    public Policy getPolicy() {
        return policy;
    }

    public void setPolicy(Policy policy) {
        this.policy = policy;
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

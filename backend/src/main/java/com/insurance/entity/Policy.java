package com.insurance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "policies")
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "policy_number", nullable = false, unique = true, length = 50)
    private String policyNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "coverage_description", nullable = false)
    private String coverageDescription;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal premium;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PolicyStatus status;

    @Column(name = "product_code", nullable = false, length = 50)
    private String productCode = "COMPREHENSIVE";

    @Column(name = "deductible_amount", precision = 15, scale = 2)
    private BigDecimal deductibleAmount = new BigDecimal("500.00");

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent;

    @Column(name = "referral_flag", nullable = false)
    private Boolean referralFlag = false;

    @Column(name = "referral_reason", columnDefinition = "TEXT")
    private String referralReason;

    @Column(name = "underwriting_subjectivities", columnDefinition = "TEXT")
    private String underwritingSubjectivities;

    @Column(name = "vehicle_market_value")
    private BigDecimal vehicleMarketValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renewed_from_id")
    private Policy renewedFrom;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL)
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL)
    private List<Claim> claims = new ArrayList<>();

    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL)
    private List<Endorsement> endorsements = new ArrayList<>();

    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL)
    private List<BillingSchedule> billingSchedules = new ArrayList<>();

    public Policy() {
    }

    public Policy(String policyNumber, Customer customer, Vehicle vehicle, String coverageDescription,
                  LocalDate startDate, LocalDate endDate, BigDecimal premium, PolicyStatus status) {
        this.policyNumber = policyNumber;
        this.customer = customer;
        this.vehicle = vehicle;
        this.coverageDescription = coverageDescription;
        this.startDate = startDate;
        this.endDate = endDate;
        this.premium = premium;
        this.status = status;
    }

    public Policy(String policyNumber, Customer customer, Vehicle vehicle, String coverageDescription,
                  String productCode, BigDecimal deductibleAmount,
                  LocalDate startDate, LocalDate endDate, BigDecimal premium, PolicyStatus status) {
        this.policyNumber = policyNumber;
        this.customer = customer;
        this.vehicle = vehicle;
        this.coverageDescription = coverageDescription;
        this.productCode = productCode != null ? productCode : "COMPREHENSIVE";
        this.deductibleAmount = deductibleAmount != null ? deductibleAmount : new BigDecimal("500.00");
        this.startDate = startDate;
        this.endDate = endDate;
        this.premium = premium;
        this.status = status;
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
            status = PolicyStatus.ISSUED;
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

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public String getCoverageDescription() {
        return coverageDescription;
    }

    public void setCoverageDescription(String coverageDescription) {
        this.coverageDescription = coverageDescription;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public BigDecimal getPremium() {
        return premium;
    }

    public void setPremium(BigDecimal premium) {
        this.premium = premium;
    }

    public PolicyStatus getStatus() {
        return status;
    }

    public void setStatus(PolicyStatus status) {
        this.status = status;
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

    public List<Payment> getPayments() {
        return payments;
    }

    public void setPayments(List<Payment> payments) {
        this.payments = payments;
    }

    public List<Claim> getClaims() {
        return claims;
    }

    public void setClaims(List<Claim> claims) {
        this.claims = claims;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public BigDecimal getDeductibleAmount() {
        return deductibleAmount;
    }

    public void setDeductibleAmount(BigDecimal deductibleAmount) {
        this.deductibleAmount = deductibleAmount;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public OffsetDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(OffsetDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Policy getRenewedFrom() {
        return renewedFrom;
    }

    public void setRenewedFrom(Policy renewedFrom) {
        this.renewedFrom = renewedFrom;
    }

    public List<Endorsement> getEndorsements() {
        return endorsements;
    }

    public void setEndorsements(List<Endorsement> endorsements) {
        this.endorsements = endorsements;
    }

    public User getAgent() {
        return agent;
    }

    public void setAgent(User agent) {
        this.agent = agent;
    }

    public Boolean getReferralFlag() {
        return referralFlag;
    }

    public void setReferralFlag(Boolean referralFlag) {
        this.referralFlag = referralFlag;
    }

    public String getReferralReason() {
        return referralReason;
    }

    public void setReferralReason(String referralReason) {
        this.referralReason = referralReason;
    }

    public String getUnderwritingSubjectivities() {
        return underwritingSubjectivities;
    }

    public void setUnderwritingSubjectivities(String underwritingSubjectivities) {
        this.underwritingSubjectivities = underwritingSubjectivities;
    }

    public BigDecimal getVehicleMarketValue() {
        return vehicleMarketValue;
    }

    public void setVehicleMarketValue(BigDecimal vehicleMarketValue) {
        this.vehicleMarketValue = vehicleMarketValue;
    }

    public List<BillingSchedule> getBillingSchedules() {
        return billingSchedules;
    }

    public void setBillingSchedules(List<BillingSchedule> billingSchedules) {
        this.billingSchedules = billingSchedules;
    }
}

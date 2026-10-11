package com.insurance.dto;

import com.insurance.entity.ClaimStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class ClaimDto {
    private Long id;
    private String claimNumber;
    private Long policyId;
    private String policyNumber;
    private String customerName;
    private String vehicleRegistrationNumber;
    private LocalDate incidentDate;
    private String description;
    private BigDecimal requestedAmount;
    private ClaimStatus status;
    private String decisionNote;
    private BigDecimal approvedAmount;
    private OffsetDateTime decisionDate;
    private BigDecimal settlementAmount;
    private String settlementReference;
    private String settlementNote;
    private OffsetDateTime settlementDate;
    private OffsetDateTime createdAt;

    public ClaimDto() {
    }

    public ClaimDto(Long id, String claimNumber, Long policyId, String policyNumber,
                    String customerName, String vehicleRegistrationNumber, LocalDate incidentDate,
                    String description, BigDecimal requestedAmount, ClaimStatus status,
                    String decisionNote, BigDecimal approvedAmount, OffsetDateTime decisionDate,
                    BigDecimal settlementAmount, String settlementReference, String settlementNote,
                    OffsetDateTime settlementDate, OffsetDateTime createdAt) {
        this.id = id;
        this.claimNumber = claimNumber;
        this.policyId = policyId;
        this.policyNumber = policyNumber;
        this.customerName = customerName;
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
        this.incidentDate = incidentDate;
        this.description = description;
        this.requestedAmount = requestedAmount;
        this.status = status;
        this.decisionNote = decisionNote;
        this.approvedAmount = approvedAmount;
        this.decisionDate = decisionDate;
        this.settlementAmount = settlementAmount;
        this.settlementReference = settlementReference;
        this.settlementNote = settlementNote;
        this.settlementDate = settlementDate;
        this.createdAt = createdAt;
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

    public Long getPolicyId() {
        return policyId;
    }

    public void setPolicyId(Long policyId) {
        this.policyId = policyId;
    }

    public String getPolicyNumber() {
        return policyNumber;
    }

    public void setPolicyNumber(String policyNumber) {
        this.policyNumber = policyNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getVehicleRegistrationNumber() {
        return vehicleRegistrationNumber;
    }

    public void setVehicleRegistrationNumber(String vehicleRegistrationNumber) {
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
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
}

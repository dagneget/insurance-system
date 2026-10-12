package com.insurance.dto;

import com.insurance.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class PaymentDto {
    private Long id;
    private Long policyId;
    private String policyNumber;
    private String customerName;
    private String vehicleRegistrationNumber;
    private BigDecimal amount;
    private String transactionReference;
    private String paymentMethod;
    private PaymentStatus status;
    private String note;
    private String voidReason;
    private OffsetDateTime voidedAt;
    private OffsetDateTime paymentDate;
    private String makerUsername;
    private String checkerUsername;
    private String voidStatus;
    private List<PaymentAllocationDto> allocations = new ArrayList<>();

    public PaymentDto() {
    }

    public PaymentDto(Long id, Long policyId, String policyNumber, String customerName,
                      String vehicleRegistrationNumber, BigDecimal amount,
                      String transactionReference, String paymentMethod, PaymentStatus status,
                      String note, String voidReason, OffsetDateTime voidedAt, OffsetDateTime paymentDate) {
        this.id = id;
        this.policyId = policyId;
        this.policyNumber = policyNumber;
        this.customerName = customerName;
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
        this.amount = amount;
        this.transactionReference = transactionReference;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.note = note;
        this.voidReason = voidReason;
        this.voidedAt = voidedAt;
        this.paymentDate = paymentDate;
    }

    public PaymentDto(Long id, Long policyId, String policyNumber, String customerName,
                      String vehicleRegistrationNumber, BigDecimal amount,
                      String transactionReference, String paymentMethod, PaymentStatus status,
                      String note, String voidReason, OffsetDateTime voidedAt, OffsetDateTime paymentDate,
                      String makerUsername, String checkerUsername, String voidStatus,
                      List<PaymentAllocationDto> allocations) {
        this.id = id;
        this.policyId = policyId;
        this.policyNumber = policyNumber;
        this.customerName = customerName;
        this.vehicleRegistrationNumber = vehicleRegistrationNumber;
        this.amount = amount;
        this.transactionReference = transactionReference;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.note = note;
        this.voidReason = voidReason;
        this.voidedAt = voidedAt;
        this.paymentDate = paymentDate;
        this.makerUsername = makerUsername;
        this.checkerUsername = checkerUsername;
        this.voidStatus = voidStatus;
        this.allocations = allocations != null ? allocations : new ArrayList<>();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getVoidReason() {
        return voidReason;
    }

    public void setVoidReason(String voidReason) {
        this.voidReason = voidReason;
    }

    public OffsetDateTime getVoidedAt() {
        return voidedAt;
    }

    public void setVoidedAt(OffsetDateTime voidedAt) {
        this.voidedAt = voidedAt;
    }

    public OffsetDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(OffsetDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getMakerUsername() {
        return makerUsername;
    }

    public void setMakerUsername(String makerUsername) {
        this.makerUsername = makerUsername;
    }

    public String getCheckerUsername() {
        return checkerUsername;
    }

    public void setCheckerUsername(String checkerUsername) {
        this.checkerUsername = checkerUsername;
    }

    public String getVoidStatus() {
        return voidStatus;
    }

    public void setVoidStatus(String voidStatus) {
        this.voidStatus = voidStatus;
    }

    public List<PaymentAllocationDto> getAllocations() {
        return allocations;
    }

    public void setAllocations(List<PaymentAllocationDto> allocations) {
        this.allocations = allocations;
    }
}

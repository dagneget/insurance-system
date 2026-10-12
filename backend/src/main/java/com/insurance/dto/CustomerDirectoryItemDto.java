package com.insurance.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class CustomerDirectoryItemDto {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private int vehicleCount;
    private int activePoliciesCount;
    private int totalPoliciesCount;
    private BigDecimal totalPremium;
    private BigDecimal totalPaid;
    private BigDecimal outstandingBalance;
    private int openClaimsCount;
    private OffsetDateTime createdAt;

    public CustomerDirectoryItemDto() {
    }

    public CustomerDirectoryItemDto(Long id, String fullName, String phone, String email,
                                   int vehicleCount, int activePoliciesCount, int totalPoliciesCount,
                                   BigDecimal totalPremium, BigDecimal totalPaid,
                                   BigDecimal outstandingBalance, int openClaimsCount,
                                   OffsetDateTime createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.vehicleCount = vehicleCount;
        this.activePoliciesCount = activePoliciesCount;
        this.totalPoliciesCount = totalPoliciesCount;
        this.totalPremium = totalPremium;
        this.totalPaid = totalPaid;
        this.outstandingBalance = outstandingBalance;
        this.openClaimsCount = openClaimsCount;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getVehicleCount() {
        return vehicleCount;
    }

    public void setVehicleCount(int vehicleCount) {
        this.vehicleCount = vehicleCount;
    }

    public int getActivePoliciesCount() {
        return activePoliciesCount;
    }

    public void setActivePoliciesCount(int activePoliciesCount) {
        this.activePoliciesCount = activePoliciesCount;
    }

    public int getTotalPoliciesCount() {
        return totalPoliciesCount;
    }

    public void setTotalPoliciesCount(int totalPoliciesCount) {
        this.totalPoliciesCount = totalPoliciesCount;
    }

    public BigDecimal getTotalPremium() {
        return totalPremium;
    }

    public void setTotalPremium(BigDecimal totalPremium) {
        this.totalPremium = totalPremium;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getOutstandingBalance() {
        return outstandingBalance;
    }

    public void setOutstandingBalance(BigDecimal outstandingBalance) {
        this.outstandingBalance = outstandingBalance;
    }

    public int getOpenClaimsCount() {
        return openClaimsCount;
    }

    public void setOpenClaimsCount(int openClaimsCount) {
        this.openClaimsCount = openClaimsCount;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

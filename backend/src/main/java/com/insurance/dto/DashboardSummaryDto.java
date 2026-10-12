package com.insurance.dto;

import java.math.BigDecimal;

public class DashboardSummaryDto {
    private long totalPolicies;
    private long activePolicies;
    private long draftPolicies;
    private long expiringPoliciesCount;
    private long expiredPoliciesCount;
    private long renewedPoliciesCount;
    private BigDecimal totalPremium;
    private BigDecimal totalPaid;
    private BigDecimal totalOutstanding;
    private long openClaimsCount;
    private long totalCustomers;
    private long totalVehicles;

    public DashboardSummaryDto() {
    }

    public DashboardSummaryDto(long totalPolicies, long activePolicies, long draftPolicies,
                               long expiringPoliciesCount, long expiredPoliciesCount, long renewedPoliciesCount,
                               BigDecimal totalPremium, BigDecimal totalPaid, BigDecimal totalOutstanding,
                               long openClaimsCount, long totalCustomers, long totalVehicles) {
        this.totalPolicies = totalPolicies;
        this.activePolicies = activePolicies;
        this.draftPolicies = draftPolicies;
        this.expiringPoliciesCount = expiringPoliciesCount;
        this.expiredPoliciesCount = expiredPoliciesCount;
        this.renewedPoliciesCount = renewedPoliciesCount;
        this.totalPremium = totalPremium;
        this.totalPaid = totalPaid;
        this.totalOutstanding = totalOutstanding;
        this.openClaimsCount = openClaimsCount;
        this.totalCustomers = totalCustomers;
        this.totalVehicles = totalVehicles;
    }

    public long getTotalPolicies() {
        return totalPolicies;
    }

    public void setTotalPolicies(long totalPolicies) {
        this.totalPolicies = totalPolicies;
    }

    public long getActivePolicies() {
        return activePolicies;
    }

    public void setActivePolicies(long activePolicies) {
        this.activePolicies = activePolicies;
    }

    public long getDraftPolicies() {
        return draftPolicies;
    }

    public void setDraftPolicies(long draftPolicies) {
        this.draftPolicies = draftPolicies;
    }

    public long getExpiringPoliciesCount() {
        return expiringPoliciesCount;
    }

    public void setExpiringPoliciesCount(long expiringPoliciesCount) {
        this.expiringPoliciesCount = expiringPoliciesCount;
    }

    public long getExpiredPoliciesCount() {
        return expiredPoliciesCount;
    }

    public void setExpiredPoliciesCount(long expiredPoliciesCount) {
        this.expiredPoliciesCount = expiredPoliciesCount;
    }

    public long getRenewedPoliciesCount() {
        return renewedPoliciesCount;
    }

    public void setRenewedPoliciesCount(long renewedPoliciesCount) {
        this.renewedPoliciesCount = renewedPoliciesCount;
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

    public BigDecimal getTotalOutstanding() {
        return totalOutstanding;
    }

    public void setTotalOutstanding(BigDecimal totalOutstanding) {
        this.totalOutstanding = totalOutstanding;
    }

    public long getOpenClaimsCount() {
        return openClaimsCount;
    }

    public void setOpenClaimsCount(long openClaimsCount) {
        this.openClaimsCount = openClaimsCount;
    }

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalVehicles() {
        return totalVehicles;
    }

    public void setTotalVehicles(long totalVehicles) {
        this.totalVehicles = totalVehicles;
    }
}

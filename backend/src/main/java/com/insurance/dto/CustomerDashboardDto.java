package com.insurance.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CustomerDashboardDto {
    private CustomerDto customer;
    private CustomerMetrics metrics;
    private List<PolicyDto> policies = new ArrayList<>();
    private List<VehicleDto> vehicles = new ArrayList<>();
    private List<PaymentDto> payments = new ArrayList<>();
    private List<ClaimDto> claims = new ArrayList<>();

    public CustomerDashboardDto() {
    }

    public CustomerDashboardDto(CustomerDto customer, CustomerMetrics metrics,
                               List<PolicyDto> policies, List<VehicleDto> vehicles,
                               List<PaymentDto> payments, List<ClaimDto> claims) {
        this.customer = customer;
        this.metrics = metrics;
        this.policies = policies != null ? policies : new ArrayList<>();
        this.vehicles = vehicles != null ? vehicles : new ArrayList<>();
        this.payments = payments != null ? payments : new ArrayList<>();
        this.claims = claims != null ? claims : new ArrayList<>();
    }

    public CustomerDto getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerDto customer) {
        this.customer = customer;
    }

    public CustomerMetrics getMetrics() {
        return metrics;
    }

    public void setMetrics(CustomerMetrics metrics) {
        this.metrics = metrics;
    }

    public List<PolicyDto> getPolicies() {
        return policies;
    }

    public void setPolicies(List<PolicyDto> policies) {
        this.policies = policies;
    }

    public List<VehicleDto> getVehicles() {
        return vehicles;
    }

    public void setVehicles(List<VehicleDto> vehicles) {
        this.vehicles = vehicles;
    }

    public List<PaymentDto> getPayments() {
        return payments;
    }

    public void setPayments(List<PaymentDto> payments) {
        this.payments = payments;
    }

    public List<ClaimDto> getClaims() {
        return claims;
    }

    public void setClaims(List<ClaimDto> claims) {
        this.claims = claims;
    }

    public static class CustomerMetrics {
        private int totalPolicies;
        private int activePolicies;
        private int totalVehicles;
        private BigDecimal totalPremium = BigDecimal.ZERO;
        private BigDecimal totalPaid = BigDecimal.ZERO;
        private BigDecimal outstandingBalance = BigDecimal.ZERO;
        private int openClaimsCount;

        public CustomerMetrics() {
        }

        public CustomerMetrics(int totalPolicies, int activePolicies, int totalVehicles,
                               BigDecimal totalPremium, BigDecimal totalPaid,
                               BigDecimal outstandingBalance, int openClaimsCount) {
            this.totalPolicies = totalPolicies;
            this.activePolicies = activePolicies;
            this.totalVehicles = totalVehicles;
            this.totalPremium = totalPremium != null ? totalPremium : BigDecimal.ZERO;
            this.totalPaid = totalPaid != null ? totalPaid : BigDecimal.ZERO;
            this.outstandingBalance = outstandingBalance != null ? outstandingBalance : BigDecimal.ZERO;
            this.openClaimsCount = openClaimsCount;
        }

        public int getTotalPolicies() {
            return totalPolicies;
        }

        public void setTotalPolicies(int totalPolicies) {
            this.totalPolicies = totalPolicies;
        }

        public int getActivePolicies() {
            return activePolicies;
        }

        public void setActivePolicies(int activePolicies) {
            this.activePolicies = activePolicies;
        }

        public int getTotalVehicles() {
            return totalVehicles;
        }

        public void setTotalVehicles(int totalVehicles) {
            this.totalVehicles = totalVehicles;
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
    }
}

package com.insurance.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CommissionStatementDto {
    private Long agentId;
    private String agentName;
    private BigDecimal totalGrossPremium;
    private BigDecimal totalCommissionEarned;
    private int totalPoliciesCount;
    private List<CommissionLineItemDto> lineItems = new ArrayList<>();

    public CommissionStatementDto() {}

    public CommissionStatementDto(Long agentId, String agentName, BigDecimal totalGrossPremium,
                                  BigDecimal totalCommissionEarned, int totalPoliciesCount,
                                  List<CommissionLineItemDto> lineItems) {
        this.agentId = agentId;
        this.agentName = agentName;
        this.totalGrossPremium = totalGrossPremium;
        this.totalCommissionEarned = totalCommissionEarned;
        this.totalPoliciesCount = totalPoliciesCount;
        this.lineItems = lineItems;
    }

    public Long getAgentId() {
        return agentId;
    }

    public void setAgentId(Long agentId) {
        this.agentId = agentId;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public BigDecimal getTotalGrossPremium() {
        return totalGrossPremium;
    }

    public void setTotalGrossPremium(BigDecimal totalGrossPremium) {
        this.totalGrossPremium = totalGrossPremium;
    }

    public BigDecimal getTotalCommissionEarned() {
        return totalCommissionEarned;
    }

    public void setTotalCommissionEarned(BigDecimal totalCommissionEarned) {
        this.totalCommissionEarned = totalCommissionEarned;
    }

    public int getTotalPoliciesCount() {
        return totalPoliciesCount;
    }

    public void setTotalPoliciesCount(int totalPoliciesCount) {
        this.totalPoliciesCount = totalPoliciesCount;
    }

    public List<CommissionLineItemDto> getLineItems() {
        return lineItems;
    }

    public void setLineItems(List<CommissionLineItemDto> lineItems) {
        this.lineItems = lineItems;
    }
}

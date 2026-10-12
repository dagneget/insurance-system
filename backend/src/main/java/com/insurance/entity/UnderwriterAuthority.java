package com.insurance.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "underwriter_authorities")
public class UnderwriterAuthority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "max_sum_insured", nullable = false, precision = 12, scale = 2)
    private BigDecimal maxSumInsured;

    @Column(name = "max_loading_percentage", nullable = false, precision = 6, scale = 4)
    private BigDecimal maxLoadingPercentage;

    @Column(name = "max_discount_percentage", nullable = false, precision = 6, scale = 4)
    private BigDecimal maxDiscountPercentage;

    @Column(name = "can_approve_referrals", nullable = false)
    private Boolean canApproveReferrals = false;

    public UnderwriterAuthority() {
    }

    public UnderwriterAuthority(User user, BigDecimal maxSumInsured, BigDecimal maxLoadingPercentage,
                                BigDecimal maxDiscountPercentage, Boolean canApproveReferrals) {
        this.user = user;
        this.maxSumInsured = maxSumInsured;
        this.maxLoadingPercentage = maxLoadingPercentage;
        this.maxDiscountPercentage = maxDiscountPercentage;
        this.canApproveReferrals = canApproveReferrals;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public BigDecimal getMaxSumInsured() {
        return maxSumInsured;
    }

    public void setMaxSumInsured(BigDecimal maxSumInsured) {
        this.maxSumInsured = maxSumInsured;
    }

    public BigDecimal getMaxLoadingPercentage() {
        return maxLoadingPercentage;
    }

    public void setMaxLoadingPercentage(BigDecimal maxLoadingPercentage) {
        this.maxLoadingPercentage = maxLoadingPercentage;
    }

    public BigDecimal getMaxDiscountPercentage() {
        return maxDiscountPercentage;
    }

    public void setMaxDiscountPercentage(BigDecimal maxDiscountPercentage) {
        this.maxDiscountPercentage = maxDiscountPercentage;
    }

    public Boolean getCanApproveReferrals() {
        return canApproveReferrals;
    }

    public void setCanApproveReferrals(Boolean canApproveReferrals) {
        this.canApproveReferrals = canApproveReferrals;
    }
}

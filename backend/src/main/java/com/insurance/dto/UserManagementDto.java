package com.insurance.dto;

import java.time.OffsetDateTime;
import java.util.Set;

public class UserManagementDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private boolean active;
    private Set<String> roles;
    private Long customerId;
    private String customerName;
    private UnderwriterAuthorityDto authority;
    private OffsetDateTime createdAt;

    public UserManagementDto() {
    }

    public UserManagementDto(Long id, String username, String fullName, String email,
                             boolean active, Set<String> roles, Long customerId,
                             String customerName, UnderwriterAuthorityDto authority,
                             OffsetDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.active = active;
        this.roles = roles;
        this.customerId = customerId;
        this.customerName = customerName;
        this.authority = authority;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public UnderwriterAuthorityDto getAuthority() {
        return authority;
    }

    public void setAuthority(UnderwriterAuthorityDto authority) {
        this.authority = authority;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

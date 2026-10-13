package com.insurance.dto;

import java.time.OffsetDateTime;

public class CustomerDto {
    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private int vehicleCount;
    private Long agentId;
    private String agentName;
    private String kycStatus;
    private String loginUsername;
    private String temporaryPassword;

    public CustomerDto() {
    }

    public CustomerDto(Long id, String fullName, String phone, String email,
                       OffsetDateTime createdAt, OffsetDateTime updatedAt, int vehicleCount) {
        this.id = id;
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.vehicleCount = vehicleCount;
    }

    public CustomerDto(Long id, String fullName, String phone, String email,
                       OffsetDateTime createdAt, OffsetDateTime updatedAt, int vehicleCount,
                       Long agentId, String agentName, String kycStatus) {
        this.id = id;
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.vehicleCount = vehicleCount;
        this.agentId = agentId;
        this.agentName = agentName;
        this.kycStatus = kycStatus;
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

    public int getVehicleCount() {
        return vehicleCount;
    }

    public void setVehicleCount(int vehicleCount) {
        this.vehicleCount = vehicleCount;
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

    public String getKycStatus() {
        return kycStatus;
    }

    public void setKycStatus(String kycStatus) {
        this.kycStatus = kycStatus;
    }

    public String getLoginUsername() {
        return loginUsername;
    }

    public void setLoginUsername(String loginUsername) {
        this.loginUsername = loginUsername;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }

    public void setTemporaryPassword(String temporaryPassword) {
        this.temporaryPassword = temporaryPassword;
    }
}

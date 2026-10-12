package com.insurance.dto;

import jakarta.validation.constraints.NotBlank;

public class RoleSwitchRequest {

    @NotBlank(message = "Role is required")
    private String role;

    public RoleSwitchRequest() {
    }

    public RoleSwitchRequest(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}

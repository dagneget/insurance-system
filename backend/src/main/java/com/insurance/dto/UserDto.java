package com.insurance.dto;

import java.util.Set;

public class UserDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private Long customerId;
    private Set<String> roles;
    private String activeRole;
    private String authToken;

    public UserDto() {
    }

    public UserDto(Long id, String username, String fullName, String email,
                   Long customerId, Set<String> roles, String activeRole, String authToken) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.customerId = customerId;
        this.roles = roles;
        this.activeRole = activeRole;
        this.authToken = authToken;
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

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public String getActiveRole() {
        return activeRole;
    }

    public void setActiveRole(String activeRole) {
        this.activeRole = activeRole;
    }

    public String getAuthToken() {
        return authToken;
    }

    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }
}

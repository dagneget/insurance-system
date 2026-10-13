package com.insurance.dto;

public class ClientOnboardingResponseDto {
    private CustomerDto customer;
    private VehicleDto vehicle;
    private String message;
    private String loginUsername;
    private String temporaryPassword;

    public ClientOnboardingResponseDto() {}

    public ClientOnboardingResponseDto(CustomerDto customer, VehicleDto vehicle, String message) {
        this.customer = customer;
        this.vehicle = vehicle;
        this.message = message;
    }

    public ClientOnboardingResponseDto(CustomerDto customer, VehicleDto vehicle, String message, String loginUsername, String temporaryPassword) {
        this.customer = customer;
        this.vehicle = vehicle;
        this.message = message;
        this.loginUsername = loginUsername;
        this.temporaryPassword = temporaryPassword;
    }

    public CustomerDto getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerDto customer) {
        this.customer = customer;
    }

    public VehicleDto getVehicle() {
        return vehicle;
    }

    public void setVehicle(VehicleDto vehicle) {
        this.vehicle = vehicle;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

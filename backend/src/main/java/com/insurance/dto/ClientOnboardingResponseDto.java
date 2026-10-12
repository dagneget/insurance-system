package com.insurance.dto;

public class ClientOnboardingResponseDto {
    private CustomerDto customer;
    private VehicleDto vehicle;
    private String message;

    public ClientOnboardingResponseDto() {}

    public ClientOnboardingResponseDto(CustomerDto customer, VehicleDto vehicle, String message) {
        this.customer = customer;
        this.vehicle = vehicle;
        this.message = message;
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
}

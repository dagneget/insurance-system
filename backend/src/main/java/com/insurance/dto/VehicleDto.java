package com.insurance.dto;

import java.time.OffsetDateTime;

public class VehicleDto {
    private Long id;
    private Long customerId;
    private String customerName;
    private String registrationNumber;
    private String make;
    private String model;
    private Integer manufactureYear;
    private OffsetDateTime createdAt;

    public VehicleDto() {
    }

    public VehicleDto(Long id, Long customerId, String customerName, String registrationNumber,
                      String make, String model, Integer manufactureYear, OffsetDateTime createdAt) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.registrationNumber = registrationNumber;
        this.make = make;
        this.model = model;
        this.manufactureYear = manufactureYear;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Integer getManufactureYear() {
        return manufactureYear;
    }

    public void setManufactureYear(Integer manufactureYear) {
        this.manufactureYear = manufactureYear;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

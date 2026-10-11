package com.insurance.service;

import com.insurance.dto.VehicleCreateRequest;
import com.insurance.dto.VehicleDto;
import com.insurance.entity.Customer;
import com.insurance.entity.Vehicle;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.CustomerRepository;
import com.insurance.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;

    public VehicleService(VehicleRepository vehicleRepository, CustomerRepository customerRepository) {
        this.vehicleRepository = vehicleRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<VehicleDto> getVehicles(String search) {
        List<Vehicle> vehicles = vehicleRepository.search(search);
        return vehicles.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VehicleDto> getVehiclesByCustomer(Long customerId) {
        return vehicleRepository.findByCustomerIdOrderByIdDesc(customerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehicleDto getVehicleById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found with id: " + id));
        return toDto(vehicle);
    }

    @Transactional
    public VehicleDto createVehicle(VehicleCreateRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        String regNo = request.getRegistrationNumber().trim().toUpperCase();
        if (vehicleRepository.existsByRegistrationNumber(regNo)) {
            throw new BusinessRuleException("Vehicle with registration number '" + regNo + "' already exists");
        }

        Vehicle vehicle = new Vehicle(
                customer,
                regNo,
                request.getMake().trim(),
                request.getModel().trim(),
                request.getManufactureYear()
        );

        Vehicle saved = vehicleRepository.save(vehicle);
        return toDto(saved);
    }

    public VehicleDto toDto(Vehicle vehicle) {
        return new VehicleDto(
                vehicle.getId(),
                vehicle.getCustomer().getId(),
                vehicle.getCustomer().getFullName(),
                vehicle.getRegistrationNumber(),
                vehicle.getMake(),
                vehicle.getModel(),
                vehicle.getManufactureYear(),
                vehicle.getCreatedAt()
        );
    }
}

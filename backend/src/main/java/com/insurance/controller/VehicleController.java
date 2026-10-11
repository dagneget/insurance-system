package com.insurance.controller;

import com.insurance.dto.VehicleCreateRequest;
import com.insurance.dto.VehicleDto;
import com.insurance.service.VehicleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<List<VehicleDto>> getVehicles(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long customerId) {
        if (customerId != null) {
            return ResponseEntity.ok(vehicleService.getVehiclesByCustomer(customerId));
        }
        return ResponseEntity.ok(vehicleService.getVehicles(search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDto> getVehicleById(@PathVariable Long id) {
        return ResponseEntity.ok(vehicleService.getVehicleById(id));
    }

    @PostMapping
    public ResponseEntity<VehicleDto> createVehicle(
            @Valid @RequestBody VehicleCreateRequest request) {
        VehicleDto created = vehicleService.createVehicle(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}

package com.insurance.service;

import com.insurance.dto.CustomerCreateRequest;
import com.insurance.dto.CustomerDto;
import com.insurance.entity.Customer;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> getCustomers(String search) {
        List<Customer> customers = customerRepository.search(search);
        return customers.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return toDto(customer);
    }

    @Transactional
    public CustomerDto createCustomer(CustomerCreateRequest request) {
        Customer customer = new Customer(
                request.getFullName().trim(),
                request.getPhone().trim(),
                request.getEmail() != null ? request.getEmail().trim() : null
        );
        Customer saved = customerRepository.save(customer);
        return toDto(saved);
    }

    public CustomerDto toDto(Customer customer) {
        int vehicleCount = customer.getVehicles() != null ? customer.getVehicles().size() : 0;
        return new CustomerDto(
                customer.getId(),
                customer.getFullName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.getCreatedAt(),
                customer.getUpdatedAt(),
                vehicleCount
        );
    }
}

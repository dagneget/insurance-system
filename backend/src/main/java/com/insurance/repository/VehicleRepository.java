package com.insurance.repository;

import com.insurance.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByRegistrationNumber(String registrationNumber);

    boolean existsByRegistrationNumber(String registrationNumber);

    List<Vehicle> findByCustomerIdOrderByIdDesc(Long customerId);

    @Query("SELECT v FROM Vehicle v JOIN FETCH v.customer c WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(v.registrationNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.make) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(v.model) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY v.id DESC")
    List<Vehicle> search(@Param("search") String search);
}

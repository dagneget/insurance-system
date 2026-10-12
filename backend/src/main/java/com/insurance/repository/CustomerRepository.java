package com.insurance.repository;

import com.insurance.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT c FROM Customer c WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "c.phone LIKE CONCAT('%', :search, '%')) " +
           "ORDER BY c.id DESC")
    List<Customer> search(@Param("search") String search);

    List<Customer> findByAgentIdOrderByIdDesc(Long agentId);
}

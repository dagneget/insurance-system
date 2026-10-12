package com.insurance.repository;

import com.insurance.entity.Tariff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TariffRepository extends JpaRepository<Tariff, Long> {
    Optional<Tariff> findByProductCode(String productCode);
    List<Tariff> findByActiveTrue();
}

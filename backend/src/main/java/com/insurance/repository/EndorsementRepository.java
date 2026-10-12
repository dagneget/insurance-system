package com.insurance.repository;

import com.insurance.entity.Endorsement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EndorsementRepository extends JpaRepository<Endorsement, Long> {
    List<Endorsement> findByPolicyIdOrderByCreatedAtDesc(Long policyId);
    boolean existsByEndorsementNumber(String endorsementNumber);
}

package com.insurance.repository;

import com.insurance.entity.DocumentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentAttachmentRepository extends JpaRepository<DocumentAttachment, Long> {
    List<DocumentAttachment> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);
}

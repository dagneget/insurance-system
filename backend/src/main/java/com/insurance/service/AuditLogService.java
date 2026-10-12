package com.insurance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.entity.AuditLog;
import com.insurance.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Appends an immutable audit log entry. Runs with REQUIRES_NEW to ensure audit records persist
     * independently of surrounding transaction status.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordAction(String actorUsername, String actorRole, String action,
                             String entityType, Long entityId,
                             Object oldValue, Object newValue, String ipAddress) {
        try {
            String oldJson = oldValue != null ? (oldValue instanceof String ? (String) oldValue : objectMapper.writeValueAsString(oldValue)) : null;
            String newJson = newValue != null ? (newValue instanceof String ? (String) newValue : objectMapper.writeValueAsString(newValue)) : null;

            AuditLog entry = new AuditLog(
                    actorUsername != null ? actorUsername : "SYSTEM",
                    actorRole != null ? actorRole : "ROLE_SYSTEM",
                    action,
                    entityType,
                    entityId,
                    oldJson,
                    newJson,
                    ipAddress
            );

            auditLogRepository.save(entry);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize audit log snapshots for action: {}", action, e);
            AuditLog fallbackEntry = new AuditLog(
                    actorUsername != null ? actorUsername : "SYSTEM",
                    actorRole != null ? actorRole : "ROLE_SYSTEM",
                    action,
                    entityType,
                    entityId,
                    null,
                    null,
                    ipAddress
            );
            auditLogRepository.save(fallbackEntry);
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentAuditLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getPagedAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsForEntity(String entityType, Long entityId) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
    }
}

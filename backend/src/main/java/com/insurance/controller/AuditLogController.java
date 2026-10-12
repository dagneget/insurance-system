package com.insurance.controller;

import com.insurance.entity.AuditLog;
import com.insurance.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getRecentAuditLogs() {
        return ResponseEntity.ok(auditLogService.getRecentAuditLogs());
    }

    @GetMapping("/entity")
    public ResponseEntity<List<AuditLog>> getAuditLogsForEntity(
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") Long entityId) {
        return ResponseEntity.ok(auditLogService.getAuditLogsForEntity(entityType, entityId));
    }
}

package com.insurance.controller;

import com.insurance.entity.Notification;
import com.insurance.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "customerId", required = false) Long customerId) {
        return ResponseEntity.ok(notificationService.getNotificationsForActor(userId, role, customerId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }
}

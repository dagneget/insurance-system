package com.insurance.controller;

import com.insurance.dto.CreateUserRequest;
import com.insurance.dto.UpdateAuthorityRequest;
import com.insurance.dto.UserManagementDto;
import com.insurance.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<List<UserManagementDto>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserManagementDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserManagementDto> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @RequestParam(value = "adminUsername", required = false, defaultValue = "elena.manager") String adminUsername) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createUser(request, adminUsername));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserManagementDto> updateUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> statusMap,
            @RequestParam(value = "adminUsername", required = false, defaultValue = "elena.manager") String adminUsername) {
        Boolean active = statusMap.getOrDefault("active", true);
        return ResponseEntity.ok(adminUserService.updateUserStatus(id, active, adminUsername));
    }

    @PutMapping("/{id}/authority")
    public ResponseEntity<UserManagementDto> updateUnderwriterAuthority(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAuthorityRequest request,
            @RequestParam(value = "adminUsername", required = false, defaultValue = "elena.manager") String adminUsername) {
        return ResponseEntity.ok(adminUserService.updateAuthority(id, request, adminUsername));
    }
}

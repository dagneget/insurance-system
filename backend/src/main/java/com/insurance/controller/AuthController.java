package com.insurance.controller;

import com.insurance.dto.LoginRequest;
import com.insurance.dto.RoleSwitchRequest;
import com.insurance.dto.UserDto;
import com.insurance.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(required = false) String activeRole) {
        return ResponseEntity.ok(authService.getCurrentUser(authHeader, activeRole));
    }

    @PostMapping("/switch-role")
    public ResponseEntity<UserDto> switchRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody RoleSwitchRequest request) {
        return ResponseEntity.ok(authService.switchRole(authHeader, request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.logout(authHeader);
        return ResponseEntity.noContent().build();
    }
}

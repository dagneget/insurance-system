package com.insurance.service;

import com.insurance.dto.LoginRequest;
import com.insurance.dto.RoleSwitchRequest;
import com.insurance.dto.UserDto;
import com.insurance.entity.User;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserDto login(LoginRequest request) {
        String username = request.getUsername().trim();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessRuleException("Invalid username or password"));

        if (!user.isActive()) {
            throw new BusinessRuleException("User account is inactive");
        }

        String inputHash = hashPassword(request.getPassword().trim());
        if (!inputHash.equalsIgnoreCase(user.getPasswordHash())) {
            throw new BusinessRuleException("Invalid username or password");
        }

        // Generate persistent session token
        String token = "TOKEN-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
        user.setAuthToken(token);
        userRepository.save(user);

        String defaultRole = resolveDefaultRole(user);
        return toDto(user, defaultRole);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String token, String requestedRole) {
        String cleanToken = cleanToken(token);
        User user = userRepository.findByAuthToken(cleanToken)
                .orElseThrow(() -> new ResourceNotFoundException("Active session not found or expired"));

        if (!user.isActive()) {
            throw new BusinessRuleException("User account is inactive");
        }

        String activeRole = requestedRole != null && user.getRoles().contains(requestedRole)
                ? requestedRole
                : resolveDefaultRole(user);

        return toDto(user, activeRole);
    }

    @Transactional(readOnly = true)
    public UserDto switchRole(String token, RoleSwitchRequest request) {
        String cleanToken = cleanToken(token);
        User user = userRepository.findByAuthToken(cleanToken)
                .orElseThrow(() -> new ResourceNotFoundException("Active session not found or expired"));

        String targetRole = request.getRole().trim();
        if (!user.getRoles().contains(targetRole)) {
            throw new BusinessRuleException("User is not authorized for requested role: " + targetRole);
        }

        return toDto(user, targetRole);
    }

    @Transactional
    public void logout(String token) {
        String cleanToken = cleanToken(token);
        userRepository.findByAuthToken(cleanToken).ifPresent(user -> {
            user.setAuthToken(null);
            userRepository.save(user);
        });
    }

    public UserDto toDto(User user, String activeRole) {
        Long customerId = user.getCustomer() != null ? user.getCustomer().getId() : null;
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                customerId,
                user.getRoles(),
                activeRole,
                user.getAuthToken()
        );
    }

    public String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String cleanToken(String token) {
        if (token == null) {
            return "";
        }
        if (token.startsWith("Bearer ")) {
            return token.substring(7).trim();
        }
        return token.trim();
    }

    private String resolveDefaultRole(User user) {
        if (user.getRoles().contains("ROLE_ADMIN")) return "ROLE_ADMIN";
        if (user.getRoles().contains("ROLE_UNDERWRITER")) return "ROLE_UNDERWRITER";
        if (user.getRoles().contains("ROLE_CLAIMS_OFFICER")) return "ROLE_CLAIMS_OFFICER";
        if (user.getRoles().contains("ROLE_FINANCE_OFFICER")) return "ROLE_FINANCE_OFFICER";
        if (user.getRoles().contains("ROLE_AGENT")) return "ROLE_AGENT";
        if (user.getRoles().contains("ROLE_CUSTOMER")) return "ROLE_CUSTOMER";
        return user.getRoles().stream().findFirst().orElse("ROLE_CUSTOMER");
    }
}

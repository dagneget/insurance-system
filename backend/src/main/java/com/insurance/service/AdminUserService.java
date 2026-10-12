package com.insurance.service;

import com.insurance.dto.CreateUserRequest;
import com.insurance.dto.UnderwriterAuthorityDto;
import com.insurance.dto.UpdateAuthorityRequest;
import com.insurance.dto.UserManagementDto;
import com.insurance.entity.Customer;
import com.insurance.entity.UnderwriterAuthority;
import com.insurance.entity.User;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.CustomerRepository;
import com.insurance.repository.UnderwriterAuthorityRepository;
import com.insurance.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final UnderwriterAuthorityRepository authorityRepository;
    private final CustomerRepository customerRepository;
    private final AuthService authService;
    private final AuditLogService auditLogService;

    public AdminUserService(UserRepository userRepository,
                            UnderwriterAuthorityRepository authorityRepository,
                            CustomerRepository customerRepository,
                            AuthService authService,
                            AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.authorityRepository = authorityRepository;
        this.customerRepository = customerRepository;
        this.authService = authService;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<UserManagementDto> getAllUsers() {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        Map<Long, UnderwriterAuthority> authorityMap = authorityRepository.findAll().stream()
                .filter(a -> a.getUser() != null)
                .collect(Collectors.toMap(a -> a.getUser().getId(), a -> a, (k1, k2) -> k1));

        return users.stream()
                .map(u -> toDto(u, authorityMap.get(u.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserManagementDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        UnderwriterAuthority authority = authorityRepository.findByUserId(id).orElse(null);
        return toDto(user, authority);
    }

    @Transactional
    public UserManagementDto createUser(CreateUserRequest request, String adminUsername) {
        String username = request.getUsername().trim();
        if (userRepository.existsByUsername(username)) {
            throw new BusinessRuleException("Username '" + username + "' is already taken");
        }

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));
        }

        String passwordHash = authService.hashPassword(request.getPassword().trim());
        User user = new User(
                username,
                passwordHash,
                request.getFullName().trim(),
                request.getEmail() != null ? request.getEmail().trim() : null,
                customer
        );
        user.setRoles(request.getRoles());
        user.setActive(true);
        User savedUser = userRepository.save(user);

        UnderwriterAuthority authority = null;
        if (request.getRoles().contains("ROLE_UNDERWRITER")) {
            authority = new UnderwriterAuthority(
                    savedUser,
                    BigDecimal.valueOf(50000.00),
                    BigDecimal.valueOf(0.2000),
                    BigDecimal.valueOf(0.1500),
                    false
            );
            authority = authorityRepository.save(authority);
        }

        auditLogService.recordAction(
                adminUsername,
                "ROLE_ADMIN",
                "CREATE_USER",
                "User",
                savedUser.getId(),
                null,
                Map.of("username", savedUser.getUsername(), "roles", savedUser.getRoles()),
                null
        );

        return toDto(savedUser, authority);
    }

    @Transactional
    public UserManagementDto updateUserStatus(Long userId, boolean active, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getUsername().equalsIgnoreCase(adminUsername) && !active) {
            throw new BusinessRuleException("Administrators cannot deactivate their own account");
        }

        boolean oldStatus = user.isActive();
        user.setActive(active);
        User updated = userRepository.save(user);

        auditLogService.recordAction(
                adminUsername,
                "ROLE_ADMIN",
                active ? "ACTIVATE_USER" : "DEACTIVATE_USER",
                "User",
                updated.getId(),
                Map.of("active", oldStatus),
                Map.of("active", active),
                null
        );

        UnderwriterAuthority authority = authorityRepository.findByUserId(userId).orElse(null);
        return toDto(updated, authority);
    }

    @Transactional
    public UserManagementDto updateAuthority(Long userId, UpdateAuthorityRequest request, String adminUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UnderwriterAuthority authority = authorityRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UnderwriterAuthority newAuth = new UnderwriterAuthority();
                    newAuth.setUser(user);
                    return newAuth;
                });

        Map<String, Object> oldSnapshot = authority.getId() != null ? Map.of(
                "maxSumInsured", authority.getMaxSumInsured(),
                "maxLoadingPercentage", authority.getMaxLoadingPercentage(),
                "maxDiscountPercentage", authority.getMaxDiscountPercentage(),
                "canApproveReferrals", authority.getCanApproveReferrals()
        ) : null;

        authority.setMaxSumInsured(request.getMaxSumInsured());
        authority.setMaxLoadingPercentage(request.getMaxLoadingPercentage());
        authority.setMaxDiscountPercentage(request.getMaxDiscountPercentage());
        authority.setCanApproveReferrals(request.getCanApproveReferrals());
        UnderwriterAuthority savedAuthority = authorityRepository.save(authority);

        // Ensure user has ROLE_UNDERWRITER
        if (!user.getRoles().contains("ROLE_UNDERWRITER")) {
            user.getRoles().add("ROLE_UNDERWRITER");
            userRepository.save(user);
        }

        auditLogService.recordAction(
                adminUsername,
                "ROLE_ADMIN",
                "UPDATE_UNDERWRITER_AUTHORITY",
                "UnderwriterAuthority",
                savedAuthority.getId(),
                oldSnapshot,
                Map.of(
                        "maxSumInsured", savedAuthority.getMaxSumInsured(),
                        "maxLoadingPercentage", savedAuthority.getMaxLoadingPercentage(),
                        "maxDiscountPercentage", savedAuthority.getMaxDiscountPercentage(),
                        "canApproveReferrals", savedAuthority.getCanApproveReferrals()
                ),
                null
        );

        return toDto(user, savedAuthority);
    }

    private UserManagementDto toDto(User user, UnderwriterAuthority authority) {
        UnderwriterAuthorityDto authDto = null;
        if (authority != null) {
            authDto = new UnderwriterAuthorityDto(
                    authority.getId(),
                    user.getId(),
                    authority.getMaxSumInsured(),
                    authority.getMaxLoadingPercentage(),
                    authority.getMaxDiscountPercentage(),
                    authority.getCanApproveReferrals()
            );
        }

        Long custId = user.getCustomer() != null ? user.getCustomer().getId() : null;
        String custName = user.getCustomer() != null ? user.getCustomer().getFullName() : null;

        return new UserManagementDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.isActive(),
                user.getRoles(),
                custId,
                custName,
                authDto,
                user.getCreatedAt()
        );
    }
}

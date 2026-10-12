package com.insurance.service;

import com.insurance.dto.CreateUserRequest;
import com.insurance.dto.TariffDto;
import com.insurance.dto.UpdateAuthorityRequest;
import com.insurance.dto.UserManagementDto;
import com.insurance.entity.Tariff;
import com.insurance.entity.UnderwriterAuthority;
import com.insurance.entity.User;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.CustomerRepository;
import com.insurance.repository.TariffRepository;
import com.insurance.repository.UnderwriterAuthorityRepository;
import com.insurance.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TariffAndAdminUserServiceTest {

    @Mock
    private TariffRepository tariffRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UnderwriterAuthorityRepository authorityRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private AuthService authService;

    @Mock
    private AuditLogService auditLogService;

    private TariffService tariffService;
    private AdminUserService adminUserService;

    @BeforeEach
    void setUp() {
        tariffService = new TariffService(tariffRepository, auditLogService);
        adminUserService = new AdminUserService(
                userRepository,
                authorityRepository,
                customerRepository,
                authService,
                auditLogService
        );
    }

    @Test
    @DisplayName("Should return all tariffs as DTOs")
    void testGetAllTariffs() {
        Tariff t1 = new Tariff("COMPREHENSIVE", "Comprehensive Cover",
                new BigDecimal("0.0450"), new BigDecimal("2500.00"),
                new BigDecimal("0.1500"), new BigDecimal("500.00"),
                new BigDecimal("0.3000"), new BigDecimal("0.2000"),
                new BigDecimal("0.1000"));
        t1.setId(1L);

        when(tariffRepository.findAll()).thenReturn(List.of(t1));

        List<TariffDto> result = tariffService.getAllTariffs();
        assertEquals(1, result.size());
        assertEquals("COMPREHENSIVE", result.get(0).getProductCode());
        assertEquals(new BigDecimal("0.0450"), result.get(0).getBaseRatePercentage());
    }

    @Test
    @DisplayName("Should update tariff rates and audit change")
    void testUpdateTariff() {
        Tariff t = new Tariff("COMPREHENSIVE", "Comprehensive Cover",
                new BigDecimal("0.0450"), new BigDecimal("2500.00"),
                new BigDecimal("0.1500"), new BigDecimal("500.00"),
                new BigDecimal("0.3000"), new BigDecimal("0.2000"),
                new BigDecimal("0.1000"));
        t.setId(1L);

        when(tariffRepository.findByProductCode("COMPREHENSIVE")).thenReturn(Optional.of(t));
        when(tariffRepository.save(any(Tariff.class))).thenAnswer(inv -> inv.getArgument(0));

        TariffDto updateDto = new TariffDto(
                1L, "COMPREHENSIVE", "Comprehensive Updated",
                new BigDecimal("0.0500"), new BigDecimal("3000.00"),
                new BigDecimal("0.1500"), new BigDecimal("600.00"),
                new BigDecimal("0.3500"), new BigDecimal("0.2500"),
                new BigDecimal("0.1200"), new BigDecimal("120000.00"),
                true, "elena.manager", null
        );

        TariffDto updated = tariffService.updateTariff("COMPREHENSIVE", updateDto, "elena.manager");

        assertEquals(new BigDecimal("0.0500"), updated.getBaseRatePercentage());
        assertEquals(new BigDecimal("3000.00"), updated.getMinPremium());
        assertEquals(new BigDecimal("0.1200"), updated.getBrokerCommissionPercentage());

        verify(auditLogService, times(1)).recordAction(
                eq("elena.manager"), eq("ROLE_ADMIN"), eq("TARIFF_UPDATED"),
                eq("TARIFF"), eq(1L), any(), any(), isNull()
        );
    }

    @Test
    @DisplayName("Should create user and assign underwriter authority if role is underwriter")
    void testCreateUnderwriterUser() {
        CreateUserRequest req = new CreateUserRequest(
                "john.uw", "secretPass123", "John Underwriter",
                "john@safemotor.com", Set.of("ROLE_UNDERWRITER"), null
        );

        when(userRepository.existsByUsername("john.uw")).thenReturn(false);
        when(authService.hashPassword("secretPass123")).thenReturn("hashed123");

        User savedUser = new User("john.uw", "hashed123", "John Underwriter", "john@safemotor.com", null);
        savedUser.setId(10L);
        savedUser.setRoles(Set.of("ROLE_UNDERWRITER"));

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        UnderwriterAuthority savedAuth = new UnderwriterAuthority(
                savedUser, BigDecimal.valueOf(50000.00), BigDecimal.valueOf(0.2000), BigDecimal.valueOf(0.1500), false
        );
        savedAuth.setId(5L);
        when(authorityRepository.save(any(UnderwriterAuthority.class))).thenReturn(savedAuth);

        UserManagementDto result = adminUserService.createUser(req, "elena.manager");

        assertNotNull(result);
        assertEquals("john.uw", result.getUsername());
        assertNotNull(result.getAuthority());
        assertEquals(BigDecimal.valueOf(50000.00), result.getAuthority().getMaxSumInsured());

        verify(auditLogService, times(1)).recordAction(
                eq("elena.manager"), eq("ROLE_ADMIN"), eq("CREATE_USER"),
                eq("User"), eq(10L), isNull(), any(), isNull()
        );
    }

    @Test
    @DisplayName("Should prevent admin from deactivating their own account")
    void testPreventAdminSelfDeactivation() {
        User admin = new User("elena.manager", "hash", "Elena Rostova", "elena@admin.com", null);
        admin.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        assertThrows(BusinessRuleException.class, () ->
                adminUserService.updateUserStatus(1L, false, "elena.manager")
        );
    }

    @Test
    @DisplayName("Should update underwriter authority and log audit record")
    void testUpdateAuthority() {
        User uw = new User("alexander.uw", "hash", "Alexander Reed", "alex@uw.com", null);
        uw.setId(2L);
        uw.setRoles(new HashSet<>(List.of("ROLE_UNDERWRITER")));

        UnderwriterAuthority existingAuth = new UnderwriterAuthority(
                uw, BigDecimal.valueOf(100000.00), BigDecimal.valueOf(0.2500), BigDecimal.valueOf(0.1500), true
        );
        existingAuth.setId(3L);

        when(userRepository.findById(2L)).thenReturn(Optional.of(uw));
        when(authorityRepository.findByUserId(2L)).thenReturn(Optional.of(existingAuth));
        when(authorityRepository.save(any(UnderwriterAuthority.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateAuthorityRequest req = new UpdateAuthorityRequest(
                BigDecimal.valueOf(200000.00), BigDecimal.valueOf(0.3500), BigDecimal.valueOf(0.2000), true
        );

        UserManagementDto result = adminUserService.updateAuthority(2L, req, "elena.manager");

        assertNotNull(result.getAuthority());
        assertEquals(BigDecimal.valueOf(200000.00), result.getAuthority().getMaxSumInsured());
        assertEquals(BigDecimal.valueOf(0.3500), result.getAuthority().getMaxLoadingPercentage());

        verify(auditLogService, times(1)).recordAction(
                eq("elena.manager"), eq("ROLE_ADMIN"), eq("UPDATE_UNDERWRITER_AUTHORITY"),
                eq("UnderwriterAuthority"), eq(3L), any(), any(), isNull()
        );
    }
}

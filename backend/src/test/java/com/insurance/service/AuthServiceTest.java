package com.insurance.service;

import com.insurance.dto.LoginRequest;
import com.insurance.dto.RoleSwitchRequest;
import com.insurance.dto.UserDto;
import com.insurance.entity.User;
import com.insurance.exception.BusinessRuleException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private final String passwordHash = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"; // password123

    @BeforeEach
    void setUp() {
        sampleUser = new User("alexander.uw", passwordHash, "Alexander Reed", "alexander@demo.test", null);
        sampleUser.setId(10L);
        sampleUser.setRoles(Set.of("ROLE_UNDERWRITER", "ROLE_ADMIN"));
        sampleUser.setActive(true);
    }

    @Test
    void login_Success() {
        when(userRepository.findByUsernameOrEmailIgnoreCase("alexander.uw")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        LoginRequest request = new LoginRequest("alexander.uw", "password123");
        UserDto result = authService.login(request);

        assertNotNull(result);
        assertEquals("alexander.uw", result.getUsername());
        assertNotNull(result.getAuthToken());
        assertTrue(result.getRoles().contains("ROLE_UNDERWRITER"));
        verify(userRepository).save(sampleUser);
    }

    @Test
    void login_ByEmail_Success() {
        when(userRepository.findByUsernameOrEmailIgnoreCase("alexander@demo.test")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        LoginRequest request = new LoginRequest("alexander@demo.test", "password123");
        UserDto result = authService.login(request);

        assertNotNull(result);
        assertEquals("alexander.uw", result.getUsername());
    }

    @Test
    void login_InvalidPassword_ThrowsException() {
        when(userRepository.findByUsernameOrEmailIgnoreCase("alexander.uw")).thenReturn(Optional.of(sampleUser));

        LoginRequest request = new LoginRequest("alexander.uw", "wrongpassword");
        assertThrows(BusinessRuleException.class, () -> authService.login(request));
    }

    @Test
    void login_InactiveAccount_ThrowsException() {
        sampleUser.setActive(false);
        when(userRepository.findByUsernameOrEmailIgnoreCase("alexander.uw")).thenReturn(Optional.of(sampleUser));

        LoginRequest request = new LoginRequest("alexander.uw", "password123");
        assertThrows(BusinessRuleException.class, () -> authService.login(request));
    }

    @Test
    void switchRole_ValidRole_Success() {
        sampleUser.setAuthToken("TEST-TOKEN-123");
        when(userRepository.findByAuthToken("TEST-TOKEN-123")).thenReturn(Optional.of(sampleUser));

        RoleSwitchRequest req = new RoleSwitchRequest("ROLE_UNDERWRITER");
        UserDto result = authService.switchRole("Bearer TEST-TOKEN-123", req);

        assertEquals("ROLE_UNDERWRITER", result.getActiveRole());
    }

    @Test
    void switchRole_UnauthorizedRole_ThrowsException() {
        sampleUser.setAuthToken("TEST-TOKEN-123");
        when(userRepository.findByAuthToken("TEST-TOKEN-123")).thenReturn(Optional.of(sampleUser));

        RoleSwitchRequest req = new RoleSwitchRequest("ROLE_CLAIMS_OFFICER");
        assertThrows(BusinessRuleException.class, () -> authService.switchRole("TEST-TOKEN-123", req));
    }

    @Test
    void getCurrentUser_ValidToken_Success() {
        sampleUser.setAuthToken("TEST-TOKEN-123");
        when(userRepository.findByAuthToken("TEST-TOKEN-123")).thenReturn(Optional.of(sampleUser));

        UserDto result = authService.getCurrentUser("TEST-TOKEN-123", "ROLE_ADMIN");
        assertEquals("ROLE_ADMIN", result.getActiveRole());
    }

    @Test
    void getCurrentUser_InvalidToken_ThrowsNotFound() {
        when(userRepository.findByAuthToken("INVALID")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> authService.getCurrentUser("INVALID", null));
    }
}

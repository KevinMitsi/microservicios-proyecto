package com.proyecto.msvc_auth.services;

import com.proyecto.msvc_auth.DTO.AuthResponse;
import com.proyecto.msvc_auth.DTO.LoginRequest;
import com.proyecto.msvc_auth.DTO.UserRegistrationRequest;
import com.proyecto.msvc_auth.DTO.UserUpdateRequest;
import com.proyecto.msvc_auth.Entity.PasswordResetToken;
import com.proyecto.msvc_auth.Entity.Role;
import com.proyecto.msvc_auth.Entity.UserEntity;
import com.proyecto.msvc_auth.exceptions.InvalidCredentialsException;
import com.proyecto.msvc_auth.exceptions.UserAlreadyExistException;
import com.proyecto.msvc_auth.models.UserEvent;
import com.proyecto.msvc_auth.repository.PasswordTokenRepository;
import com.proyecto.msvc_auth.repository.UserRepository;
import com.proyecto.msvc_auth.security.JwtUtils;
import com.proyecto.msvc_auth.services.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordTokenRepository passwordTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private UserEventService userEventService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserServiceImpl userService;

    private UserEntity testUser;
    private UserEntity adminUser;
    private UserRegistrationRequest registrationRequest;
    private UserUpdateRequest updateRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        reset(userRepository, passwordTokenRepository, passwordEncoder, jwtUtils, userEventService, authenticationManager);

        // Set JWT expiration minutes
        ReflectionTestUtils.setField(userService, "jwtExpirationMinutes", 60);

        // Setup test user
        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("encoded-password");
        testUser.setMobileNumber("+1234567890");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        Set<Role> userAuthorities = new HashSet<>();
        userAuthorities.add(Role.USER);
        testUser.setAuthorities(userAuthorities);

        // Setup admin user
        adminUser = new UserEntity();
        adminUser.setId(2L);
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword("encoded-admin-password");
        adminUser.setMobileNumber("+9876543210");
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        Set<Role> adminAuthorities = new HashSet<>();
        adminAuthorities.add(Role.ADMIN);
        adminUser.setAuthorities(adminAuthorities);

        // Setup registration request
        registrationRequest = new UserRegistrationRequest();
        registrationRequest.setUsername("newuser");
        registrationRequest.setEmail("newuser@example.com");
        registrationRequest.setPassword("newpassword123");
        registrationRequest.setMobileNumber("+1111111111");
        registrationRequest.setFirstName("New");
        registrationRequest.setLastName("User");

        // Setup update request
        updateRequest = new UserUpdateRequest();
        updateRequest.setFirstName("Updated");
        updateRequest.setLastName("Name");
        updateRequest.setEmail("updated@example.com");

        // Setup login request
        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
    }

    // Tests de registro de usuario
    @Test
    void registerUser_ShouldCreateNewUser_WhenValidData() {
        // Given
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("newpassword123")).thenReturn("encoded-new-password");
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        // When
        UserEntity result = userService.registerUser(registrationRequest);

        // Then
        assertNotNull(result);
        verify(userRepository).existsByUsername("newuser");
        verify(userRepository).existsByEmail("newuser@example.com");
        verify(passwordEncoder).encode("newpassword123");
        verify(userRepository).save(any(UserEntity.class));
        verify(userEventService).publishEvent(any(UserEvent.class));
    }

    @Test
    void registerUser_ShouldThrowException_WhenUsernameExists() {
        // Given
        when(userRepository.existsByUsername("newuser")).thenReturn(true);

        // When & Then
        assertThrows(UserAlreadyExistException.class, () -> userService.registerUser(registrationRequest));
        verify(userRepository).existsByUsername("newuser");
        verify(userRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder, userEventService);
    }

    @Test
    void registerUser_ShouldThrowException_WhenEmailExists() {
        // Given
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(true);

        // When & Then
        assertThrows(UserAlreadyExistException.class, () -> userService.registerUser(registrationRequest));
        verify(userRepository).existsByUsername("newuser");
        verify(userRepository).existsByEmail("newuser@example.com");
        verify(userRepository, never()).save(any());
        verifyNoInteractions(passwordEncoder, userEventService);
    }

    // Tests de autenticación
    @Test
    void login_ShouldReturnAuthResponse_WhenValidCredentials() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(jwtUtils.generateToken(eq("testuser"), any())).thenReturn("mock-jwt-token");

        // When
        AuthResponse result = userService.login(loginRequest);

        // Then
        assertNotNull(result);
        assertEquals("mock-jwt-token", result.getToken());
        assertEquals("Bearer", result.getTokenType());
        assertEquals(3600, result.getExpiresIn()); // 60 minutes * 60 seconds
        assertEquals(testUser, result.getUser());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByUsername("testuser");
        verify(jwtUtils).generateToken(eq("testuser"), any());
        verify(userEventService).publishEvent(any(UserEvent.class));
    }

    @Test
    void login_ShouldThrowException_WhenInvalidCredentials() {
        // Given
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new RuntimeException("Authentication failed"));

        // When & Then
        assertThrows(InvalidCredentialsException.class, () -> userService.login(loginRequest));
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verifyNoInteractions(userRepository, jwtUtils, userEventService);
    }

    // Tests de obtención de usuarios
    @Test
    void getAllUsers_ShouldReturnPagedUsers() {
        // Given
        List<UserEntity> users = Arrays.asList(testUser, adminUser);
        Page<UserEntity> userPage = new PageImpl<>(users);
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findAll(pageable)).thenReturn(userPage);

        // When
        Page<UserEntity> result = userService.getAllUsers(pageable);

        // Then
        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        verify(userRepository).findAll(pageable);
    }

    @Test
    void getUserById_ShouldReturnUser_WhenExists() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        Optional<UserEntity> result = userService.getUserById(1L);

        // Then
        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());
        verify(userRepository).findById(1L);
    }

    @Test
    void getUserById_ShouldReturnEmpty_WhenNotExists() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        Optional<UserEntity> result = userService.getUserById(999L);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findById(999L);
    }

    // Tests de actualización de usuario
    @Test
    void updateUser_ShouldUpdateUser_WhenValidData() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByEmail("updated@example.com")).thenReturn(false);
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        // When
        UserEntity result = userService.updateUser(1L, updateRequest);

        // Then
        assertNotNull(result);
        verify(userRepository).findById(1L);
        verify(userRepository).existsByEmail("updated@example.com");
        verify(userRepository).save(any(UserEntity.class));
        verify(userEventService).publishEvent(any(UserEvent.class));
    }

    @Test
    void updateUser_ShouldThrowException_WhenUserNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.updateUser(999L, updateRequest));
        verify(userRepository).findById(999L);
        verify(userRepository, never()).save(any());
        verifyNoInteractions(userEventService);
    }

    @Test
    void updateUser_ShouldThrowException_WhenEmailAlreadyExists() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.existsByEmail("updated@example.com")).thenReturn(true);

        // When & Then
        assertThrows(UserAlreadyExistException.class, () -> userService.updateUser(1L, updateRequest));
        verify(userRepository).findById(1L);
        verify(userRepository).existsByEmail("updated@example.com");
        verify(userRepository, never()).save(any());
        verifyNoInteractions(userEventService);
    }

    // Tests de eliminación de usuario
    @Test
    void deleteUser_ShouldDeleteUser() {
        // When
        userService.deleteUser(1L);

        // Then
        verify(userRepository).deleteById(1L);
    }

    // Tests de búsqueda
    @Test
    void findByUsername_ShouldReturnUser_WhenExists() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // When
        Optional<UserEntity> result = userService.findByUsername("testuser");

        // Then
        assertTrue(result.isPresent());
        assertEquals("testuser", result.get().getUsername());
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void findByEmail_ShouldReturnUser_WhenExists() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When
        Optional<UserEntity> result = userService.findByEmail("test@example.com");

        // Then
        assertTrue(result.isPresent());
        assertEquals("test@example.com", result.get().getEmail());
        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    void existsByUsername_ShouldReturnTrue_WhenExists() {
        // Given
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        // When
        boolean result = userService.existsByUsername("testuser");

        // Then
        assertTrue(result);
        verify(userRepository).existsByUsername("testuser");
    }

    @Test
    void existsByEmail_ShouldReturnTrue_WhenExists() {
        // Given
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // When
        boolean result = userService.existsByEmail("test@example.com");

        // Then
        assertTrue(result);
        verify(userRepository).existsByEmail("test@example.com");
    }

    // Tests de búsqueda con filtros
    @Test
    void searchUsers_ShouldReturnFilteredUsers() {
        // Given
        List<UserEntity> users = Arrays.asList(testUser);
        Page<UserEntity> userPage = new PageImpl<>(users);
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findByUsernameContainingOrEmailContainingOrFirstNameContainingOrLastNameContaining(
                anyString(), anyString(), anyString(), anyString(), eq(pageable))).thenReturn(userPage);

        // When
        Page<UserEntity> result = userService.searchUsers("test", pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(userRepository).findByUsernameContainingOrEmailContainingOrFirstNameContainingOrLastNameContaining(
                eq("test"), eq("test"), eq("test"), eq("test"), eq(pageable));
    }

    // Tests de actualización de roles
    @Test
    void updateUserRoles_ShouldUpdateRoles_WhenValidUser() {
        // Given
        Set<Role> newRoles = new HashSet<>(Arrays.asList(Role.USER, Role.ADMIN));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        // When
        UserEntity result = userService.updateUserRoles(1L, newRoles);

        // Then
        assertNotNull(result);
        verify(userRepository).findById(1L);
        verify(userRepository).save(any(UserEntity.class));
    }

    // Tests de recuperación de contraseña
    @Test
    void requestPasswordRecovery_ShouldCreateToken_WhenUserExists() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordTokenRepository.existsByUserIdAndExpiryDateAfter(eq(1L), any(LocalDateTime.class))).thenReturn(false);
        when(passwordTokenRepository.save(any(PasswordResetToken.class))).thenReturn(new PasswordResetToken());

        // When
        userService.requestPasswordRecovery("test@example.com");

        // Then
        verify(userRepository).findByEmail("test@example.com");
        verify(passwordTokenRepository).save(any(PasswordResetToken.class));
        verify(userEventService).publishEvent(any(UserEvent.class));
    }

    @Test
    void requestPasswordRecovery_ShouldThrowException_WhenUserNotExists() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.requestPasswordRecovery("nonexistent@example.com"));
        verify(userRepository).findByEmail("nonexistent@example.com");
        verifyNoInteractions(passwordTokenRepository, userEventService);
    }

    @Test
    void resetPasswordForUser_ShouldResetPassword_WhenValidToken() {
        // Given
        PasswordResetToken token = new PasswordResetToken();
        token.setToken("valid-token");
        token.setUserId(1L);
        token.setExpiryDate(LocalDateTime.now().plusHours(1));

        when(passwordTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode("newpassword")).thenReturn("encoded-new-password");
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        // When
        userService.resetPasswordForUser(1L, "valid-token", "newpassword");

        // Then
        verify(passwordTokenRepository).findByToken("valid-token");
        verify(userRepository).findById(1L);
        verify(passwordEncoder).encode("newpassword");
        verify(userRepository).save(any(UserEntity.class));
        verify(passwordTokenRepository).delete(token);
        verify(userEventService).publishEvent(any(UserEvent.class));
    }

    // Tests de filtrado avanzado
    @Test
    void getAllUsersFiltered_ShouldReturnFilteredUsers_WhenFiltersProvided() {
        // Given
        List<UserEntity> users = Arrays.asList(testUser);
        Page<UserEntity> userPage = new PageImpl<>(users);
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase(
                eq("Test"), eq("User"), eq(pageable))).thenReturn(userPage);

        // When
        Page<UserEntity> result = userService.getAllUsersFiltered(pageable, "Test", "User");

        // Then
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        verify(userRepository).findByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase(
                eq("Test"), eq("User"), eq(pageable));
    }

    @Test
    void getAllUsersFiltered_ShouldReturnAllUsers_WhenNoFilters() {
        // Given
        List<UserEntity> users = Arrays.asList(testUser, adminUser);
        Page<UserEntity> userPage = new PageImpl<>(users);
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findAll(pageable)).thenReturn(userPage);

        // When
        Page<UserEntity> result = userService.getAllUsersFiltered(pageable, null, null);

        // Then
        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        verify(userRepository).findAll(pageable);
    }
}

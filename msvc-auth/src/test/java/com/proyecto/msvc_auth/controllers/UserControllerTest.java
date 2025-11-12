package com.proyecto.msvc_auth.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyecto.msvc_auth.DTO.AuthResponse;
import com.proyecto.msvc_auth.DTO.LoginRequest;
import com.proyecto.msvc_auth.DTO.UserRegistrationRequest;
import com.proyecto.msvc_auth.DTO.UserUpdateRequest;
import com.proyecto.msvc_auth.Entity.Role;
import com.proyecto.msvc_auth.Entity.UserEntity;
import com.proyecto.msvc_auth.exceptions.InvalidCredentialsException;
import com.proyecto.msvc_auth.exceptions.UserAlreadyExistException;
import com.proyecto.msvc_auth.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    private UserEntity testUser;
    private UserEntity adminUser;
    private UserRegistrationRequest registrationRequest;
    private UserUpdateRequest updateRequest;
    private LoginRequest loginRequest;
    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
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
        updateRequest.setMobileNumber("+9999999999");

        // Setup login request
        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        // Setup auth response
        authResponse = new AuthResponse();
        authResponse.setToken("mock-jwt-token");
        authResponse.setUser(testUser);
    }

    // Tests de registro de usuario
    @Test
    void registerUser_ShouldReturn201_WhenValidRequest() throws Exception {
        // Given
        when(userService.registerUser(any(UserRegistrationRequest.class))).thenReturn(testUser);

        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registrationRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void registerUser_ShouldReturn400_WhenUserAlreadyExists() throws Exception {
        // Given
        when(userService.registerUser(any(UserRegistrationRequest.class)))
                .thenThrow(new UserAlreadyExistException("User already exists"));

        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registrationRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    // Tests de autenticación
    @Test
    void login_ShouldReturn200_WhenValidCredentials() throws Exception {
        // Given
        when(userService.login(any(LoginRequest.class))).thenReturn(authResponse);

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.user.username").value("testuser"));
    }

    @Test
    void login_ShouldReturn401_WhenInvalidCredentials() throws Exception {
        // Given
        when(userService.login(any(LoginRequest.class)))
                .thenThrow(new InvalidCredentialsException("Invalid credentials"));

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isUnauthorized());
    }

    // Tests de obtención de usuarios
    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllUsers_ShouldReturn200_WhenValidRequest() throws Exception {
        // Given
        List<UserEntity> users = Arrays.asList(testUser, adminUser);
        Page<UserEntity> userPage = new PageImpl<>(users, PageRequest.of(0, 10), 2);
        when(userService.getAllUsersFiltered(any(), eq(null), eq(null))).thenReturn(userPage);

        // When & Then
        mockMvc.perform(get("/api/users")
                .param("page", "0")
                .param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(1));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllUsers_ShouldReturn200_WithFilters() throws Exception {
        // Given
        List<UserEntity> users = Collections.singletonList(testUser);
        Page<UserEntity> userPage = new PageImpl<>(users, PageRequest.of(0, 10), 1);
        when(userService.getAllUsersFiltered(any(), eq("Test"), eq("User"))).thenReturn(userPage);

        // When & Then
        mockMvc.perform(get("/api/users")
                .param("page", "0")
                .param("size", "10")
                .param("firstName", "Test")
                .param("lastName", "User"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    @WithMockUser(authorities = "USER")
    void getAllUsers_ShouldReturn403_WhenNotAdmin() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/users"))
                .andDo(print())
                .andExpect(status().isForbidden());
    }

    // Tests de obtención de usuario por ID
    @Test
    @WithMockUser(authorities = "ADMIN")
    void getUserById_ShouldReturn200_WhenUserExists() throws Exception {
        // Given
        when(userService.getUserById(1L)).thenReturn(Optional.of(testUser));

        // When & Then
        mockMvc.perform(get("/api/users/1"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getUserById_ShouldReturn404_WhenUserNotExists() throws Exception {
        // Given
        when(userService.getUserById(999L)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/users/999"))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    // Tests de actualización de usuario
    @Test
    @WithMockUser(authorities = "ADMIN")
    void updateUser_ShouldReturn200_WhenValidRequest() throws Exception {
        // Given
        UserEntity updatedUser = new UserEntity();
        updatedUser.setId(1L);
        updatedUser.setUsername("testuser");
        updatedUser.setFirstName("Updated");
        updatedUser.setLastName("Name");
        when(userService.updateUser(eq(1L), any(UserUpdateRequest.class))).thenReturn(updatedUser);

        // When & Then
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.lastName").value("Name"));
    }

    @Test
    @WithMockUser(authorities = "USER")
    void updateUser_ShouldReturn403_WhenNotAdmin() throws Exception {
        // When & Then
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isForbidden());
    }

    // Tests de eliminación de usuario
    @Test
    @WithMockUser(authorities = "ADMIN")
    void deleteUser_ShouldReturn204_WhenValidRequest() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/users/1")
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(authorities = "USER")
    void deleteUser_ShouldReturn403_WhenNotAdmin() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/users/1")
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isForbidden());
    }

    // Tests de búsqueda de usuarios
    @Test
    @WithMockUser(authorities = "ADMIN")
    void searchUsers_ShouldReturn200_WhenValidRequest() throws Exception {
        // Given
        List<UserEntity> users = Collections.singletonList(testUser);
        Page<UserEntity> userPage = new PageImpl<>(users, PageRequest.of(0, 10), 1);
        when(userService.searchUsers(eq("test"), any())).thenReturn(userPage);

        // When & Then
        mockMvc.perform(get("/api/users/search")
                .param("query", "test")
                .param("page", "0")
                .param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    // Tests de actualización de roles
    @Test
    @WithMockUser(authorities = "ADMIN")
    void updateUserRoles_ShouldReturn200_WhenValidRequest() throws Exception {
        // Given
        Set<Role> roles = new HashSet<>(Arrays.asList(Role.USER, Role.ADMIN));
        when(userService.updateUserRoles(eq(1L), any())).thenReturn(adminUser);

        // When & Then
        mockMvc.perform(patch("/api/users/1/roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(roles))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorities").isArray());
    }

    // Tests de recuperación de contraseña
    @Test
    void requestPasswordRecovery_ShouldReturn200_WhenValidEmail() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/auth/password-recovery")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"test@example.com\"}")
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isOk());
    }

    @Test
    void resetPassword_ShouldReturn200_WhenValidRequest() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"token\": \"valid-token\", \"newPassword\": \"newpass123\", \"userId\": 1}")
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isOk());
    }

    // Tests de validación de datos
    @Test
    void registerUser_ShouldReturn400_WhenInvalidData() throws Exception {
        // Given - invalid registration request (missing required fields)
        UserRegistrationRequest invalidRequest = new UserRegistrationRequest();
        invalidRequest.setUsername(""); // invalid username

        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_ShouldReturn400_WhenMissingCredentials() throws Exception {
        // Given - login request with missing password
        LoginRequest invalidRequest = new LoginRequest();
        invalidRequest.setUsername("testuser");
        // password is null

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    // Tests de perfil de usuario actual
    @Test
    @WithMockUser(username = "testuser")
    void getCurrentUserProfile_ShouldReturn200_WhenAuthenticated() throws Exception {
        // Given
        when(userService.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // When & Then
        mockMvc.perform(get("/api/users/profile"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"));
    }

    @Test
    void getCurrentUserProfile_ShouldReturn401_WhenNotAuthenticated() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/users/profile"))
                .andDo(print())
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "testuser")
    void updateCurrentUserProfile_ShouldReturn200_WhenValidRequest() throws Exception {
        // Given
        when(userService.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(userService.updateUser(eq(1L), any(UserUpdateRequest.class))).thenReturn(testUser);

        // When & Then
        mockMvc.perform(put("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isOk());
    }
}

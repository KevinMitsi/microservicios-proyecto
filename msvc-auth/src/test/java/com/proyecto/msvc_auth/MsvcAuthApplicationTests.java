package com.proyecto.msvc_auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.proyecto.msvc_auth.DTO.LoginRequest;
import com.proyecto.msvc_auth.DTO.UserRegistrationRequest;
import com.proyecto.msvc_auth.Entity.Role;
import com.proyecto.msvc_auth.Entity.UserEntity;
import com.proyecto.msvc_auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = MsvcAuthApplication.class)
@ActiveProfiles("test")
@Transactional
class MsvcAuthApplicationTests {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private UserEntity testUser;
    private UserRegistrationRequest registrationRequest;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Clean database before each test
        userRepository.deleteAll();

        // Setup test user
        testUser = new UserEntity();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setMobileNumber("+1234567890");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        Set<Role> authorities = new HashSet<>();
        authorities.add(Role.USER);
        testUser.setAuthorities(authorities);

        // Setup registration request
        registrationRequest = new UserRegistrationRequest();
        registrationRequest.setUsername("newuser");
        registrationRequest.setEmail("newuser@example.com");
        registrationRequest.setPassword("newpassword123");
        registrationRequest.setMobileNumber("+1111111111");
        registrationRequest.setFirstName("New");
        registrationRequest.setLastName("User");
    }

    @Test
    void contextLoads() {
        // Test que verifica que el contexto de Spring Boot se carga correctamente
        assertNotNull(userRepository);
        assertNotNull(passwordEncoder);
        assertNotNull(mockMvc);
    }

    @Test
    void applicationShouldStartSuccessfully() {
        // Verify that all main components are loaded correctly
        assertNotNull(context);
        assertNotNull(context.getServletContext());
    }

    // Tests de integración para registro de usuario
    @Test
    void registerUser_IntegrationTest_ShouldCreateUserInDatabase() throws Exception {
        // When
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registrationRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.email").value("newuser@example.com"));

        // Then - verify user was saved in database
        assertTrue(userRepository.existsByUsername("newuser"));
        assertTrue(userRepository.existsByEmail("newuser@example.com"));

        UserEntity savedUser = userRepository.findByUsername("newuser").orElse(null);
        assertNotNull(savedUser);
        assertEquals("newuser", savedUser.getUsername());
        assertEquals("newuser@example.com", savedUser.getEmail());
        assertEquals("New", savedUser.getFirstName());
        assertEquals("User", savedUser.getLastName());
        assertTrue(savedUser.hasRole(Role.USER));
    }

    @Test
    void registerUser_IntegrationTest_ShouldFailWhenUserExists() throws Exception {
        // Given - create existing user
        userRepository.save(testUser);

        // Setup request with same username
        UserRegistrationRequest duplicateRequest = new UserRegistrationRequest();
        duplicateRequest.setUsername("testuser"); // same as existing user
        duplicateRequest.setEmail("different@example.com");
        duplicateRequest.setPassword("password123");
        duplicateRequest.setMobileNumber("+5555555555");
        duplicateRequest.setFirstName("Duplicate");
        duplicateRequest.setLastName("User");

        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isBadRequest());

        // Verify only one user exists
        assertEquals(1, userRepository.count());
    }

    // Tests de integración para autenticación
    @Test
    void login_IntegrationTest_ShouldReturnValidToken() throws Exception {
        // Given - create user in database
        userRepository.save(testUser);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.username").value("testuser"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"));
    }

    @Test
    void login_IntegrationTest_ShouldFailWithInvalidCredentials() throws Exception {
        // Given - create user in database
        userRepository.save(testUser);

        LoginRequest invalidLoginRequest = new LoginRequest();
        invalidLoginRequest.setUsername("testuser");
        invalidLoginRequest.setPassword("wrongpassword");

        // When & Then
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidLoginRequest))
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isUnauthorized());
    }

    // Tests de integración para obtención de usuarios
    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllUsers_IntegrationTest_ShouldReturnUsersFromDatabase() throws Exception {
        // Given - create multiple users
        userRepository.save(testUser);

        UserEntity adminUser = new UserEntity();
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword(passwordEncoder.encode("adminpass"));
        adminUser.setMobileNumber("+9999999999");
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        Set<Role> adminAuthorities = new HashSet<>();
        adminAuthorities.add(Role.ADMIN);
        adminUser.setAuthorities(adminAuthorities);
        userRepository.save(adminUser);

        // When & Then
        mockMvc.perform(get("/api/users")
                .param("page", "0")
                .param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void getUserById_IntegrationTest_ShouldReturnUserFromDatabase() throws Exception {
        // Given - save user to database
        UserEntity savedUser = userRepository.save(testUser);

        // When & Then
        mockMvc.perform(get("/api/users/" + savedUser.getId()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(savedUser.getId()))
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    // Tests de integración para actualización de usuarios
    @Test
    @WithMockUser(authorities = "ADMIN")
    void updateUser_IntegrationTest_ShouldUpdateUserInDatabase() throws Exception {
        // Given - save user to database
        UserEntity savedUser = userRepository.save(testUser);

        String updateJson = """
            {
                "firstName": "Updated",
                "lastName": "Name",
                "mobileNumber": "+9999999999"
            }
            """;

        // When
        mockMvc.perform(put("/api/users/" + savedUser.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updateJson)
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Updated"))
                .andExpect(jsonPath("$.lastName").value("Name"));

        // Then - verify changes in database
        UserEntity updatedUser = userRepository.findById(savedUser.getId()).orElse(null);
        assertNotNull(updatedUser);
        assertEquals("Updated", updatedUser.getFirstName());
        assertEquals("Name", updatedUser.getLastName());
        assertEquals("+9999999999", updatedUser.getMobileNumber());
    }

    // Tests de integración para eliminación de usuarios
    @Test
    @WithMockUser(authorities = "ADMIN")
    void deleteUser_IntegrationTest_ShouldRemoveUserFromDatabase() throws Exception {
        // Given - save user to database
        UserEntity savedUser = userRepository.save(testUser);
        Long userId = savedUser.getId();

        // Verify user exists
        assertTrue(userRepository.existsById(userId));

        // When
        mockMvc.perform(delete("/api/users/" + userId)
                .with(csrf()))
                .andDo(print())
                .andExpect(status().isNoContent());

        // Then - verify user was deleted from database
        assertFalse(userRepository.existsById(userId));
        assertEquals(0, userRepository.count());
    }

    // Tests de integración para búsqueda de usuarios
    @Test
    @WithMockUser(authorities = "ADMIN")
    void searchUsers_IntegrationTest_ShouldFindUsersInDatabase() throws Exception {
        // Given - create users with searchable data
        userRepository.save(testUser);

        UserEntity searchableUser = new UserEntity();
        searchableUser.setUsername("searchableuser");
        searchableUser.setEmail("searchable@example.com");
        searchableUser.setPassword(passwordEncoder.encode("password"));
        searchableUser.setMobileNumber("+7777777777");
        searchableUser.setFirstName("Searchable");
        searchableUser.setLastName("User");
        Set<Role> authorities = new HashSet<>();
        authorities.add(Role.USER);
        searchableUser.setAuthorities(authorities);
        userRepository.save(searchableUser);

        // When & Then - search by first name
        mockMvc.perform(get("/api/users/search")
                .param("query", "Searchable")
                .param("page", "0")
                .param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].firstName").value("Searchable"));
    }

    // Tests de integración para filtros
    @Test
    @WithMockUser(authorities = "ADMIN")
    void getAllUsersWithFilters_IntegrationTest_ShouldFilterUsersInDatabase() throws Exception {
        // Given - create users with different names
        userRepository.save(testUser);

        UserEntity filteredUser = new UserEntity();
        filteredUser.setUsername("filtereduser");
        filteredUser.setEmail("filtered@example.com");
        filteredUser.setPassword(passwordEncoder.encode("password"));
        filteredUser.setMobileNumber("+8888888888");
        filteredUser.setFirstName("Filtered");
        filteredUser.setLastName("Name");
        Set<Role> authorities = new HashSet<>();
        authorities.add(Role.USER);
        filteredUser.setAuthorities(authorities);
        userRepository.save(filteredUser);

        // When & Then - filter by first name
        mockMvc.perform(get("/api/users")
                .param("firstName", "Filtered")
                .param("page", "0")
                .param("size", "10"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].firstName").value("Filtered"));
    }

    // Test de integración para validación de configuración
    @Test
    void databaseConfiguration_IntegrationTest_ShouldWork() {
        // Test basic database operations
        assertEquals(0, userRepository.count());

        UserEntity savedUser = userRepository.save(testUser);
        assertNotNull(savedUser.getId());
        assertEquals(1, userRepository.count());

        userRepository.delete(savedUser);
        assertEquals(0, userRepository.count());
    }

    // Test de integración para seguridad
    @Test
    void securityConfiguration_IntegrationTest_ShouldProtectEndpoints() throws Exception {
        // Test that protected endpoints require authentication
        mockMvc.perform(get("/api/users"))
                .andDo(print())
                .andExpect(status().isUnauthorized());
    }

    // Test de integración para encriptación de contraseñas
    @Test
    void passwordEncoding_IntegrationTest_ShouldWorkCorrectly() {
        String rawPassword = "testpassword123";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        assertNotEquals(rawPassword, encodedPassword);
        assertTrue(passwordEncoder.matches(rawPassword, encodedPassword));
        assertFalse(passwordEncoder.matches("wrongpassword", encodedPassword));
    }

    // Test de integración completo: registro, login y operaciones
    @Test
    void fullUserLifecycle_IntegrationTest() throws Exception {
        // 1. Register user
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registrationRequest))
                .with(csrf()))
                .andExpect(status().isCreated());

        // 2. Verify user exists in database
        assertTrue(userRepository.existsByUsername("newuser"));

        // 3. Login with created user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("newuser");
        loginRequest.setPassword("newpassword123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest))
                .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        // 4. Verify final state
        UserEntity finalUser = userRepository.findByUsername("newuser").orElse(null);
        assertNotNull(finalUser);
        assertEquals("newuser@example.com", finalUser.getEmail());
    }
}

package com.proyecto.msvc_auth.security;

import com.proyecto.msvc_auth.Entity.Role;
import com.proyecto.msvc_auth.Entity.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class JwtUtilsTest {

    @InjectMocks
    private JwtUtils jwtUtils;

    // Use a valid Base64 encoded key
    private final String secretBase64 = "dGVzdFNlY3JldEtleUZvckp3dFRva2VuR2VuZXJhdGlvbkFuZFZhbGlkYXRpb24xMjM0NTY3ODkw";
    private final String issuer = "test-issuer";
    private final long expirationMinutes = 60;

    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        // Set up the JwtUtils with proper configuration values
        ReflectionTestUtils.setField(jwtUtils, "secretBase64", secretBase64);
        ReflectionTestUtils.setField(jwtUtils, "issuer", issuer);
        ReflectionTestUtils.setField(jwtUtils, "expirationMinutes", expirationMinutes);

        // Initialize the component (equivalent to @PostConstruct)
        jwtUtils.init();

        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        Set<Role> authorities = new HashSet<>();
        authorities.add(Role.USER);
        testUser.setAuthorities(authorities);
    }

    @Test
    void generateToken_ShouldCreateValidToken_WhenValidUser() {
        // When
        String token = jwtUtils.generateToken("testuser", testUser.getAuthorities());

        // Then
        assertNotNull(token);
        assertFalse(token.isEmpty());

        // Verify token structure (JWT has 3 parts separated by dots)
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length);
    }

    @Test
    void generateToken_ShouldIncludeCorrectClaims_WhenValidUser() {
        // When
        String token = jwtUtils.generateToken("testuser", testUser.getAuthorities());

        // Then
        Claims claims = jwtUtils.getClaimsFromToken(token);
        assertEquals("testuser", claims.getSubject());
        assertEquals(issuer, claims.getIssuer());
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
        assertTrue(claims.getExpiration().after(new Date()));
    }

    @Test
    void getUsernameFromToken_ShouldReturnCorrectUsername_WhenValidToken() {
        // Given
        String token = jwtUtils.generateToken("testuser", testUser.getAuthorities());

        // When
        String extractedUsername = jwtUtils.getUsernameFromToken(token);

        // Then
        assertEquals("testuser", extractedUsername);
    }

    @Test
    void getClaimsFromToken_ShouldReturnValidClaims_WhenValidToken() {
        // Given
        String token = jwtUtils.generateToken("testuser", testUser.getAuthorities());

        // When
        Claims claims = jwtUtils.getClaimsFromToken(token);

        // Then
        assertNotNull(claims);
        assertEquals("testuser", claims.getSubject());
        assertEquals(issuer, claims.getIssuer());
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
        assertTrue(claims.getExpiration().after(new Date()));
    }

    @Test
    void isTokenExpired_ShouldReturnFalse_WhenTokenIsValid() {
        // Given
        String token = jwtUtils.generateToken("testuser", testUser.getAuthorities());

        // When
        boolean isExpired = jwtUtils.isTokenExpired(token);

        // Then
        assertFalse(isExpired);
    }

    @Test
    void validateToken_ShouldReturnTrue_WhenTokenIsValid() {
        // Given
        String token = jwtUtils.generateToken("testuser", testUser.getAuthorities());

        // When
        boolean isValid = jwtUtils.validateToken(token);

        // Then
        assertTrue(isValid);
    }

    @Test
    void validateToken_ShouldReturnFalse_WhenTokenIsInvalid() {
        // Given
        String invalidToken = "invalid.token.here";

        // When
        boolean isValid = jwtUtils.validateToken(invalidToken);

        // Then
        assertFalse(isValid);
    }

    @Test
    void getRolesFromToken_ShouldReturnCorrectRoles_WhenValidToken() {
        // Given
        Set<Role> roles = new HashSet<>();
        roles.add(Role.USER);
        roles.add(Role.ADMIN);
        String token = jwtUtils.generateToken("testuser", roles);

        // When
        List<String> extractedRoles = jwtUtils.getRolesFromToken(token);

        // Then
        assertNotNull(extractedRoles);
        assertEquals(2, extractedRoles.size());
        assertTrue(extractedRoles.contains("USER"));
        assertTrue(extractedRoles.contains("ADMIN"));
    }

    @Test
    void getRolesFromToken_ShouldReturnSingleRole_WhenUserHasOneRole() {
        // Given
        Set<Role> roles = new HashSet<>();
        roles.add(Role.USER);
        String token = jwtUtils.generateToken("testuser", roles);

        // When
        List<String> extractedRoles = jwtUtils.getRolesFromToken(token);

        // Then
        assertNotNull(extractedRoles);
        assertEquals(1, extractedRoles.size());
        assertTrue(extractedRoles.contains("USER"));
    }

    @Test
    void generateToken_ShouldHandleEmptyRoles_Gracefully() {
        // Given
        Set<Role> emptyRoles = new HashSet<>();

        // When
        String token = jwtUtils.generateToken("testuser", emptyRoles);

        // Then
        assertNotNull(token);
        List<String> extractedRoles = jwtUtils.getRolesFromToken(token);
        assertTrue(extractedRoles.isEmpty());
    }

    @Test
    void isTokenExpired_ShouldReturnTrue_WhenTokenIsInvalid() {
        // Given
        String invalidToken = "invalid.token.structure";

        // When
        boolean isExpired = jwtUtils.isTokenExpired(invalidToken);

        // Then
        assertTrue(isExpired); // Invalid tokens are considered expired
    }

    @Test
    void getUsernameFromToken_ShouldThrowException_WhenTokenIsInvalid() {
        // Given
        String invalidToken = "invalid.token.structure";

        // When & Then
        assertThrows(JwtException.class, () -> jwtUtils.getUsernameFromToken(invalidToken));
    }

    @Test
    void getClaimsFromToken_ShouldThrowException_WhenTokenIsInvalid() {
        // Given
        String invalidToken = "invalid.token.structure";

        // When & Then
        assertThrows(JwtException.class, () -> jwtUtils.getClaimsFromToken(invalidToken));
    }

    @Test
    void generateToken_ShouldCreateDifferentTokens_WhenCalledMultipleTimes() {
        // When
        String token1 = jwtUtils.generateToken("testuser", testUser.getAuthorities());

        // Small delay to ensure different timestamps
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        String token2 = jwtUtils.generateToken("testuser", testUser.getAuthorities());

        // Then
        assertNotNull(token1);
        assertNotNull(token2);
        assertNotEquals(token1, token2); // Different tokens due to different timestamps
    }

    @Test
    void validateToken_ShouldReturnFalse_WhenTokenHasDifferentIssuer() {
        // Given - Create a token with different issuer
        ReflectionTestUtils.setField(jwtUtils, "issuer", "different-issuer");
        jwtUtils.init();

        String tokenWithDifferentIssuer = jwtUtils.generateToken("testuser", testUser.getAuthorities());

        // Reset to original issuer for validation
        ReflectionTestUtils.setField(jwtUtils, "issuer", issuer);
        jwtUtils.init();

        // When
        boolean isValid = jwtUtils.validateToken(tokenWithDifferentIssuer);

        // Then
        assertFalse(isValid);
    }

    @Test
    void tokenShouldContainCorrectExpirationTime() {
        // Given
        long currentTime = System.currentTimeMillis();

        // When
        String token = jwtUtils.generateToken("testuser", testUser.getAuthorities());
        Claims claims = jwtUtils.getClaimsFromToken(token);

        // Then
        long tokenExpiration = claims.getExpiration().getTime();
        long expectedExpiration = currentTime + (expirationMinutes * 60 * 1000);

        // Allow 5 seconds tolerance for test execution time
        assertTrue(Math.abs(tokenExpiration - expectedExpiration) < 5000);
    }

    @Test
    void getRolesFromToken_ShouldReturnEmptyList_WhenNoRolesInToken() {
        // Given - manually create a token without roles (for testing edge case)
        String token = jwtUtils.generateToken("testuser", new HashSet<>());

        // When
        List<String> roles = jwtUtils.getRolesFromToken(token);

        // Then
        assertNotNull(roles);
        assertTrue(roles.isEmpty());
    }

    @Test
    void fullTokenLifecycle_ShouldWorkCorrectly() {
        // Given
        String username = "testuser";
        Set<Role> roles = Set.of(Role.USER, Role.ADMIN);

        // When - Generate token
        String token = jwtUtils.generateToken(username, roles);

        // Then - Validate all aspects
        assertTrue(jwtUtils.validateToken(token));
        assertFalse(jwtUtils.isTokenExpired(token));
        assertEquals(username, jwtUtils.getUsernameFromToken(token));

        List<String> extractedRoles = jwtUtils.getRolesFromToken(token);
        assertEquals(2, extractedRoles.size());
        assertTrue(extractedRoles.contains("USER"));
        assertTrue(extractedRoles.contains("ADMIN"));
    }
}

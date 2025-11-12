package com.proyecto.msvc_auth.services;

import com.proyecto.msvc_auth.Entity.Role;
import com.proyecto.msvc_auth.Entity.UserEntity;
import com.proyecto.msvc_auth.models.UserEvent;
import com.proyecto.msvc_auth.services.impl.NotificationServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class NotificationServiceTest {

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private UserEntity testUser;
    private UserEntity adminUser;
    private final PrintStream originalOut = System.out;
    private ByteArrayOutputStream testOut;

    @BeforeEach
    void setUp() {
        // Setup test output capture
        testOut = new ByteArrayOutputStream();
        System.setOut(new PrintStream(testOut));

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
    }

    @AfterEach
    void tearDown() {
        // Restore original System.out
        System.setOut(originalOut);
    }

    @Test
    void sendNotification_ShouldProcessNotification_WhenValidUserEvent() {
        // Given
        UserEvent event = createUserEvent("new-user", testUser);

        // When
        notificationService.sendNotification(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: new-user para usuario: 1"));
    }

    @Test
    void sendNotification_ShouldProcessNotification_WhenLoginEvent() {
        // Given
        UserEvent event = createUserEvent("login", testUser);

        // When
        notificationService.sendNotification(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: login para usuario: 1"));
    }

    @Test
    void sendNotification_ShouldProcessNotification_WhenPasswordRecoveryEvent() {
        // Given
        UserEvent event = createUserEvent("password-recovery", testUser);

        // When
        notificationService.sendNotification(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: password-recovery para usuario: 1"));
    }

    @Test
    void sendNotification_ShouldProcessNotification_WhenPasswordUpdateEvent() {
        // Given
        UserEvent event = createUserEvent("password-update", adminUser);

        // When
        notificationService.sendNotification(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: password-update para usuario: 2"));
    }

    @Test
    void sendNotification_ShouldHandleNullEvent_Gracefully() {
        // When & Then - should not crash
        assertDoesNotThrow(() -> notificationService.sendNotification(null));
    }

    @Test
    void sendNotification_ShouldHandleEventWithNullEventType() {
        // Given
        UserEvent event = createUserEvent(null, testUser);

        // When
        notificationService.sendNotification(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: null para usuario: 1"));
    }

    @Test
    void sendNotification_ShouldHandleEventWithNullUserId() {
        // Given
        UserEvent event = new UserEvent();
        event.setEventType("test-event");
        event.setUserId(null);

        // When
        notificationService.sendNotification(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: test-event para usuario: null"));
    }

    @Test
    void handleUserEvent_ShouldProcessEvent_WhenUserEventTypeWithPrefix() {
        // Given
        UserEvent event = createUserEvent("user.new-user", testUser);

        // When
        notificationService.handleUserEvent(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: user.new-user para usuario: 1"));
    }

    @Test
    void handleUserEvent_ShouldProcessEvent_WhenUserLoginEvent() {
        // Given
        UserEvent event = createUserEvent("user.login", testUser);

        // When
        notificationService.handleUserEvent(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: user.login para usuario: 1"));
    }

    @Test
    void handleUserEvent_ShouldIgnoreEvent_WhenNotUserEventType() {
        // Given
        UserEvent event = createUserEvent("system.maintenance", testUser);

        // When
        notificationService.handleUserEvent(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Evento ignorado: system.maintenance"));
        assertFalse(output.contains("Notificación recibida"));
    }

    @Test
    void handleUserEvent_ShouldIgnoreEvent_WhenEventTypeDoesNotStartWithUser() {
        // Given
        UserEvent event = createUserEvent("order.created", testUser);

        // When
        notificationService.handleUserEvent(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Evento ignorado: order.created"));
        assertFalse(output.contains("Notificación recibida"));
    }

    @Test
    void handleUserEvent_ShouldHandleNullEventType_Gracefully() {
        // Given
        UserEvent event = createUserEvent(null, testUser);

        // When
        notificationService.handleUserEvent(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Evento ignorado: null"));
        assertFalse(output.contains("Notificación recibida"));
    }

    @Test
    void handleUserEvent_ShouldHandleNullEvent_Gracefully() {
        // When & Then - should not crash
        assertDoesNotThrow(() -> notificationService.handleUserEvent(null));
    }

    @Test
    void sendNotification_ShouldProcessMultipleEvents_Correctly() {
        // Given
        UserEvent event1 = createUserEvent("new-user", testUser);
        UserEvent event2 = createUserEvent("login", adminUser);

        // When
        notificationService.sendNotification(event1);
        notificationService.sendNotification(event2);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: new-user para usuario: 1"));
        assertTrue(output.contains("Notificación recibida: login para usuario: 2"));
    }

    @Test
    void handleUserEvent_ShouldProcessOnlyUserEvents_WhenMixedEventTypes() {
        // Given
        UserEvent userEvent = createUserEvent("user.profile-updated", testUser);
        UserEvent systemEvent = createUserEvent("system.backup", adminUser);
        UserEvent orderEvent = createUserEvent("order.completed", testUser);

        // When
        notificationService.handleUserEvent(userEvent);
        notificationService.handleUserEvent(systemEvent);
        notificationService.handleUserEvent(orderEvent);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: user.profile-updated para usuario: 1"));
        assertTrue(output.contains("Evento ignorado: system.backup"));
        assertTrue(output.contains("Evento ignorado: order.completed"));
    }

    @Test
    void handleUserEvent_ShouldHandleEventsWithAdditionalData() {
        // Given
        UserEvent event = createUserEvent("user.password-reset", testUser);
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("resetToken", "token123");
        additionalData.put("expiresAt", LocalDateTime.now().plusHours(1));
        event.setAdditionalData(additionalData);

        // When
        notificationService.handleUserEvent(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: user.password-reset para usuario: 1"));
    }

    @Test
    void sendNotification_ShouldHandleEventWithCompleteUserData() {
        // Given
        UserEvent event = new UserEvent();
        event.setEventType("account-verification");
        event.setUserId(testUser.getId());
        event.setUsername(testUser.getUsername());
        event.setEmail(testUser.getEmail());
        event.setMobileNumber(testUser.getMobileNumber());
        event.setTimestamp(LocalDateTime.now());

        // When
        notificationService.sendNotification(event);

        // Then
        String output = testOut.toString();
        assertTrue(output.contains("Notificación recibida: account-verification para usuario: 1"));
    }

    // Helper method to create UserEvent objects
    private UserEvent createUserEvent(String eventType, UserEntity user) {
        UserEvent event = new UserEvent();
        event.setEventType(eventType);
        if (user != null) {
            event.setUserId(user.getId());
            event.setUsername(user.getUsername());
            event.setEmail(user.getEmail());
            event.setMobileNumber(user.getMobileNumber());
        }
        event.setTimestamp(LocalDateTime.now());
        return event;
    }
}

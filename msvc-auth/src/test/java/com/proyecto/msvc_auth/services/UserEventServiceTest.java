package com.proyecto.msvc_auth.services;

import com.proyecto.msvc_auth.Entity.Role;
import com.proyecto.msvc_auth.Entity.UserEntity;
import com.proyecto.msvc_auth.models.UserEvent;
import com.proyecto.msvc_auth.services.impl.UserEventServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class UserEventServiceTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private UserEventServiceImpl userEventService;

    private UserEntity testUser;
    private UserEntity adminUser;

    @BeforeEach
    void setUp() {
        reset(rabbitTemplate);

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

    @Test
    void publishEvent_ShouldSendMessage_WhenValidUserCreatedEvent() {
        // Given
        UserEvent event = createUserEvent("new-user", testUser);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user.new-user"), eq(event));
    }

    @Test
    void publishEvent_ShouldSendMessage_WhenValidLoginEvent() {
        // Given
        UserEvent event = createUserEvent("login", testUser);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user.login"), eq(event));
    }

    @Test
    void publishEvent_ShouldSendMessage_WhenValidPasswordRecoveryEvent() {
        // Given
        UserEvent event = createUserEvent("password-recovery", testUser);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user.password-recovery"), eq(event));
    }

    @Test
    void publishEvent_ShouldSendMessage_WhenValidPasswordUpdateEvent() {
        // Given
        UserEvent event = createUserEvent("password-update", adminUser);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user.password-update"), eq(event));
    }

    @Test
    void publishEvent_ShouldAddUserPrefix_WhenEventTypeHasNoPrefix() {
        // Given
        UserEvent event = createUserEvent("custom-event", testUser);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user.custom-event"), eq(event));
    }

    @Test
    void publishEvent_ShouldNotAddPrefix_WhenEventTypeAlreadyHasUserPrefix() {
        // Given
        UserEvent event = createUserEvent("user.already-prefixed", testUser);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user.already-prefixed"), eq(event));
    }

    @Test
    void publishEvent_ShouldHandleRabbitException_Gracefully() {
        // Given
        UserEvent event = createUserEvent("new-user", testUser);
        doThrow(new RuntimeException("RabbitMQ connection failed"))
                .when(rabbitTemplate).convertAndSend(anyString(), anyString(), any(Object.class));

        // When & Then - should not throw exception (exception is caught and logged)
        assertDoesNotThrow(() -> userEventService.publishEvent(event));

        // Verify the call was made despite the exception
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user.new-user"), eq(event));
    }

    @Test
    void publishEvent_ShouldSendCorrectEventData_WhenValidEvent() {
        // Given
        UserEvent event = createUserEvent("new-user", testUser);
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("registrationSource", "web");
        event.setAdditionalData(additionalData);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(
                eq("microservices.events"),
                eq("user.new-user"),
                argThat((UserEvent sentEvent) -> {
                    return sentEvent.getUserId().equals(1L) &&
                           sentEvent.getUsername().equals("testuser") &&
                           sentEvent.getEmail().equals("test@example.com") &&
                           sentEvent.getMobileNumber().equals("+1234567890") &&
                           sentEvent.getEventType().equals("new-user") &&
                           sentEvent.getAdditionalData() != null &&
                           "web".equals(sentEvent.getAdditionalData().get("registrationSource"));
                })
        );
    }

    @Test
    void publishEvent_ShouldHandleEventWithNullAdditionalData() {
        // Given
        UserEvent event = createUserEvent("login", testUser);
        event.setAdditionalData(null);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user.login"), eq(event));
    }

    @Test
    void publishEvent_ShouldSendMultipleEvents_WhenCalledSequentially() {
        // Given
        UserEvent loginEvent = createUserEvent("login", testUser);
        UserEvent logoutEvent = createUserEvent("logout", testUser);
        UserEvent newUserEvent = createUserEvent("new-user", adminUser);

        // When
        userEventService.publishEvent(loginEvent);
        userEventService.publishEvent(logoutEvent);
        userEventService.publishEvent(newUserEvent);

        // Then
        verify(rabbitTemplate).convertAndSend(eq("microservices.events"), eq("user.login"), eq(loginEvent));
        verify(rabbitTemplate).convertAndSend(eq("microservices.events"), eq("user.logout"), eq(logoutEvent));
        verify(rabbitTemplate).convertAndSend(eq("microservices.events"), eq("user.new-user"), eq(newUserEvent));

        // Verify total interactions
        verify(rabbitTemplate, times(3)).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    void publishEvent_ShouldHandleDifferentUsers_Correctly() {
        // Given
        UserEvent testUserEvent = createUserEvent("login", testUser);
        UserEvent adminUserEvent = createUserEvent("login", adminUser);

        // When
        userEventService.publishEvent(testUserEvent);
        userEventService.publishEvent(adminUserEvent);

        // Then
        verify(rabbitTemplate).convertAndSend(
                eq("microservices.events"),
                eq("user.login"),
                argThat((UserEvent event) -> event.getUserId().equals(1L))
        );

        verify(rabbitTemplate).convertAndSend(
                eq("microservices.events"),
                eq("user.login"),
                argThat((UserEvent event) -> event.getUserId().equals(2L))
        );

        verify(rabbitTemplate, times(2)).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    void publishEvent_ShouldIncludeTimestamp_InEvent() {
        // Given
        UserEvent event = createUserEvent("new-user", testUser);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(
                eq("microservices.events"),
                eq("user.new-user"),
                argThat((UserEvent sentEvent) -> sentEvent.getTimestamp() != null)
        );
    }

    @Test
    void publishEvent_ShouldHandleSpecialCharactersInEventType() {
        // Given
        UserEvent event = createUserEvent("profile-update", testUser);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user.profile-update"), eq(event));
    }

    @Test
    void publishEvent_ShouldSendEventWithCompleteUserData() {
        // Given
        UserEvent event = createUserEvent("new-user", adminUser);
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("role", "ADMIN");
        additionalData.put("source", "admin-panel");
        event.setAdditionalData(additionalData);

        // When
        userEventService.publishEvent(event);

        // Then
        verify(rabbitTemplate, times(1)).convertAndSend(
                eq("microservices.events"),
                eq("user.new-user"),
                argThat((UserEvent sentEvent) -> {
                    return sentEvent.getUserId().equals(2L) &&
                           sentEvent.getUsername().equals("admin") &&
                           sentEvent.getEmail().equals("admin@example.com") &&
                           sentEvent.getMobileNumber().equals("+9876543210") &&
                           sentEvent.getAdditionalData() != null &&
                           "ADMIN".equals(sentEvent.getAdditionalData().get("role")) &&
                           "admin-panel".equals(sentEvent.getAdditionalData().get("source"));
                })
        );
    }

    @Test
    void publishEvent_ShouldHandleNullEvent_WithException() {
        // When & Then - null events will cause NullPointerException
        assertThrows(NullPointerException.class, () -> userEventService.publishEvent(null));

        // Verify no interaction with RabbitTemplate for null event
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    void publishEvent_ShouldHandleEventWithNullEventType() {
        // Given
        UserEvent event = createUserEvent(null, testUser);

        // When & Then - null eventType will cause issues
        assertThrows(NullPointerException.class, () -> userEventService.publishEvent(event));
    }

    @Test
    void publishEvent_ShouldHandleEmptyEventType() {
        // Given
        UserEvent event = createUserEvent("", testUser);

        // When
        userEventService.publishEvent(event);

        // Then - empty string gets "user." prefix
        verify(rabbitTemplate, times(1)).convertAndSend(eq("microservices.events"), eq("user."), eq(event));
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

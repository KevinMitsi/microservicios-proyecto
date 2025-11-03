package com.proyecto.msvc_auth.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserEvent {
    private String eventType; // new-user, login, password-recovery, password-update
    private Long userId;
    private String username;
    private String email;
    private String mobileNumber;
    private LocalDateTime timestamp;
    private Map<String, Object> additionalData;
}

package com.proyecto.msvc_auth.security;

import com.proyecto.msvc_auth.Entity.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private CurrentUserService(){}

    public static UserEntity getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return (UserEntity) authentication.getPrincipal();
        }
        return null;
    }

    public static boolean isCurrentUser(String userId, String currentUsername) {
        return currentUsername != null && currentUsername.equals(userId);
    }
}
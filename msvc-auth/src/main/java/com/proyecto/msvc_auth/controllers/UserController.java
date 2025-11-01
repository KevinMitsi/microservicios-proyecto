package com.proyecto.msvc_auth.controllers;

import com.proyecto.msvc_auth.DTO.AuthResponse;
import com.proyecto.msvc_auth.DTO.LoginRequest;
import com.proyecto.msvc_auth.DTO.UserRegistrationRequest;
import com.proyecto.msvc_auth.DTO.UserUpdateRequest;
import com.proyecto.msvc_auth.Entity.Role;
import com.proyecto.msvc_auth.Entity.UserEntity;

import com.proyecto.msvc_auth.security.CurrentUserService;
import com.proyecto.msvc_auth.services.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final CurrentUserService currentUserService;

    @PostMapping("/users")
    public ResponseEntity<UserEntity> registerUser(@RequestBody UserRegistrationRequest request) {
        UserEntity createdUser = userService.registerUser(request);
        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName) {
        Pageable paging = PageRequest.of(page, size);
        Page<UserEntity> usersPage = userService.getAllUsersFiltered(paging, firstName, lastName);
        Map<String, Object> response = new HashMap<>();
        response.put("content", usersPage.getContent());
        response.put("totalElements", usersPage.getTotalElements());
        response.put("totalPages", usersPage.getTotalPages());
        response.put("size", usersPage.getSize());
        response.put("number", usersPage.getNumber());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserEntity> getUserById(@PathVariable Long id) {
        Optional<UserEntity> userOpt = userService.getUserById(id);
        // No lógica ni throws, solo respuesta directa
        return userOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserEntity> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest updateRequest) {
        Optional<UserEntity> userOpt = userService.getUserById(id);
        // No lógica ni throws, solo respuesta directa
        return userOpt.map(user -> ResponseEntity.ok(userService.updateUser(id, updateRequest)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        Optional<UserEntity> userOpt = userService.getUserById(id);
        // No lógica ni throws, solo respuesta directa
        if (userOpt.isPresent()) {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/auth/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = userService.login(loginRequest);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/auth/tokens")
    public ResponseEntity<Map<String, String>> requestPasswordRecovery(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email es obligatorio");
        }
        userService.requestPasswordRecovery(email);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Se ha enviado un correo con instrucciones para restablecer la contraseña");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/users/{id}/password")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        if (token == null || token.isEmpty() || newPassword == null || newPassword.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token y nueva contraseña son obligatorios");
        }
        userService.resetPasswordForUser(id, token, newPassword);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Contraseña restablecida correctamente");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/roles")
    public ResponseEntity<UserEntity> updateUserRoles(@PathVariable Long id, @RequestBody Set<Role> roles) {
        String currentUsername = Objects.requireNonNull(CurrentUserService.getCurrentUser()).getUsername();
        Optional<UserEntity> currentUserOpt = userService.getUserByUsername(currentUsername);
        if (currentUserOpt.isEmpty() || !currentUserOpt.get().hasRole(Role.ADMIN)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para modificar roles");
        }
        UserEntity updatedUser = userService.updateUserRoles(id, roles);
        return ResponseEntity.ok(updatedUser);
    }
}

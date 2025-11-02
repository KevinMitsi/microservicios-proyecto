package com.proyecto.msvc_auth.config;

import com.proyecto.msvc_auth.Entity.Role;
import com.proyecto.msvc_auth.Entity.UserEntity;
import com.proyecto.msvc_auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${spring.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            UserEntity admin = new UserEntity();
            admin.setUsername("admin");
            admin.setEmail("admin@example.com");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setFirstName("Admin");
            admin.setLastName("User");
            admin.setMobileNumber("0000000000");
            admin.setAuthorities(Collections.singleton(Role.ADMIN));
            userRepository.save(admin);
        }
    }
}

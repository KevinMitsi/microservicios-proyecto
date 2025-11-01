package com.proyecto.msvc_auth.repository;

import com.proyecto.msvc_auth.Entity.UserEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
    // Find by email (for password recovery and duplicate checks)
    Optional<UserEntity> findByEmail(String email);

    // Check if username exists (for registration validation)
    boolean existsByUsername(String username);

    // Check if email exists (for registration validation)
    boolean existsByEmail(String email);


    // Search users by any field
    Page<UserEntity> findByUsernameContainingOrEmailContainingOrFirstNameContainingOrLastNameContaining(
            String username, String email, String firstName, String lastName, Pageable pageable);

    // Filtrar por nombre (firstName) ignorando mayúsculas/minúsculas
    Page<UserEntity> findByFirstNameContainingIgnoreCase(String firstName, Pageable pageable);

    // Filtrar por apellido (lastName) ignorando mayúsculas/minúsculas
    Page<UserEntity> findByLastNameContainingIgnoreCase(String lastName, Pageable pageable);

    // Filtrar por nombre y apellido (ambos) ignorando mayúsculas/minúsculas
    Page<UserEntity> findByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase(String firstName, String lastName, Pageable pageable);

}

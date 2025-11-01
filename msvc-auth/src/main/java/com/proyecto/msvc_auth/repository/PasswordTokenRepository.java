package com.proyecto.msvc_auth.repository;

import com.proyecto.msvc_auth.Entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    List<PasswordResetToken> findByUserId(Long userId);
    void deleteByToken(String token);
    void deleteByUserId(Long userId);
    List<PasswordResetToken> findByExpiryDateBefore(LocalDateTime dateTime);
    void deleteByExpiryDateBefore(LocalDateTime dateTime);
    boolean existsByToken(String token);
    boolean existsByUserIdAndExpiryDateAfter(Long userId, LocalDateTime dateTime);
}

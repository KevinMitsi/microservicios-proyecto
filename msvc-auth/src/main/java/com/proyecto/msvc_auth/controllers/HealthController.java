package com.proyecto.msvc_auth.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@Slf4j
public class HealthController {

    @GetMapping
    public ResponseEntity<Void> healthCheck() {
        log.info("Health check endpoint called, service is healthy.");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/ready")
    public ResponseEntity<Void> readinessCheck() {
        log.info("Readiness check endpoint called, service is ready.");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/live")
    public ResponseEntity<Void> livenessCheck() {
        log.info("Liveness check endpoint called, service is alive.");
        return ResponseEntity.ok().build();
    }
}

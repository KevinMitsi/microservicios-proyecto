package com.proyecto.msvc_auth.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Slf4j
public class HealthController {

    public static final String RESPONSE_KEY1 = "status";
    public static final String K_2 = "message";

    @GetMapping
    public ResponseEntity<Map<String, String>> healthCheck() {
        log.info("Health check endpoint called, service is healthy.");
        Map<String, String> body = Map.of(RESPONSE_KEY1, "ok", K_2, "Todo está bien");
        return ResponseEntity.ok(body);
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, String>> readinessCheck() {
        log.info("Readiness check endpoint called, service is ready.");
        Map<String, String> body = Map.of(RESPONSE_KEY1, "ok", K_2, "Ready");
        return ResponseEntity.ok(body);
    }

    @GetMapping("/live")
    public ResponseEntity<Map<String, String>> livenessCheck() {
        log.info("Liveness check endpoint called, service is alive.");
        Map<String, String> body = Map.of(RESPONSE_KEY1, "ok", K_2, "Live");
        return ResponseEntity.ok(body);
    }
}

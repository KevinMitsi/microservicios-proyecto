package com.proyecto.msvc_auth.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
public class RabbitMQLogger {

    private static final Logger log = LoggerFactory.getLogger(RabbitMQLogger.class);

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${rabbitmq.log.queue:log_queue}")
    private String logQueueName;

    @Value("${spring.application.name:msvc-auth}")
    private String serviceName;

    private void sendLog(String level, String message, Map<String, Object> meta) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("service", serviceName);
            payload.put("level", level);
            payload.put("message", message);
            payload.put("meta", meta != null ? meta : new HashMap<>());
            payload.put("timestamp", Instant.now().toString());

            String jsonPayload = objectMapper.writeValueAsString(payload);
            rabbitTemplate.convertAndSend(logQueueName, jsonPayload);
        } catch (Exception e) {
            // Don't fail the application if logging fails
            log.error("Failed to send log to RabbitMQ: {}", e.getMessage());
        }
    }

    public void info(String message) {
        info(message, null);
    }

    public void info(String message, Map<String, Object> meta) {
        log.info(message);
        sendLog("info", message, meta);
    }

    public void warn(String message) {
        warn(message, null);
    }

    public void warn(String message, Map<String, Object> meta) {
        log.warn(message);
        sendLog("warn", message, meta);
    }

    public void error(String message) {
        log.error(message);
        sendLog("error", message, null);
    }

    public void error(String message, Map<String, Object> meta) {
        log.error(message);
        sendLog("error", message, meta);
    }

    public void errorWithException(String message, Throwable throwable) {
        log.error(message, throwable);
        Map<String, Object> meta = new HashMap<>();
        meta.put("exception", throwable.getClass().getName());
        meta.put("exceptionMessage", throwable.getMessage());
        if (throwable.getStackTrace().length > 0) {
            meta.put("stackTrace", throwable.getStackTrace()[0].toString());
        }
        sendLog("error", message, meta);
    }

    public void debug(String message) {
        debug(message, null);
    }

    public void debug(String message, Map<String, Object> meta) {
        log.debug(message);
        sendLog("debug", message, meta);
    }
}


package com.proyecto.msvc_auth.services.impl;

import com.proyecto.msvc_auth.models.UserEvent;
import com.proyecto.msvc_auth.services.UserEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserEventServiceImpl implements UserEventService {

    public static final String USER_EVENTS_EXCHANGE = "microservices.events";
    private final RabbitTemplate rabbitTemplate;

    @Override
    public void publishEvent(UserEvent event) {
        try {
            String routingKey = event.getEventType();
            if (!routingKey.startsWith("user.")) {
                routingKey = "user." + routingKey;
            }
            rabbitTemplate.convertAndSend(
                    USER_EVENTS_EXCHANGE,
                    routingKey,
                    event
            );
            log.info("Evento publicado: type={}, userId={}, username={}",
                    routingKey,
                    event.getUserId(),
                    event.getUsername());
        } catch (Exception e) {
            log.error("Error al publicar evento: type={}, userId={}, error={}",
                    event.getEventType(),
                    event.getUserId(),
                    e.getMessage());
        }
    }
}
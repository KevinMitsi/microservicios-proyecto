package com.proyecto.msvc_auth.services.impl;

import com.proyecto.msvc_auth.models.UserEvent;
import com.proyecto.msvc_auth.services.NotificationService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {
    @Override
    public void sendNotification(UserEvent notificationRequest) {
        // Aquí procesas la notificación recibida
        System.out.println("Notificación recibida: " + notificationRequest.getEventType() + " para usuario: " + notificationRequest.getUserId());
        // Lógica de negocio para manejar la notificación
    }

    @RabbitListener(queues = "notifications.queue")
    public void handleUserEvent(UserEvent event) {
        // Solo procesar eventos de tipo user.*
        if (event.getEventType() != null && event.getEventType().startsWith("user.")) {
            sendNotification(event);
        } else {
            System.out.println("Evento ignorado: " + event.getEventType());
        }
    }
}

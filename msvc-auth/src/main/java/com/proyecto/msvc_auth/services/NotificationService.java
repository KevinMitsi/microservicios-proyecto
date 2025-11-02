package com.proyecto.msvc_auth.services;

import com.proyecto.msvc_auth.models.UserEvent;

public interface NotificationService {
    void sendNotification(UserEvent notificationRequest);
}


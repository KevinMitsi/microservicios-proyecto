package com.proyecto.msvc_auth.config;

import org.springframework.amqp.core.Queue;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQLoggerConfig {

    @Value("${rabbitmq.log.queue:log_queue}")
    private String logQueueName;

    @Bean
    public Queue logQueue() {
        return new Queue(logQueueName, true); // durable queue
    }
}


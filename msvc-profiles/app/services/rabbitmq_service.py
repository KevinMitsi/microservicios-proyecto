import pika
import json
import logging
from typing import Callable
from app.core.config import settings
import asyncio
from threading import Thread

logger = logging.getLogger(__name__)


class RabbitMQService:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange_name = settings.rabbitmq_exchange
        self.queue_name = settings.rabbitmq_queue
        self.is_connected = False

    def connect(self, max_retries: int = None, retry_delay: int = 5):
        """Conectar a RabbitMQ con reintentos"""
        attempt = 0
        while True:
            try:
                attempt += 1
                logger.info(f"🔄 Connecting to RabbitMQ... (Attempt {attempt})")

                # Parse RabbitMQ URL
                parameters = pika.URLParameters(settings.rabbitmq_url)
                parameters.heartbeat = 600
                parameters.blocked_connection_timeout = 300

                self.connection = pika.BlockingConnection(parameters)
                self.channel = self.connection.channel()

                # Declare exchange (topic type)
                self.channel.exchange_declare(
                    exchange=self.exchange_name,
                    exchange_type='topic',
                    durable=True
                )

                # Declare queue
                self.channel.queue_declare(queue=self.queue_name, durable=True)

                # Bind queue to exchange with routing keys
                routing_keys = ['profile.*', 'user.*']
                for routing_key in routing_keys:
                    self.channel.queue_bind(
                        exchange=self.exchange_name,
                        queue=self.queue_name,
                        routing_key=routing_key
                    )
                    logger.info(f"🔗 Queue bound to exchange with routing key: {routing_key}")

                self.is_connected = True
                logger.info("✅ RabbitMQ Connected")
                break
            except Exception as e:
                logger.error(f"❌ Failed to connect to RabbitMQ: {e}")
                self.is_connected = False
                if max_retries is not None and attempt >= max_retries:
                    logger.error(f"❌ Max retries reached. Giving up.")
                    raise
                logger.info(f"⏳ Retrying in {retry_delay} seconds...")
                import time
                time.sleep(retry_delay)

    def publish_event(self, routing_key: str, event: dict):
        """Publicar un evento en RabbitMQ"""
        try:
            if not self.is_connected or not self.channel:
                logger.warning("⚠️ RabbitMQ not connected, attempting to reconnect...")
                self.connect()

            message = json.dumps(event)

            self.channel.basic_publish(
                exchange=self.exchange_name,
                routing_key=routing_key,
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json'
                )
            )

            logger.info(f"📤 Event published with routing key: {routing_key}")

        except Exception as e:
            logger.error(f"❌ Error publishing event: {e}")
            self.is_connected = False
            raise

    def start_consuming(self, callback: Callable):
        """Comenzar a consumir mensajes"""
        try:
            if not self.is_connected:
                self.connect()

            self.channel.basic_qos(prefetch_count=1)
            self.channel.basic_consume(
                queue=self.queue_name,
                on_message_callback=callback,
                auto_ack=False
            )

            logger.info(f"🎧 Listening for messages on queue: {self.queue_name}")
            self.channel.start_consuming()

        except Exception as e:
            logger.error(f"❌ Error consuming messages: {e}")
            raise

    def close(self):
        """Cerrar conexión a RabbitMQ"""
        try:
            if self.channel and self.channel.is_open:
                self.channel.close()
            if self.connection and self.connection.is_open:
                self.connection.close()
            self.is_connected = False
            logger.info("✅ RabbitMQ Connection Closed")
        except Exception as e:
            logger.error(f"❌ Error closing RabbitMQ connection: {e}")


# Global instance
rabbitmq_service = RabbitMQService()


def start_consumer_thread(profile_service):
    """Iniciar consumer en un thread separado"""
    def callback(ch, method, properties, body):
        try:
            event = json.loads(body.decode())
            logger.info(f"📨 Received event: {event}")

            # Process event based on type
            event_type = event.get('type') or event.get('eventType')

            if event_type == 'USER_REGISTERED':
                # Create profile for new user
                user_id = event.get('userId')
                username = event.get('username') or event.get('data', {}).get('username')

                if user_id and username:
                    # Use asyncio to run async function
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(
                        profile_service.create_profile_from_event(user_id, username)
                    )
                    loop.close()
                    logger.info(f"✅ Profile created for user: {username}")

            # Acknowledge message
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as e:
            logger.error(f"❌ Error processing message: {e}")
            # Reject and don't requeue
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def consume():
        try:
            rabbitmq_service.start_consuming(callback)
        except Exception as e:
            logger.error(f"❌ Consumer thread error: {e}")

    consumer_thread = Thread(target=consume, daemon=True)
    consumer_thread.start()
    logger.info("🚀 RabbitMQ consumer thread started")

import logging
import json
import os
from datetime import datetime
import pika
from typing import Optional, Any

RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://admin:admin@rabbitmq:5672')
RABBITMQ_QUEUE = os.getenv('RABBITMQ_LOG_QUEUE', 'log_queue')
SERVICE_NAME = os.getenv('SERVICE_NAME', 'msvc-profiles')

class RabbitMQHandler(logging.Handler):
    """Custom logging handler that sends logs to RabbitMQ"""

    def __init__(self, rabbitmq_url: str, queue_name: str, service_name: str):
        super().__init__()
        self.rabbitmq_url = rabbitmq_url
        self.queue_name = queue_name
        self.service_name = service_name
        self.connection = None
        self.channel = None
        self._connect()

    def _connect(self):
        """Establish connection to RabbitMQ"""
        try:
            params = pika.URLParameters(self.rabbitmq_url)
            self.connection = pika.BlockingConnection(params)
            self.channel = self.connection.channel()
            self.channel.queue_declare(queue=self.queue_name, durable=True)
        except Exception as e:
            print(f"Failed to connect to RabbitMQ: {e}")
            self.connection = None
            self.channel = None

    def emit(self, record: logging.LogRecord):
        """Send log record to RabbitMQ"""
        if not self.channel:
            self._connect()

        if not self.channel:
            return  # Still not connected, skip

        try:
            # Format log payload
            payload = {
                'service': self.service_name,
                'level': record.levelname.lower(),
                'message': record.getMessage(),
                'meta': {
                    'module': record.module,
                    'funcName': record.funcName,
                    'lineno': record.lineno,
                },
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }

            # Add extra fields if present
            if hasattr(record, 'meta'):
                payload['meta'].update(record.meta)

            # Send to RabbitMQ
            self.channel.basic_publish(
                exchange='',
                routing_key=self.queue_name,
                body=json.dumps(payload).encode('utf-8'),
                properties=pika.BasicProperties(delivery_mode=2)  # Make message persistent
            )
        except Exception as e:
            print(f"Failed to publish log to RabbitMQ: {e}")
            self.connection = None
            self.channel = None

    def close(self):
        """Close RabbitMQ connection"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()
        super().close()

# Create logger
logger = logging.getLogger('msvc-profiles')
logger.setLevel(logging.INFO)

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter(
    '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# RabbitMQ handler
try:
    rabbitmq_handler = RabbitMQHandler(RABBITMQ_URL, RABBITMQ_QUEUE, SERVICE_NAME)
    rabbitmq_handler.setLevel(logging.INFO)
    logger.addHandler(rabbitmq_handler)
except Exception as e:
    print(f"Warning: Could not initialize RabbitMQ logging handler: {e}")

# Utility functions for easier logging with metadata
def log_with_meta(level: str, message: str, meta: Optional[dict[str, Any]] = None):
    """Log a message with optional metadata"""
    if meta:
        logger.log(getattr(logging, level.upper()), message, extra={'meta': meta})
    else:
        logger.log(getattr(logging, level.upper()), message)

def info(message: str, meta: Optional[dict[str, Any]] = None):
    """Log an info message"""
    log_with_meta('info', message, meta)

def warning(message: str, meta: Optional[dict[str, Any]] = None):
    """Log a warning message"""
    log_with_meta('warning', message, meta)

def error(message: str, meta: Optional[dict[str, Any]] = None):
    """Log an error message"""
    log_with_meta('error', message, meta)

def debug(message: str, meta: Optional[dict[str, Any]] = None):
    """Log a debug message"""
    log_with_meta('debug', message, meta)


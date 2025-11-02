import pika
import json
import uuid

def send_log_message(message, level='info'):
    """
    Sends a log message to the RabbitMQ 'log_queue'.
    """
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost'))
        channel = connection.channel()

        channel.queue_declare(queue='log_queue', durable=True)

        log_entry = {
            'message': message,
            'level': level,
            'service': 'test-service',
            'correlation_id': str(uuid.uuid4())
        }

        channel.basic_publish(
            exchange='',
            routing_key='log_queue',
            body=json.dumps(log_entry),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            ))
        print(f" [x] Sent log message: '{message}'")
        connection.close()
        return log_entry['correlation_id']
    except pika.exceptions.AMQPConnectionError as e:
        print(f"Error connecting to RabbitMQ: {e}")
        return None


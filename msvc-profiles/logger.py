import logging
from logstash_async.handler import AsynchronousLogstashHandler

# Create a logger
logger = logging.getLogger('fastapi-logger')
logger.setLevel(logging.INFO)

# Create a handler
handler = AsynchronousLogstashHandler('logstash', 5044, database_path='logstash.db')

# Add the handler to the logger
logger.addHandler(handler)


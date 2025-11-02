import time
import pytest
from opensearchpy import OpenSearch
from log_sender import send_log_message

# --- Test Configuration ---
OPENSEARCH_HOST = 'localhost'
OPENSEARCH_PORT = 9200
INDEX_NAME_PREFIX = 'logs-'

# --- Fixtures ---
@pytest.fixture(scope="module")
def opensearch_client():
    """Provides an OpenSearch client for the test module."""
    client = OpenSearch(
        hosts=[{'host': OPENSEARCH_HOST, 'port': OPENSEARCH_PORT, 'scheme': 'http'}]
    )
    # Wait for OpenSearch to be ready
    for _ in range(10):
        if client.ping():
            print("OpenSearch is ready.")
            return client
        time.sleep(5)
    pytest.fail("Could not connect to OpenSearch.")

# --- Test Cases ---
def test_log_pipeline_e2e(opensearch_client):
    """
    End-to-end test for the logging pipeline.
    1. Sends a log message to RabbitMQ.
    2. Waits for Logstash to process it.
    3. Queries OpenSearch to verify the log was indexed.
    """
    # 1. Send a unique log message
    test_message = "This is a unique test message for the E2E pipeline test."
    correlation_id = send_log_message(test_message, level='e2e-test')

    assert correlation_id is not None, "Failed to send log message to RabbitMQ."
    print(f"Log message sent with correlation_id: {correlation_id}")

    # 2. Wait for the pipeline to process the message
    # This delay is crucial. Adjust if your pipeline is slower.
    time.sleep(15)

    # 3. Query OpenSearch for the message
    # The index name is date-based, so we get today's index
    index_name = INDEX_NAME_PREFIX + time.strftime('%Y.%m.%d')

    query = {
        "query": {
            "match": {
                "correlation_id": correlation_id
            }
        }
    }

    print(f"Querying OpenSearch index '{index_name}' for correlation_id: {correlation_id}")

    try:
        response = opensearch_client.search(
            index=index_name,
            body=query
        )

        # 4. Assert the log was found
        hits = response['hits']['hits']
        print(f"OpenSearch response: {response}")

        assert len(hits) > 0, f"Log with correlation_id '{correlation_id}' not found in OpenSearch."

        found_log = hits[0]['_source']
        assert found_log['message'] == test_message
        assert found_log['level'] == 'e2e-test'

        print(f"Successfully verified log in OpenSearch: {found_log}")

    except Exception as e:
        pytest.fail(f"An error occurred while querying OpenSearch: {e}")


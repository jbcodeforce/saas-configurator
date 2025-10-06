import pytest

from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)



def test_create_configuration(client):
    """Test creating a new configuration."""
    # Test data
    config_data = {
        "name": "Test Configuration",
        "description": "A test configuration"
    }

    # Create configuration
    response = client.post("/configurations/", json=config_data)

    # Assert response status code is 201 (Created)
    assert response.status_code == 201

    # Get response data
    created_config = response.json()
    print(created_config)

if __name__ == "__main__":
    pytest.main()
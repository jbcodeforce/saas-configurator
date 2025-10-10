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
    print(f"created_config = {created_config}")
    assert created_config["name"] == config_data["name"]
    assert created_config["description"] == config_data["description"]
    assert created_config["status"] == "draft"
    print(f"question = {created_config['configuration_data']['missingData']}")

if __name__ == "__main__":
    pytest.main()
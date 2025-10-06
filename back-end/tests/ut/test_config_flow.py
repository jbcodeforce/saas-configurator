"""Unit tests for configuration flow."""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.models import ConfigurationStatus
from app.database import db
from app.re_client import RuleEngineClient


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_db():
    """Clear database before each test."""
    db.configurations.clear()
    yield
    db.configurations.clear()


@pytest.fixture(autouse=False)
def mock_rule_engine():
    """Mock the Rule Engine client."""
    mock_client = Mock()
    mock_client.check_server_status.return_value = True
    mock_client.configure.return_value = {
        "cluster_size": "small",
        "environment": "development",
        "region": "us-east-1",
        "validated": True
    }

    with patch.object(RuleEngineClient, 'get_instance', return_value=mock_client):
        yield mock_client


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

    # Assert the configuration was created with correct data
    assert created_config["name"] == config_data["name"]
    assert created_config["description"] == config_data["description"]
    assert created_config["status"] == ConfigurationStatus.DRAFT

    # Assert configuration_data is present and contains mocked rule engine data
    assert created_config["configuration_data"] == {
        "cluster_size": "small",
        "environment": "development",
        "region": "us-east-1",
        "validated": True
    }

    # Assert database fields are present
    assert "id" in created_config
    assert "created_at" in created_config
    assert "updated_at" in created_config

    # Verify configuration exists in database
    assert len(db.configurations) == 1
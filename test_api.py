#!/usr/bin/env python3
"""
Simple test script to verify the SaaS Configurator API endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)


def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "saas-configurator"
    print("✅ Health check test passed")


def test_root_endpoint():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Welcome to SaaS Configurator API" in data["message"]
    assert data["version"] == "1.0.0"
    print("✅ Root endpoint test passed")


def test_create_configuration():
    """Test creating a configuration."""
    config_data = {
        "name": "Test Configuration",
        "description": "A test configuration",
        "cluster_type": "test-cluster", 
        "version": "1.0.0",
        "status": "draft",
        "configuration_data": {"test": "data"},
        "tags": ["test"]
    }
    
    response = client.post("/configurations/", json=config_data)
    assert response.status_code == 201
    
    created_config = response.json()
    assert created_config["name"] == config_data["name"]
    assert created_config["cluster_type"] == config_data["cluster_type"]
    assert created_config["status"] == config_data["status"]
    assert "id" in created_config
    assert "created_at" in created_config
    assert "updated_at" in created_config
    
    print("✅ Create configuration test passed")
    return created_config


def test_list_configurations():
    """Test listing configurations."""
    # First create a configuration
    test_create_configuration()
    
    response = client.get("/configurations/")
    assert response.status_code == 200
    
    data = response.json()
    assert "items" in data
    assert "total" in data  
    assert "page" in data
    assert "size" in data
    assert "pages" in data
    assert data["total"] >= 1
    assert len(data["items"]) >= 1
    
    print("✅ List configurations test passed")


def test_get_configuration():
    """Test getting a specific configuration."""
    # Create a configuration first
    created_config = test_create_configuration()
    config_id = created_config["id"]
    
    response = client.get(f"/configurations/{config_id}")
    assert response.status_code == 200
    
    config = response.json()
    assert config["id"] == config_id
    assert config["name"] == created_config["name"]
    
    print("✅ Get configuration test passed")


def test_update_configuration():
    """Test updating a configuration."""
    # Create a configuration first
    created_config = test_create_configuration()
    config_id = created_config["id"]
    
    update_data = {
        "description": "Updated description", 
        "status": "active"
    }
    
    response = client.put(f"/configurations/{config_id}", json=update_data)
    assert response.status_code == 200
    
    updated_config = response.json()
    assert updated_config["description"] == update_data["description"]
    assert updated_config["status"] == update_data["status"]
    assert updated_config["name"] == created_config["name"]  # Should remain unchanged
    
    print("✅ Update configuration test passed")


def test_delete_configuration():
    """Test deleting a configuration."""
    # Create a configuration first
    created_config = test_create_configuration()
    config_id = created_config["id"]
    
    # Delete the configuration
    response = client.delete(f"/configurations/{config_id}")
    assert response.status_code == 204
    
    # Verify it's gone
    response = client.get(f"/configurations/{config_id}")
    assert response.status_code == 404
    
    print("✅ Delete configuration test passed")


def test_configuration_not_found():
    """Test handling of non-existent configuration."""
    response = client.get("/configurations/99999")
    assert response.status_code == 404
    
    response = client.put("/configurations/99999", json={"name": "test"})
    assert response.status_code == 404
    
    response = client.delete("/configurations/99999")
    assert response.status_code == 404
    
    print("✅ Configuration not found test passed")


def test_configuration_filtering():
    """Test configuration filtering.""" 
    # Create configurations with different statuses
    active_config = {
        "name": "Active Config",
        "cluster_type": "kubernetes",
        "version": "1.0.0", 
        "status": "active"
    }
    
    draft_config = {
        "name": "Draft Config", 
        "cluster_type": "docker",
        "version": "1.0.0",
        "status": "draft"
    }
    
    client.post("/configurations/", json=active_config)
    client.post("/configurations/", json=draft_config)
    
    # Test filter by status
    response = client.get("/configurations/?status=active")
    assert response.status_code == 200
    data = response.json()
    for config in data["items"]:
        assert config["status"] == "active"
    
    # Test filter by cluster_type
    response = client.get("/configurations/?cluster_type=kubernetes")
    assert response.status_code == 200
    data = response.json()
    for config in data["items"]:
        assert config["cluster_type"] == "kubernetes"
    
    print("✅ Configuration filtering test passed")


def run_all_tests():
    """Run all API tests."""
    print("🧪 Running SaaS Configurator API Tests")
    print("=" * 50)
    
    try:
        test_health_check()
        test_root_endpoint()
        test_create_configuration()
        test_list_configurations()
        test_get_configuration()
        test_update_configuration()
        test_delete_configuration()
        test_configuration_not_found()
        test_configuration_filtering()
        
        print("\n🎉 All tests passed!")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return False
    except Exception as e:
        print(f"\n💥 Test error: {e}")
        return False
    
    return True


if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)


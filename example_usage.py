#!/usr/bin/env python3
"""
Example usage script for the SaaS Configurator API.
This script demonstrates how to interact with the API programmatically.
"""

import httpx
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"


def create_example_configuration() -> Dict[str, Any]:
    """Create an example configuration."""
    config_data = {
        "name": "Production Kubernetes Cluster",
        "description": "Main production cluster for critical workloads",
        "cluster_type": "kubernetes", 
        "version": "1.2.3",
        "status": "active",
        "configuration_data": {
            "nodes": 5,
            "cpu_per_node": "8 cores",
            "memory_per_node": "32GB",
            "storage_per_node": "1TB NVMe SSD",
            "network": "10Gbps",
            "availability_zones": ["us-east-1a", "us-east-1b", "us-east-1c"]
        },
        "tags": ["production", "kubernetes", "high-availability", "critical"]
    }
    
    print("Creating example configuration...")
    print(f"Data: {json.dumps(config_data, indent=2)}")
    
    with httpx.Client() as client:
        response = client.post(f"{BASE_URL}/configurations/", json=config_data)
        
        if response.status_code == 201:
            created_config = response.json()
            print(f"✅ Configuration created successfully with ID: {created_config['id']}")
            return created_config
        else:
            print(f"❌ Failed to create configuration: {response.status_code} - {response.text}")
            return {}


def list_configurations():
    """List all configurations."""
    print("\n" + "="*50)
    print("Listing all configurations...")
    
    with httpx.Client() as client:
        response = client.get(f"{BASE_URL}/configurations/")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total']} configurations:")
            
            for config in data['items']:
                print(f"  - ID: {config['id']} | Name: {config['name']} | Status: {config['status']} | Type: {config['cluster_type']}")
        else:
            print(f"❌ Failed to list configurations: {response.status_code} - {response.text}")


def get_configuration(config_id: int):
    """Get a specific configuration by ID."""
    print(f"\nGetting configuration with ID {config_id}...")
    
    with httpx.Client() as client:
        response = client.get(f"{BASE_URL}/configurations/{config_id}")
        
        if response.status_code == 200:
            config = response.json()
            print("✅ Configuration details:")
            print(json.dumps(config, indent=2, default=str))
        else:
            print(f"❌ Failed to get configuration: {response.status_code} - {response.text}")


def update_configuration(config_id: int):
    """Update a configuration."""
    print(f"\nUpdating configuration with ID {config_id}...")
    
    update_data = {
        "description": "Updated: Production cluster with enhanced security",
        "status": "active",
        "tags": ["production", "kubernetes", "high-availability", "critical", "security-enhanced"]
    }
    
    with httpx.Client() as client:
        response = client.put(f"{BASE_URL}/configurations/{config_id}", json=update_data)
        
        if response.status_code == 200:
            updated_config = response.json()
            print("✅ Configuration updated successfully:")
            print(f"  - Description: {updated_config['description']}")
            print(f"  - Tags: {', '.join(updated_config['tags'])}")
        else:
            print(f"❌ Failed to update configuration: {response.status_code} - {response.text}")


def create_development_config():
    """Create a development configuration."""
    config_data = {
        "name": "Development Environment", 
        "description": "Development cluster for testing new features",
        "cluster_type": "docker-compose",
        "version": "1.0.0", 
        "status": "draft",
        "configuration_data": {
            "containers": 3,
            "cpu_limit": "2 cores",
            "memory_limit": "8GB", 
            "volumes": ["app-data", "logs", "temp"]
        },
        "tags": ["development", "docker", "testing"]
    }
    
    print(f"\nCreating development configuration...")
    
    with httpx.Client() as client:
        response = client.post(f"{BASE_URL}/configurations/", json=config_data)
        
        if response.status_code == 201:
            created_config = response.json()
            print(f"✅ Development configuration created with ID: {created_config['id']}")
            return created_config
        else:
            print(f"❌ Failed to create development configuration: {response.status_code} - {response.text}")
            return {}


def filter_configurations_by_status(status: str):
    """Filter configurations by status."""
    print(f"\nFiltering configurations by status: {status}")
    
    with httpx.Client() as client:
        response = client.get(f"{BASE_URL}/configurations/?status={status}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data['total']} configurations with status '{status}':")
            
            for config in data['items']:
                print(f"  - ID: {config['id']} | Name: {config['name']} | Type: {config['cluster_type']}")
        else:
            print(f"❌ Failed to filter configurations: {response.status_code} - {response.text}")


def main():
    """Run the example usage demonstration."""
    print("🚀 SaaS Configurator API Example Usage")
    print("=" * 50)
    
    # Check if the API is running
    try:
        with httpx.Client() as client:
            response = client.get(f"{BASE_URL}/health")
            if response.status_code != 200:
                print("❌ API is not running. Please start it first with: uv run python run.py")
                return
            print("✅ API is running and healthy")
    except httpx.ConnectError:
        print("❌ Cannot connect to API. Please start it first with: uv run python run.py")
        return
    
    # Create example configurations
    prod_config = create_example_configuration()
    dev_config = create_development_config()
    
    # List all configurations
    list_configurations()
    
    # Get a specific configuration
    if prod_config.get('id'):
        get_configuration(prod_config['id'])
        
        # Update the configuration
        update_configuration(prod_config['id'])
    
    # Filter by status
    filter_configurations_by_status("active")
    filter_configurations_by_status("draft")
    
    print(f"\n🎉 Example usage completed!")
    print(f"Visit {BASE_URL}/docs to explore the interactive API documentation")


if __name__ == "__main__":
    main()


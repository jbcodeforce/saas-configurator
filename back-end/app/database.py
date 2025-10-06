"""In-memory database simulation for the SaaS Configurator application."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from app.models import Configuration, ConfigurationCreate, ConfigurationUpdate, ConfigurationStatus


class InMemoryDatabase:
    """Simple in-memory database for storing configurations."""
    
    def __init__(self):
        self.configurations: Dict[int, Configuration] = {}
        self.next_id: int = 1
        
    
    def create_configuration(self, config_data: ConfigurationCreate) -> Configuration:
        """Create a new configuration."""
        now = datetime.now()
        config = Configuration(
            id=self.next_id,
            **config_data.model_dump(),
            created_at=now,
            updated_at=now
        )
        self.configurations[self.next_id] = config
        self.next_id += 1
        return config
    
    def get_configuration(self, config_id: int) -> Optional[Configuration]:
        """Get a configuration by ID."""
        return self.configurations.get(config_id)
    
    def get_configurations(
        self, 
        skip: int = 0, 
        limit: int = 10,
        status: Optional[ConfigurationStatus] = None,
        cluster_type: Optional[str] = None
    ) -> List[Configuration]:
        """Get a list of configurations with optional filtering."""
        configs = list(self.configurations.values())
        
        # Apply filters
        if status:
            configs = [c for c in configs if c.status == status]
        if cluster_type:
            configs = [c for c in configs if c.cluster_type.lower() == cluster_type.lower()]
        
        # Apply pagination
        return configs[skip:skip + limit]
    
    def update_configuration(self, config_id: int, config_update: ConfigurationUpdate) -> Optional[Configuration]:
        """Update an existing configuration."""
        config = self.configurations.get(config_id)
        if not config:
            return None
        
        # Update only provided fields
        update_data = config_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        config.updated_at = datetime.now()
        return config
    
    def delete_configuration(self, config_id: int) -> bool:
        """Delete a configuration by ID."""
        if config_id in self.configurations:
            del self.configurations[config_id]
            return True
        return False
    
    def count_configurations(
        self, 
        status: Optional[ConfigurationStatus] = None,
        cluster_type: Optional[str] = None
    ) -> int:
        """Count configurations with optional filtering."""
        configs = list(self.configurations.values())
        
        # Apply filters
        if status:
            configs = [c for c in configs if c.status == status]
        if cluster_type:
            configs = [c for c in configs if c.cluster_type.lower() == cluster_type.lower()]
            
        return len(configs)


def seed_test_data(database: InMemoryDatabase) -> None:
    """Seed the database with test configuration data."""
    
    # Test Configuration 1: Production Kafka Cluster
    config1 = ConfigurationCreate(
        name="Production Kafka Cluster",
        description="High-throughput Kafka cluster for production workloads with multi-region replication",
        cluster_type="kafka",
        version="3.5.0",
        status=ConfigurationStatus.ACTIVE,
        configuration_data={
            "broker_count": 5,
            "replication_factor": 3,
            "partitions": 100,
            "retention_hours": 168,
            "compression_type": "lz4",
            "multi_region": True,
            "regions": ["us-east-1", "us-west-2", "eu-west-1"],
            "security": {
                "encryption": "TLS",
                "authentication": "SASL_SSL"
            },
            "performance": {
                "max_throughput_mb_per_sec": 500,
                "max_connections": 10000
            }
        },
        tags=["production", "kafka", "high-availability", "multi-region"]
    )
    
    # Test Configuration 2: Development Standard Cluster
    config2 = ConfigurationCreate(
        name="Development Standard Cluster",
        description="Standard cluster configuration for development and testing purposes",
        cluster_type="standard",
        version="1.2.3",
        status=ConfigurationStatus.DRAFT,
        configuration_data={
            "node_count": 3,
            "cpu_per_node": 4,
            "memory_per_node_gb": 16,
            "storage_type": "ssd",
            "storage_size_gb": 500,
            "auto_scaling": False,
            "backup_enabled": True,
            "backup_schedule": "daily",
            "networking": {
                "vpc_id": "vpc-dev-001",
                "subnet_ids": ["subnet-a", "subnet-b", "subnet-c"],
                "load_balancer": "internal"
            },
            "monitoring": {
                "enabled": True,
                "log_retention_days": 7,
                "metrics_interval_seconds": 60
            }
        },
        tags=["development", "standard", "non-production"]
    )
    
    # Create the configurations in the database
    database.create_configuration(config1)
    database.create_configuration(config2)
    
    print("✅ Test data seeded successfully!")
    print(f"   - Created configuration: {config1.name} (Status: {config1.status})")
    print(f"   - Created configuration: {config2.name} (Status: {config2.status})")


# Global database instance
db = InMemoryDatabase()

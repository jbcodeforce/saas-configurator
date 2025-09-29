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


# Global database instance
db = InMemoryDatabase()

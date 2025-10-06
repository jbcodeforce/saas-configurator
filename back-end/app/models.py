"""Pydantic models for the SaaS Configurator application."""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


class ConfigurationStatus(str, Enum):
    """Status of a cluster configuration."""
    DRAFT = "draft"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class ConfigurationBase(BaseModel):
    """Base model for Configuration with common fields."""
    name: str = Field(..., min_length=1, max_length=100, description="Configuration name")
    description: Optional[str] = Field(None, max_length=500, description="Configuration description")
    cluster_type: Optional[str] = Field(None, min_length=1, max_length=50, description="Type of cluster (e.g., kubernetes, docker-swarm)")
    version: Optional[str] = Field(None, pattern=r'^\d+\.\d+\.\d+$', description="Version in semantic versioning format")
    status: Optional[ConfigurationStatus] = Field(default=ConfigurationStatus.DRAFT, description="Configuration status")
    configuration_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Cluster configuration data")
    tags: Optional[list[str]] = Field(default_factory=list, description="Tags for organizing configurations")


class ConfigurationCreate(ConfigurationBase):
    """Model for creating a new configuration."""
    pass


class ConfigurationUpdate(BaseModel):
    """Model for updating an existing configuration."""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Configuration name")
    description: Optional[str] = Field(None, max_length=500, description="Configuration description")
    cluster_type: Optional[str] = Field(None, min_length=1, max_length=50, description="Type of cluster")
    version: Optional[str] = Field(None, pattern=r'^\d+\.\d+\.\d+$', description="Version in semantic versioning format")
    status: Optional[ConfigurationStatus] = Field(None, description="Configuration status")
    configuration_data: Optional[Dict[str, Any]] = Field(None, description="Cluster configuration data")
    tags: Optional[list[str]] = Field(None, description="Tags for organizing configurations")


class Configuration(ConfigurationBase):
    """Complete Configuration model with database fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(..., description="Unique configuration ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ConfigurationResponse(Configuration):
    """Model for Configuration API responses."""
    pass


class ConfigurationListResponse(BaseModel):
    """Model for paginated Configuration list responses."""
    items: list[ConfigurationResponse]
    total: int
    page: int = Field(default=1, ge=1)
    size: int = Field(default=10, ge=1, le=100)
    pages: int

// Type definitions for the SaaS Configurator application

export enum ConfigurationStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export interface Configuration {
  id: number;
  name: string;
  description?: string;
  cluster_type: string;
  version: string;
  status: ConfigurationStatus;
  configuration_data: Record<string, any>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ConfigurationCreate {
  name: string;
  description?: string;
  cluster_type: string;
  version: string;
  status?: ConfigurationStatus;
  configuration_data?: Record<string, any>;
  tags?: string[];
}

export interface ConfigurationUpdate {
  name?: string;
  description?: string;
  cluster_type?: string;
  version?: string;
  status?: ConfigurationStatus;
  configuration_data?: Record<string, any>;
  tags?: string[];
}

export interface ConfigurationListResponse {
  items: Configuration[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
}

// API service for communicating with the FastAPI backend

import axios, { AxiosResponse } from 'axios';
import { 
  Configuration, 
  ConfigurationCreate, 
  ConfigurationUpdate, 
  ConfigurationListResponse,
  ConfigurationStatus 
} from '../types';

const BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
apiClient.interceptors.request.use((request) => {
  console.log('API Request:', request.method?.toUpperCase(), request.url, request.data);
  return request;
});

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export class ConfigurationApi {
  // Get all configurations with optional filtering
  static async getConfigurations(
    skip: number = 0,
    limit: number = 10,
    status?: ConfigurationStatus,
    cluster_type?: string
  ): Promise<ConfigurationListResponse> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }
    
    if (cluster_type) {
      params.append('cluster_type', cluster_type);
    }

    const response: AxiosResponse<ConfigurationListResponse> = await apiClient.get(
      `/configurations/?${params.toString()}`
    );
    return response.data;
  }

  // Get a single configuration by ID
  static async getConfiguration(id: number): Promise<Configuration> {
    const response: AxiosResponse<Configuration> = await apiClient.get(`/configurations/${id}`);
    return response.data;
  }

  // Create a new configuration
  static async createConfiguration(configuration: ConfigurationCreate): Promise<Configuration> {
    const response: AxiosResponse<Configuration> = await apiClient.post(
      '/configurations/',
      configuration
    );
    return response.data;
  }

  // Update an existing configuration
  static async updateConfiguration(
    id: number, 
    configuration: ConfigurationUpdate
  ): Promise<Configuration> {
    const response: AxiosResponse<Configuration> = await apiClient.put(
      `/configurations/${id}`,
      configuration
    );
    return response.data;
  }

  // Delete a configuration
  static async deleteConfiguration(id: number): Promise<void> {
    await apiClient.delete(`/configurations/${id}`);
  }

  // Health check
  static async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  }
}

export default ConfigurationApi;

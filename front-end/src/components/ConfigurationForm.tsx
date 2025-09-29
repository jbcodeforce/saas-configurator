import React, { useState, useEffect } from 'react';
import { Configuration, ConfigurationCreate, ConfigurationUpdate, ConfigurationStatus } from '../types';
import ConfigurationApi from '../services/api';
import './ConfigurationForm.css';

interface ConfigurationFormProps {
  configuration?: Configuration;
  onSave: () => void;
  onCancel: () => void;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  configuration,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cluster_type: '',
    version: '1.0.0',
    status: ConfigurationStatus.DRAFT,
    configuration_data: '{}',
    tags: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!configuration;

  useEffect(() => {
    if (configuration) {
      setFormData({
        name: configuration.name,
        description: configuration.description || '',
        cluster_type: configuration.cluster_type,
        version: configuration.version,
        status: configuration.status,
        configuration_data: JSON.stringify(configuration.configuration_data, null, 2),
        tags: configuration.tags.join(', ')
      });
    }
  }, [configuration]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Parse and validate configuration data
      let configurationData = {};
      try {
        configurationData = JSON.parse(formData.configuration_data || '{}');
      } catch (err) {
        throw new Error('Invalid JSON in configuration data');
      }

      // Validate version format
      if (!/^\d+\.\d+\.\d+$/.test(formData.version)) {
        throw new Error('Version must be in format x.y.z (e.g., 1.0.0)');
      }

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      if (isEditing && configuration) {
        // Update existing configuration
        const updateData: ConfigurationUpdate = {
          name: formData.name,
          description: formData.description || undefined,
          cluster_type: formData.cluster_type,
          version: formData.version,
          status: formData.status,
          configuration_data: configurationData,
          tags: tags
        };

        await ConfigurationApi.updateConfiguration(configuration.id, updateData);
      } else {
        // Create new configuration
        const createData: ConfigurationCreate = {
          name: formData.name,
          description: formData.description || undefined,
          cluster_type: formData.cluster_type,
          version: formData.version,
          status: formData.status,
          configuration_data: configurationData,
          tags: tags
        };

        await ConfigurationApi.createConfiguration(createData);
      }

      onSave();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const formatConfigurationData = () => {
    try {
      const parsed = JSON.parse(formData.configuration_data);
      setFormData(prev => ({
        ...prev,
        configuration_data: JSON.stringify(parsed, null, 2)
      }));
    } catch (err) {
      // Invalid JSON, leave as is
    }
  };

  return (
    <div className="configuration-form">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Configuration' : 'Create New Configuration'}</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              maxLength={100}
              placeholder="Enter configuration name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cluster_type">Cluster Type *</label>
            <input
              type="text"
              id="cluster_type"
              name="cluster_type"
              value={formData.cluster_type}
              onChange={handleInputChange}
              required
              maxLength={50}
              placeholder="e.g., kubernetes, docker-swarm"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="version">Version *</label>
            <input
              type="text"
              id="version"
              name="version"
              value={formData.version}
              onChange={handleInputChange}
              required
              pattern="^\d+\.\d+\.\d+$"
              placeholder="1.0.0"
              title="Version must be in format x.y.z (e.g., 1.0.0)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value={ConfigurationStatus.DRAFT}>Draft</option>
              <option value={ConfigurationStatus.ACTIVE}>Active</option>
              <option value={ConfigurationStatus.INACTIVE}>Inactive</option>
              <option value={ConfigurationStatus.ARCHIVED}>Archived</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            maxLength={500}
            rows={3}
            placeholder="Enter a description for this configuration"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="production, kubernetes, critical (comma-separated)"
          />
          <small>Separate tags with commas</small>
        </div>

        <div className="form-group">
          <label htmlFor="configuration_data">Configuration Data (JSON)</label>
          <textarea
            id="configuration_data"
            name="configuration_data"
            value={formData.configuration_data}
            onChange={handleInputChange}
            onBlur={formatConfigurationData}
            rows={8}
            className="json-textarea"
            placeholder='{"nodes": 3, "cpu": "4 cores", "memory": "16GB"}'
          />
          <small>Enter valid JSON configuration data</small>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Configuration' : 'Create Configuration')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfigurationForm;

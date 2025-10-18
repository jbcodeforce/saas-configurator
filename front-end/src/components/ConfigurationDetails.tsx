import React, { useState } from 'react';
import { Configuration, ConfigurationStatus } from '../types';
import './ConfigurationDetails.css';

interface ConfigurationDetailsProps {
  configuration: Configuration;
  onEdit: () => void;
  onBack: () => void;
  onDelete: () => void;
}

const ConfigurationDetails: React.FC<ConfigurationDetailsProps> = ({
  configuration,
  onEdit,
  onBack,
  onDelete
}) => {
  const [showRawData, setShowRawData] = useState(true);

  const getStatusBadgeClass = (status: ConfigurationStatus) => {
    switch (status) {
      case ConfigurationStatus.ACTIVE:
        return 'status-badge active';
      case ConfigurationStatus.DRAFT:
        return 'status-badge draft';
      case ConfigurationStatus.INACTIVE:
        return 'status-badge inactive';
      case ConfigurationStatus.ARCHIVED:
        return 'status-badge archived';
      default:
        return 'status-badge';
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${configuration.name}"? This action cannot be undone.`)) {
      onDelete();
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderConfigurationData = () => {
    if (!configuration.configuration_data || Object.keys(configuration.configuration_data).length === 0) {
      return <p className="no-data">No configuration data provided</p>;
    }

    if (showRawData) {
      return (
        <div>
          <pre className="json-display">
            {JSON.stringify(configuration.configuration_data['payload'], null, 2)}
          </pre>
          <h3>Questions</h3>
          <pre className="json-display">
            {JSON.stringify(configuration.configuration_data['questions'], null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="config-data-summary">
        {Object.entries(configuration.configuration_data).map(([key, value]) => (
          <div key={key} className="config-item">
            <strong>{key}:</strong> {JSON.stringify(value)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="configuration-details">
      <div className="details-header">
        <button className="btn-back" onClick={onBack} title="Back to list">
          ← Back
        </button>
        <div className="header-actions">
          <button className="btn-primary" onClick={onEdit}>
            Edit
          </button>
          <button className="btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className="details-content">
        <div className="config-header">
          <h1>{configuration.name}</h1>
          <span className={getStatusBadgeClass(configuration.status)}>
            {configuration.status}
          </span>
        </div>

        {configuration.description && (
          <p className="description">{configuration.description}</p>
        )}

        <div className="config-meta">
          <div className="meta-grid">
            <div className="meta-item">
              <label>ID</label>
              <span>{configuration.id}</span>
            </div>
            <div className="meta-item">
              <label>Version</label>
              <span>v{configuration.version}</span>
            </div>
            <div className="meta-item">
              <label>Created</label>
              <span>{formatDateTime(configuration.created_at)}</span>
            </div>
            <div className="meta-item">
              <label>Updated</label>
              <span>{formatDateTime(configuration.updated_at)}</span>
            </div>

            <div className="meta-item">
              <label>Provingly application</label>
              <span>{configuration.configuration_data.appName}/{configuration.configuration_data.appVersion}</span>
            </div>
            <div className="meta-item">
              <label>operation</label>
              <span>{configuration.configuration_data.operation}</span>
            </div>

          </div>
        </div>

        {configuration.tags.length > 0 && (
          <div className="tags-section">
            <h3>Tags</h3>
            <div className="tags">
              {configuration.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}

        <div className="config-data-section">
          <div className="section-header">
            <h3>Configuration Data</h3>
            <button
              className="btn-toggle"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? 'Show Summary' : 'Show Raw JSON'}
            </button>
          </div>
          {renderConfigurationData()}
        </div>
      </div>
    </div>
  );
};

export default ConfigurationDetails;

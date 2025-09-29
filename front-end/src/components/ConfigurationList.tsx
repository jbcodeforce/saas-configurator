import React, { useState, useEffect } from 'react';
import { Configuration, ConfigurationStatus } from '../types';
import ConfigurationApi from '../services/api';
import './ConfigurationList.css';

interface ConfigurationListProps {
  onSelectConfiguration: (config: Configuration) => void;
  onCreateNew: () => void;
  refresh: boolean;
  onRefreshComplete: () => void;
}

const ConfigurationList: React.FC<ConfigurationListProps> = ({
  onSelectConfiguration,
  onCreateNew,
  refresh,
  onRefreshComplete
}) => {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<ConfigurationStatus | ''>('');
  const [clusterTypeFilter, setClusterTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  
  const pageSize = 10;

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await ConfigurationApi.getConfigurations(
        (currentPage - 1) * pageSize,
        pageSize,
        statusFilter || undefined,
        clusterTypeFilter || undefined
      );
      
      setConfigurations(response.items);
      setTotal(response.total);
      setPages(response.pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load configurations');
      console.error('Error loading configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigurations();
  }, [currentPage, statusFilter, clusterTypeFilter]);

  useEffect(() => {
    if (refresh) {
      loadConfigurations();
      onRefreshComplete();
    }
  }, [refresh, onRefreshComplete]);

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      try {
        await ConfigurationApi.deleteConfiguration(id);
        loadConfigurations(); // Refresh the list
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to delete configuration');
      }
    }
  };

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setClusterTypeFilter('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="configuration-list">
        <div className="loading">Loading configurations...</div>
      </div>
    );
  }

  return (
    <div className="configuration-list">
      <div className="list-header">
        <h2>Cluster Configurations ({total})</h2>
        <button className="btn-primary" onClick={onCreateNew}>
          + New Configuration
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as ConfigurationStatus | '')}
          >
            <option value="">All</option>
            <option value={ConfigurationStatus.ACTIVE}>Active</option>
            <option value={ConfigurationStatus.DRAFT}>Draft</option>
            <option value={ConfigurationStatus.INACTIVE}>Inactive</option>
            <option value={ConfigurationStatus.ARCHIVED}>Archived</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Cluster Type:</label>
          <input
            type="text"
            value={clusterTypeFilter}
            onChange={(e) => setClusterTypeFilter(e.target.value)}
            placeholder="Filter by cluster type"
          />
        </div>
        
        <button className="btn-secondary" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {configurations.length === 0 ? (
        <div className="empty-state">
          <p>No configurations found.</p>
          <button className="btn-primary" onClick={onCreateNew}>
            Create your first configuration
          </button>
        </div>
      ) : (
        <>
          <div className="configurations-grid">
            {configurations.map((config) => (
              <div
                key={config.id}
                className="configuration-card"
                onClick={() => onSelectConfiguration(config)}
              >
                <div className="card-header">
                  <h3>{config.name}</h3>
                  <div className="card-actions">
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDelete(config.id, e)}
                      title="Delete configuration"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <p className="description">
                  {config.description || 'No description provided'}
                </p>
                
                <div className="card-meta">
                  <span className={getStatusBadgeClass(config.status)}>
                    {config.status}
                  </span>
                  <span className="cluster-type">{config.cluster_type}</span>
                  <span className="version">v{config.version}</span>
                </div>
                
                {config.tags.length > 0 && (
                  <div className="tags">
                    {config.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                    {config.tags.length > 3 && (
                      <span className="tag more">+{config.tags.length - 3}</span>
                    )}
                  </div>
                )}
                
                <div className="card-footer">
                  <small>
                    Updated: {new Date(config.updated_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {pages}
              </span>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConfigurationList;

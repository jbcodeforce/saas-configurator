import React, { useState, useEffect } from 'react';
import { Configuration, ConfigurationCreate, ConfigurationUpdate, ConfigurationStatus } from '../types';
import ConfigurationApi from '../services/api';
import './ConfigurationForm.css';

interface ConfigurationFormProps {
  configuration?: Configuration;
  onSave: () => void;
  onCancel: () => void;
}

interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');

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
    
    // Initialize chat with a welcome message
    setChatMessages([{
      id: 1,
      sender: 'bot',
      message: 'Hello! I can help you configure your cluster.',
      timestamp: new Date()
    }]);
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
        onSave();
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

        // Start interactive configuration
        const response = await ConfigurationApi.createConfiguration(createData);
        
        // Add bot message for configuration start
        const startMessage: ChatMessage = {
          id: chatMessages.length + 1,
          sender: 'bot',
          message: 'Starting configuration process for ' + formData.cluster_type + ' cluster...',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, startMessage]);

        // Handle missing data if any
        if (response.missingData && response.missingData.length > 0) {
          // Add bot message with the first question
          const questionMessage: ChatMessage = {
            id: chatMessages.length + 2,
            sender: 'bot',
            message: response.missingData[0].details.question,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, questionMessage]);

          // Store missing data for later use in chat
          setFormData(prev => ({
            ...prev,
            configuration_data: JSON.stringify(response.output || response.configuration.configuration_data, null, 2)
          }));
        } else {
          // Configuration complete
          onSave();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save configuration');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: chatMessages.length + 1,
        sender: 'bot',
        message: 'Error: ' + (err.response?.data?.detail || err.message || 'Failed to save configuration'),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setSaving(false);
    }
  };

  // Update configuration data when cluster type changes
  useEffect(() => {
    if (formData.cluster_type) {
      // This would be replaced with actual API call to get configuration template
      const templateConfig = {
        cluster_type: formData.cluster_type,
        timestamp: new Date().toISOString(),
        status: "pending",
        // Add other default fields based on cluster type
      };
      setFormData(prev => ({
        ...prev,
        configuration_data: JSON.stringify(templateConfig, null, 2)
      }));
    }
  }, [formData.cluster_type]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      sender: 'user',
      message: userInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');

    try {
      // Get current configuration data
      let configurationData = JSON.parse(formData.configuration_data || '{}');
      
      // Create configuration update with user's response
      const updateData: ConfigurationCreate = {
        ...formData,
        configuration_data: configurationData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      // Send update to backend
      const response = await ConfigurationApi.createConfiguration(updateData);

      // Update configuration data
      if (response.output) {
        setFormData(prev => ({
          ...prev,
          configuration_data: JSON.stringify(response.output, null, 2)
        }));
      }

      // Handle missing data if any
      if (response.missingData && response.missingData.length > 0) {
        // Add bot message with the next question
        const questionMessage: ChatMessage = {
          id: chatMessages.length + 2,
          sender: 'bot',
          message: response.missingData[0].details.question,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, questionMessage]);
      } else {
        // Configuration complete
        const completeMessage: ChatMessage = {
          id: chatMessages.length + 2,
          sender: 'bot',
          message: 'Configuration complete! You can now save the configuration.',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, completeMessage]);
      }
    } catch (err: any) {
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: chatMessages.length + 2,
        sender: 'bot',
        message: 'Error: ' + (err.response?.data?.detail || err.message || 'Failed to process configuration'),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      setError(err.response?.data?.detail || err.message || 'Failed to process configuration');
    }
  };

  return (
    <div className="configuration-form">
      <div className="form-header">
        <h2>{isEditing ? 'Edit Configuration' : 'Create New Configuration'}</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Top Section - Basic Information */}
        <div className="top-section">
          <div className="form-row-triple">
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
              <label htmlFor="cluster_type">Cluster Type</label>
              <select
                id="cluster_type"
                name="cluster_type"
                value={formData.cluster_type}
                onChange={handleInputChange}
              >
                <option value="">Select a cluster type</option>
                <option value="basic">Basic Cluster</option>
                <option value="dedicated">Dedicated Cluster</option>
                <option value="enterprise">Enterprise Cluster</option>
                <option value="freight">Freight Cluster</option>
                <option value="kafka">Kafka Cluster</option>
                <option value="standard">Standard Cluster</option>
              </select>
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

          <div className="form-row">
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

            {isEditing && configuration && (
              <div className="form-group">
                <label>Updated Date</label>
                <div className="info-field">
                  {new Date(configuration.updated_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Two Columns */}
        <div className="bottom-section">
          {/* Left Column - Chat Interface */}
          <div className="chat-column">
            <div className="chat-header">
              <h3>Configuration Assistant</h3>
            </div>
            <div className="chat-messages">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.sender}`}>
                  <div className="message-content">
                    <span className="message-text">{msg.message}</span>
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your response here..."
                className="chat-input"
              />
              <button type="submit" className="btn-send">
                Send
              </button>
            </form>
          </div>

          {/* Right Column - JSON Config View */}
          <div className="config-column">
            <div className="config-header">
              <h3>Configuration Data (JSON)</h3>
            </div>
            <textarea
              id="configuration_data"
              name="configuration_data"
              value={formData.configuration_data}
              readOnly
              className="json-textarea readonly"
              placeholder="Configuration data will be generated based on cluster type"
            />
            <small className="json-hint">Generated configuration data (read-only)</small>
          </div>
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

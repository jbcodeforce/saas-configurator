import React, { useState, useEffect } from 'react';
import { Configuration, ConfigurationCreate, ConfigurationUpdate, ConfigurationStatus } from '../types';
import ConfigurationApi from '../services/api';
import './ConfigurationForm.css';

interface ConfigurationFormProps {
  configuration?: Configuration;
  onSave: () => void;
  onCancel: () => void;
}

interface EnumOption {
  v: string | boolean;
  l: string;
}

interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
  enumOptions?: EnumOption[];
  questionPath?: string;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  configuration,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    id: -1,
    name: 'cfg1',
    description: '',
    version: '1.0.0',
    status: ConfigurationStatus.DRAFT,
    configuration_data: '{}',
    tags: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const isEditing = !!configuration;

  useEffect(() => {
    if (configuration) {
      setFormData({
        id: configuration.id,
        name: configuration.name,
        description: configuration.description || '',
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
      message: 'Hello! I am here to help you configure your cluster. Press \'Start Configuration\' when you are ready.',
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
          cluster_type: undefined,
          version: formData.version,
          status: formData.status,
          configuration_data: configurationData,
          tags: tags
        };

        await ConfigurationApi.updateConfiguration(configuration.id, updateData);
        onSave();
      } else {
        // Create new configuration -- aligned with the backend model
        const createData: ConfigurationCreate = {
          name: formData.name,
          description: formData.description || undefined,
          cluster_type: undefined,
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
          message: 'Starting configuration process (config id = ' + response.configuration.id + ')',
          timestamp: new Date()
        };
        // keeping config id
        formData.id = response.configuration.id;
        setChatMessages(prev => [...prev, startMessage]);

        // Handle configuration response
        const configData = response.configuration.configuration_data;
        if (configData?.questions?.length > 0) {
          // Get the first question
          const question = configData.questions[0];
          
          // Format question message based on type
          let questionText = question.text;
          let enumOptions: EnumOption[] | undefined;
          
          if (question.type_info?.type === 'Enum' && question.type_info.possible_values) {
            enumOptions = question.type_info.possible_values;
          }
          else if (question.type_info?.type === 'Boolean') {
            enumOptions = [{ v: true, l: "Yes" }, { v: false, l: "No" }]
          }
          
          if (question.default_value) {
            questionText += `\nDefault: ${question.default_value}`;
          }
          if (question.info) {
            questionText += `\n(${question.info})`;
          }

          // Add bot message with the formatted question
          const questionMessage: ChatMessage = {
            id: chatMessages.length + 2,
            sender: 'bot',
            message: questionText,
            timestamp: new Date(),
            enumOptions,
            questionPath: question.path
          };
          setChatMessages(prev => [...prev, questionMessage]);

          // Store configuration data
          setFormData(prev => ({
            ...prev,
            configuration_data: JSON.stringify(configData, null, 2)
          }));
        } else {
          // No questions - configuration complete
          const completeMessage: ChatMessage = {
            id: chatMessages.length + 2,
            sender: 'bot',
            message: 'Configuration complete! No additional information needed.',
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, completeMessage]);
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

          {!isEditing && (
            <div className="form-actions initial-actions">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={saving || !formData.name}
              >
                {saving ? 'Starting Configuration...' : 'Start Configuration'}
              </button>
            </div>
          )}
        </div>
      </form>

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
                    <div className="message-text">
                      {msg.message}
                      {msg.enumOptions && (
                        <div className="enum-options">
                          {msg.enumOptions.map((option) => (
                            <button
                              key={option.v.toString()}
                              className="enum-option"
                              onClick={() => {
                                if (msg.questionPath) {
                                  // Submit the selected option
                                  const userMessage: ChatMessage = {
                                    id: chatMessages.length + 1,
                                    sender: 'user',
                                    message: `Selected: ${option.l}`,
                                    timestamp: new Date()
                                  };
                                  setChatMessages(prev => [...prev, userMessage]);
                                  
                                  // Update configuration payload with the selected value
                                  const configData = JSON.parse(formData.configuration_data);
                                  const path = msg.questionPath.split('.');  // TODO: we also need to handle indexes for arrays 
                                  let current = configData['payload'];
                                  for (let i = 0; i < path.length - 1; i++) {
                                    if (!current[path[i]]) {
                                      current[path[i]] = {};
                                    }
                                    current = current[path[i]];
                                  }

                                  // TODO: convert to boolean, number, ... if needed
                                  current[path[path.length - 1]] = option.v;
                                  
                                  // Send update to backend
                                  const updateData: ConfigurationCreate = {
                                    ...formData,
                                    configuration_data: configData,
                                    tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                                  };

                                  console.log('%c ================ Form data', 'color: #f09102ff');                                  
                                  console.log('%c ' + JSON.stringify(formData, null, 2), 'color: #f09102ff');   
                                  console.log('%c ================ Updated data for config id = ' + formData.id, 'color: #f0c002');                                  
                                  console.log('%c ' + JSON.stringify(updateData, null, 2), 'color: #f0c002')
                                  ConfigurationApi.updateConfiguration(formData.id, updateData)
                                  //ConfigurationApi.createConfiguration(updateData)
                                    .then(response => {

                                      console.log('%c ================ Response to updateConfig', 'color: #02ccf0ff');                                  
                                      console.log('%c ' + JSON.stringify(response, null, 2), 'color: #02ccf0ff');       

                                      // Update form data
                                      setFormData(prev => ({
                                        ...prev,
                                        configuration_data: JSON.stringify(response.configuration.configuration_data, null, 2)
                                      }));
                                      
                                      // Handle next question if any
                                      const nextQuestion = response.configuration.configuration_data?.questions?.[0];
                                      if (nextQuestion) {
                                        let questionText = nextQuestion.text;
                                        let enumOptions: EnumOption[] | undefined;
                                        
                                        if (nextQuestion.type_info?.type === 'Enum' && nextQuestion.type_info.possible_values) {
                                          enumOptions = nextQuestion.type_info.possible_values;
                                        }
                                        else if (nextQuestion.type_info?.type === 'Boolean') {
                                          enumOptions = [{ v: true, l: "Yes" }, { v: false, l: "No" }]
                                        }                                

                                        if (nextQuestion.default_value) {
                                          questionText += `\nDefault: ${nextQuestion.default_value}`;
                                        }
                                        if (nextQuestion.info) {
                                          questionText += `\n(${nextQuestion.info})`;
                                        }
                                        
                                        const nextQuestionMessage: ChatMessage = {
                                          id: chatMessages.length + 2,
                                          sender: 'bot',
                                          message: questionText,
                                          timestamp: new Date(),
                                          enumOptions,
                                          questionPath: nextQuestion.path
                                        };
                                        setChatMessages(prev => [...prev, nextQuestionMessage]);
                                      } else {
                                        // Configuration complete
                                        const completeMessage: ChatMessage = {
                                          id: chatMessages.length + 2,
                                          sender: 'bot',
                                          message: 'Configuration complete! All questions have been answered.',
                                          timestamp: new Date()
                                        };
                                        setChatMessages(prev => [...prev, completeMessage]);
                                      }
                                    })
                                    .catch(err => {
                                      const errorMessage: ChatMessage = {
                                        id: chatMessages.length + 2,
                                        sender: 'bot',
                                        message: 'Error: ' + (err.response?.data?.detail || err.message || 'Failed to process configuration'),
                                        timestamp: new Date()
                                      };
                                      setChatMessages(prev => [...prev, errorMessage]);
                                      setError(err.response?.data?.detail || err.message || 'Failed to process configuration');
                                    });
                                }
                              }}
                            >
                              <span className="enum-option-label">{option.l}</span>
                              {/*<span className="enum-option-value">({option.v})</span>*/}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - JSON Config View - we only show a subset of the full JSON 
              value={formData.configuration_data}
              or 
              value={JSON.stringify(JSON.parse(formData.configuration_data).payload, null, 2)}
              or 
              value={JSON.stringify(JSON.parse(formData.configuration_data).payload['the configuration'], null, 2)}          
          */}
          <div className="config-column">
            <div className="config-header">
              <h3>Configuration Data</h3>
            </div>
            <textarea
              id="configuration_data"
              name="configuration_data"
              value={JSON.stringify(JSON.parse(formData.configuration_data).payload, null, 2)}
              readOnly
              className="json-textarea readonly"
              placeholder="Configuration data will be shown after starting the configuration"
            />
            <small className="json-hint">Generated configuration data (read-only)</small>
          </div>
        </div>

        {isEditing && (
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
              {saving ? 'Saving...' : 'Update Configuration'}
            </button>
          </div>
        )}
    </div>
  );
};

export default ConfigurationForm;

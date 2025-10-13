import React, { useState, useEffect } from 'react';
import { Configuration, ConfigurationCreate, ConfigurationUpdate, ConfigurationStatus } from '../types';
import ConfigurationApi from '../services/api';
import './ConfigurationForm.css';

import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite';
import "react-json-view-lite/dist/index.css";


interface ConfigurationFormProps {
  configuration?: Configuration;
  onSave: () => void;
  onCancel: () => void;
}

interface EnumOption {
  v: string | boolean;
  l: string;
}

interface NumericInput {
  min?: number;
  max?: number;
  step?: number;
}

interface TextInput {
  minLength?: number;
  maxLength?: number;
  pattern?: number;   // a regex
}

// TODO: default value is missing
interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  message: string;
  tooltip?: string;
  timestamp: Date;
  enumOptions?: EnumOption[];
  numericInput?: NumericInput;
  textInput?: TextInput;
  questionPath?: string;
}

interface FormData {
    id: number,
    name: string,
    description: string,
    version: string,
    status: ConfigurationStatus,
    configuration_data: string,
    tags: string
  }

/*
interface HandlerResponse {
  messages: ChatMessage[],
  error?: string,
  configuration_data: string
}  

function handleUserInput(formData: FormData,
                        msg: ChatMessage,
                        num_chat_messages: number,
                        entered_value: number | string | boolean, 
                        label?: string
                        ): HandlerResponse {
  console.log('User input: ' + entered_value + ' with type ' + typeof entered_value);

  var handler_response: HandlerResponse = {
    messages: [],
    error: undefined,
    configuration_data: '{}'
  };


  if (msg.questionPath) {
    // Submit the selected option
    const userMessage: ChatMessage = {
      id: num_chat_messages + 1, //chatMessages.length + 1,
      sender: 'user',
      message: `Selected: ${label ?? entered_value}`,
      timestamp: new Date()
    };
    handler_response.messages.push(userMessage)
    //setChatMessages(prev => [...prev, userMessage]);
    
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

    current[path[path.length - 1]] = entered_value;
    
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
      .then(response => {

        console.log('%c ================ Response to updateConfig', 'color: #02ccf0ff');                                  
        console.log('%c ' + JSON.stringify(response, null, 2), 'color: #02ccf0ff');       

        // Update form data
        handler_response.configuration_data = JSON.stringify(response.configuration.configuration_data, null, 2)
        
        // Handle next question if any
        const nextQuestion = response.configuration.configuration_data?.questions?.[0];
        if (nextQuestion) {
          let enumOptions: EnumOption[] | undefined;
          let numericInput: NumericInput | undefined;
          let textInput: TextInput | undefined;
          
          if (nextQuestion.type_info?.type === 'Enum' && nextQuestion.type_info.possible_values) {
            console.log('Enum input has been initialized using enumOptions')
            enumOptions = nextQuestion.type_info.possible_values;
          }
          else if (nextQuestion.type_info?.type === 'Boolean') {
            console.log('Boolean input has been initialized using enumOptions')
            enumOptions = [{ v: true, l: "Yes" }, { v: false, l: "No" }]
          }
          else if (nextQuestion.type_info?.type === 'Number') {
            console.log('Numeric input has been initialized with step = ' + nextQuestion.type_info.step)
            numericInput = { 
              step: nextQuestion.type_info.step,
              min: nextQuestion.type_info.min,
              max: nextQuestion.type_info.max
            }
          }
          else if (nextQuestion.type_info?.type === 'Text') {
            console.log('Text input has been initialized')
            textInput = {
              minLength: nextQuestion.type_info.minLength,
              maxLength: nextQuestion.type_info.maxLength,
              pattern: nextQuestion.type_info.regex
            }
          }                                        
          
          const nextQuestionMessage: ChatMessage = {
            id: num_chat_messages + 2,
            sender: 'bot',
            message: nextQuestion.text,
            tooltip: nextQuestion.info,
            timestamp: new Date(),
            enumOptions,
            numericInput,
            textInput,
            questionPath: nextQuestion.path
          };

          handler_response.messages.push(nextQuestionMessage)
          //setChatMessages(prev => [...prev, nextQuestionMessage]);
        } 
        else {
          // Configuration complete
          const completeMessage: ChatMessage = {
            id: num_chat_messages + 2,
            sender: 'bot',
            message: 'Configuration complete! All questions have been answered.',
            timestamp: new Date()
          };
          handler_response.messages.push(completeMessage);
          //setChatMessages(prev => [...prev, completeMessage]);

        }
      })
      .catch(err => {
        const errorMessage: ChatMessage = {
          id: num_chat_messages + 2,
          sender: 'bot',
          message: 'Error: ' + (err.response?.data?.detail || err.message || 'Failed to process configuration'),
          timestamp: new Date()
        };
        handler_response.messages.push(errorMessage)
        //setChatMessages(prev => [...prev, errorMessage]);
        handler_response.error = (err.response?.data?.detail || err.message || 'Failed to process configuration');
      });
  }
  return handler_response;
}
*/

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
          message: 'Starting the configuration process (config id = ' + response.configuration.id + '). Please answer a few questions.',
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
          let enumOptions: EnumOption[] | undefined;
          let numericInput: NumericInput | undefined;
          let textInput: TextInput | undefined;
          
          if (question.type_info?.type === 'Enum' && question.type_info.possible_values) {
            console.log('Enum input has been initialized using enumOptions')
            enumOptions = question.type_info.possible_values;
          }
          else if (question.type_info?.type === 'Boolean') {
            console.log('Boolean input has been initialized using enumOptions')
            enumOptions = [{ v: true, l: "Yes" }, { v: false, l: "No" }]
          }
          else if (question.type_info?.type === 'Number') {
            console.log('Numeric input has been initialized with step = ' + question.type_info.step)
            numericInput = { 
              step: question.type_info.step,
              min: question.type_info.min,
              max: question.type_info.max
            }
          }
          else if (question.type_info?.type === 'Text') {
            console.log('Text input has been initialized')
            textInput = {
              minLength: question.type_info.minLength,
              maxLength: question.type_info.maxLength,
              pattern: question.type_info.regex
            }
          }
          


          // Add bot message with the formatted question
          const questionMessage: ChatMessage = {
            id: chatMessages.length + 2,
            sender: 'bot',
            message: question.text,
            tooltip: question.info,
            timestamp: new Date(),
            enumOptions,
            numericInput,
            textInput,
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
                      {msg.tooltip && <small>{msg.tooltip}</small>}
                      {msg.numericInput && (
                        <div>
                          <input type="number" step="msg.numericInput?.step" onKeyDown={(e) => { // TODO: use min, max and step if defined
                                if (e.defaultPrevented) {
                                  return; // Do nothing if the event was already processed
                                }                          
                                if (e.key === "Enter" && msg.questionPath) {
                                  console.log('Number entered: ' + e.currentTarget.value);
                                  let entered_value = msg.numericInput?.step === 1 ? parseInt(e.currentTarget.value) : parseFloat(e.currentTarget.value);


                                  // Submit the selected option
                                  const userMessage: ChatMessage = {
                                    id: chatMessages.length + 1,
                                    sender: 'user',
                                    message: `Entered: ${entered_value}`,
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

                                  current[path[path.length - 1]] = entered_value;
                                  
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
                                        let enumOptions: EnumOption[] | undefined;
                                        let numericInput: NumericInput | undefined;
                                        let textInput: TextInput | undefined;
                                        
                                        if (nextQuestion.type_info?.type === 'Enum' && nextQuestion.type_info.possible_values) {
                                          console.log('Enum input has been initialized using enumOptions')
                                          enumOptions = nextQuestion.type_info.possible_values;
                                        }
                                        else if (nextQuestion.type_info?.type === 'Boolean') {
                                          console.log('Boolean input has been initialized using enumOptions')
                                          enumOptions = [{ v: true, l: "Yes" }, { v: false, l: "No" }]
                                        }
                                        else if (nextQuestion.type_info?.type === 'Number') {
                                          console.log('Numeric input has been initialized with step = ' + nextQuestion.type_info.step)
                                          numericInput = { 
                                            step: nextQuestion.type_info.step,
                                            min: nextQuestion.type_info.min,
                                            max: nextQuestion.type_info.max
                                          }
                                        }
                                        else if (nextQuestion.type_info?.type === 'Text') {
                                          console.log('Text input has been initialized')
                                          textInput = {
                                            minLength: nextQuestion.type_info.minLength,
                                            maxLength: nextQuestion.type_info.maxLength,
                                            pattern: nextQuestion.type_info.regex
                                          }
                                        }                                        
                                        
                                        const nextQuestionMessage: ChatMessage = {
                                          id: chatMessages.length + 2,
                                          sender: 'bot',
                                          message: nextQuestion.text,
                                          tooltip: nextQuestion.info,
                                          timestamp: new Date(),
                                          enumOptions,
                                          numericInput,
                                          textInput,
                                          questionPath: nextQuestion.path
                                        };
                                
                                        setChatMessages(prev => [...prev, nextQuestionMessage]);
                                      } 
                                      else {
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
                                //e.preventDefault();

                            }}>
                          </input><br></br>
                          <small style={{ color: 'red' }}>Please enter a value between 1 and 100</small>
                          {/* TODO: insert a error message with a condition */}
                        </div>
                      )}
                      {msg.textInput && (
                        <div>
                          <input type="text" onKeyDown={(e) => { // TODO: use minLength, maxLength and pattern if defined
                                if (e.defaultPrevented) {
                                  return; // Do nothing if the event was already processed
                                }                          
                                if (e.key === "Enter" && msg.questionPath) {        
                                console.log('Text entered: ' + e.currentTarget.value);

                                // TODO: use the captured value to call the backend with an updated payload
                                }
                            }}>
                          </input>
                          {/* TODO: insert a error message with a condition */}                        
                        </div>
                      )}
                      {msg.enumOptions && (
                        <div className="enum-options">
                          {msg.enumOptions.map((option) => (
                            <button
                              key={option.v.toString()}
                              className="enum-option"
                              onClick={() => {        // TODO: we need to define a function to reuse this piece of code for other widgets too <<<< IMPORTANT

                                let entered_value = option.v;

                                /*
                                let handler_response = handleUserInput(formData, 
                                                msg,
                                                chatMessages.length, 
                                                entered_value, 
                                                option.l);


                                setFormData(prev => ({
                                          ...prev,
                                          configuration_data: handler_response.configuration_data
                                        }));                                                

                                console.log('Handler response');
                                console.log(handler_response);                
                                handler_response.messages.forEach((m) => setChatMessages(prev => [...prev, m]));


                                if (handler_response.error)
                                  setError(handler_response.error);
                                */
                                                
                                                
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

                                  current[path[path.length - 1]] = entered_value;
                                  
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
                                        let enumOptions: EnumOption[] | undefined;
                                        let numericInput: NumericInput | undefined;
                                        let textInput: TextInput | undefined;
                                        
                                        if (nextQuestion.type_info?.type === 'Enum' && nextQuestion.type_info.possible_values) {
                                          console.log('Enum input has been initialized using enumOptions')
                                          enumOptions = nextQuestion.type_info.possible_values;
                                        }
                                        else if (nextQuestion.type_info?.type === 'Boolean') {
                                          console.log('Boolean input has been initialized using enumOptions')
                                          enumOptions = [{ v: true, l: "Yes" }, { v: false, l: "No" }]
                                        }
                                        else if (nextQuestion.type_info?.type === 'Number') {
                                          console.log('Numeric input has been initialized with step = ' + nextQuestion.type_info.step)
                                          numericInput = { 
                                            step: nextQuestion.type_info.step,
                                            min: nextQuestion.type_info.min,
                                            max: nextQuestion.type_info.max
                                          }
                                        }
                                        else if (nextQuestion.type_info?.type === 'Text') {
                                          console.log('Text input has been initialized')
                                          textInput = {
                                            minLength: nextQuestion.type_info.minLength,
                                            maxLength: nextQuestion.type_info.maxLength,
                                            pattern: nextQuestion.type_info.regex
                                          }
                                        }                                        
                                        
                                        const nextQuestionMessage: ChatMessage = {
                                          id: chatMessages.length + 2,
                                          sender: 'bot',
                                          message: nextQuestion.text,
                                          tooltip: nextQuestion.info,
                                          timestamp: new Date(),
                                          enumOptions,
                                          numericInput,
                                          textInput,
                                          questionPath: nextQuestion.path
                                        };
                                
                                        setChatMessages(prev => [...prev, nextQuestionMessage]);
                                      } 
                                      else {
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

          {/* JsonView is documented at https://github.com/AnyRoad/react-json-view-lite          
          */}
          <div className="config-column">
            <div className="config-header">
              <h3>Configuration Data</h3>
            </div>
            {(JSON.parse(formData.configuration_data).payload !== undefined) 
              ? <JsonView 
                    data={JSON.parse(formData.configuration_data).payload} 
                    shouldExpandNode={allExpanded} 
                    clickToExpandNode={true}
                    style={defaultStyles} 
                />
              :<small className="json-hint">Configuration data will be shown after starting the configuration</small>}
            

            {/* <textarea
              id="configuration_data"
              name="configuration_data"
              value={JSON.stringify(JSON.parse(formData.configuration_data).payload, null, 2)}
              readOnly
              className="json-textarea readonly"
              placeholder="Configuration data will be shown after starting the configuration"
            />*/}
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

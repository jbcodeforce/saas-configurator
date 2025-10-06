import React, { useState, useEffect } from 'react';
import { Configuration } from './types';
import ConfigurationList from './components/ConfigurationList';
import ConfigurationForm from './components/ConfigurationForm';
import ConfigurationDetails from './components/ConfigurationDetails';
import ConfigurationApi from './services/api';
import Home from './components/Home';
import './App.css';

enum AppView {
  HOME = 'home',
  LIST = 'list',
  DETAILS = 'details',
  CREATE = 'create',
  EDIT = 'edit'
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [selectedConfiguration, setSelectedConfiguration] = useState<Configuration | null>(null);
  const [refreshList, setRefreshList] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');

  // Check API connection on app start
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await ConfigurationApi.healthCheck();
        setIsConnected(true);
        setConnectionError('');
      } catch (error) {
        setIsConnected(false);
        setConnectionError('Cannot connect to the API. Please ensure the FastAPI server is running on http://localhost:8000');
      }
    };

    checkConnection();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectConfiguration = (config: Configuration) => {
    setSelectedConfiguration(config);
    setCurrentView(AppView.DETAILS);
  };

  const handleCreateNew = () => {
    setSelectedConfiguration(null);
    setCurrentView(AppView.CREATE);
  };

  const handleEditConfiguration = () => {
    setCurrentView(AppView.EDIT);
  };

  const handleEditConfigurationFromList = (config: Configuration) => {
    setSelectedConfiguration(config);
    setCurrentView(AppView.EDIT);
  };

  const handleSaveComplete = () => {
    setCurrentView(AppView.LIST);
    setSelectedConfiguration(null);
    setRefreshList(true);
  };

  const handleCancel = () => {
    setCurrentView(selectedConfiguration ? AppView.DETAILS : AppView.LIST);
  };

  const handleBackToHome = () => {
    setCurrentView(AppView.HOME);
    setSelectedConfiguration(null);
  };

  const handleDeleteConfiguration = async () => {
    if (selectedConfiguration) {
      try {
        await ConfigurationApi.deleteConfiguration(selectedConfiguration.id);
        setCurrentView(AppView.LIST);
        setSelectedConfiguration(null);
        setRefreshList(true);
      } catch (error) {
        console.error('Error deleting configuration:', error);
        // Error handling could be improved with proper error messages
      }
    }
  };

  const handleRefreshComplete = () => {
    setRefreshList(false);
  };

  if (!isConnected) {
    return (
      <div className="App">
        <div className="connection-error">
          <div className="error-container">
            <h1>🚫 Connection Error</h1>
            <p>{connectionError}</p>
            <div className="error-help">
              <h3>To start the FastAPI server:</h3>
              <ol>
                <li>Open a terminal in the project root directory</li>
                <li>Run: <code>uv run python run.py</code></li>
                <li>Wait for "Uvicorn running on http://127.0.0.1:8000"</li>
                <li>Refresh this page</li>
              </ol>
            </div>
            <button 
              className="btn-retry"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <nav className="header-nav">
            <button 
              className="nav-link home-link" 
              onClick={handleBackToHome}
              title="Go to home page"
            >
              🏠 Home
            </button>
          </nav>
          <h1>SaaS Configurator</h1>
          <div className="connection-status">
            <span className="status-indicator connected"></span>
            API Connected
          </div>
        </div>
      </header>

      <main className="App-main">
        {currentView === AppView.HOME && (
          <Home
            onStartNewConfiguration={handleCreateNew}
            onViewSavedConfigurations={() => setCurrentView(AppView.LIST)}
          />
        )}
        {currentView === AppView.LIST && (
          <ConfigurationList
            onSelectConfiguration={handleSelectConfiguration}
            onEditConfiguration={handleEditConfigurationFromList}
            onCreateNew={handleCreateNew}
            refresh={refreshList}
            onRefreshComplete={handleRefreshComplete}
          />
        )}

        {currentView === AppView.DETAILS && selectedConfiguration && (
          <ConfigurationDetails
            configuration={selectedConfiguration}
            onEdit={handleEditConfiguration}
            onBack={handleBackToHome}
            onDelete={handleDeleteConfiguration}
          />
        )}

        {(currentView === AppView.CREATE || currentView === AppView.EDIT) && (
          <ConfigurationForm
            configuration={currentView === AppView.EDIT ? selectedConfiguration || undefined : undefined}
            onSave={handleSaveComplete}
            onCancel={handleCancel}
          />
        )}
      </main>

      <footer className="App-footer">
        <div className="footer-content">
          <p>&copy; 2025 SaaS Configurator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
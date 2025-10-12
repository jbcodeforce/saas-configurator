import React from 'react';
import './Home.css';

interface HomeProps {
  onStartNewConfiguration: () => void;
  onViewSavedConfigurations: () => void;
}

const Home: React.FC<HomeProps> = ({
  onStartNewConfiguration,
  onViewSavedConfigurations
}) => {
  return (
    <div className="home-container">
      <div className="home-cards">
        <div className="home-card">
          <div className="card-icon">
            <span className="icon-large">📋</span>
          </div>
          <h3>New Configuration</h3>
          <p>Configure your cluster and get resource recommendations for your setup</p>
          <button className="card-button" onClick={onStartNewConfiguration}>
            START →
          </button>
        </div>

        <div className="home-card">
          <div className="card-icon">
            <span className="icon-large">📁</span>
          </div>
          <h3>Saved Configurations</h3>
          <p>Review and edit your existing cluster configurations</p>
          <button className="card-button" onClick={onViewSavedConfigurations}>
            BROWSE →
          </button>
        </div>

        <div className="home-card">
          <div className="card-icon">
            <span className="icon-large">📖</span>
          </div>
          <h3>Configuration Guide</h3>
          <p>Learn about the principles, assumptions and best practices behind resource configuration</p>
          <button className="card-button">
            READ MORE →
          </button>
        </div>
      </div>

      <div className="welcome-section">
        <h2>Welcome to SaaS Configuration Manager</h2>
        <p className="welcome-text">
          This tool helps you manage and configure your cluster setups efficiently. By organizing 
          your configuration parameters, cluster types, and deployment settings, we provide a 
          centralized platform for configuration management and version control.
        </p>

        <div className="cta-section">
          <p className="cta-text">Ready to manage your configurations?</p>
          <button className="btn-cta" onClick={onStartNewConfiguration}>
            📋 Start Your First Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;

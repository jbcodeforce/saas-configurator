# SaaS Configurator - Project Overview

## Project Description

The SaaS Configurator is a full-stack web application that provides an intelligent configuration management system for cluster deployments. It combines a FastAPI backend with a React frontend to offer a rule-based configuration system that helps users define, manage, and validate cluster configurations.

## Architecture Overview

### System Components

1. **Backend (FastAPI)**
   - Built with FastAPI for high-performance API endpoints
   - Uses Pydantic for robust data validation
   - Implements a rule-based configuration engine
   - Provides RESTful CRUD operations for configurations
   - Currently uses in-memory storage (can be extended to persistent storage)

2. **Frontend (React + TypeScript)**
   - Modern React application with TypeScript
   - Component-based architecture
   - Real-time validation and feedback
   - Responsive design for all devices
   - Clean separation of concerns

3. **Configuration Engine**
   - Rule-based system for cluster configuration
   - Supports multiple cluster types:
     - Basic Cluster
     - Dedicated Cluster
     - Enterprise Cluster
     - Freight Cluster
     - Kafka Cluster
     - Standard Cluster
   - Inference capabilities for cluster type determination
   - Multi-language support (en, fr) for data types

### Directory Structure

```
saas-configurator/
├── back-end/                 # FastAPI Backend
│   ├── app/
│   │   ├── main.py          # FastAPI application and endpoints
│   │   ├── models.py        # Pydantic models and schemas
│   │   ├── database.py      # Database implementation
│   │   └── re_client.py     # Rule engine client
│   └── tests/               # Backend tests
├── front-end/               # React Frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API communication
│   │   └── types.ts         # TypeScript definitions
│   └── public/              # Static assets
└── k8s/                     # Kubernetes deployment configs
```

## Key Features

### Configuration Management

1. **CRUD Operations**
   - Create new cluster configurations
   - Read existing configurations
   - Update configuration parameters
   - Delete obsolete configurations

2. **Validation & Rules**
   - Real-time validation of configuration parameters
   - Rule-based inference of cluster types
   - Constraint checking for configuration values
   - Multi-step configuration workflow

3. **User Interface**
   - Intuitive form-based configuration
   - Dynamic field validation
   - Interactive documentation
   - Mobile-responsive design

### Configuration Model

```typescript
interface Configuration {
  id: number;
  name: string;
  description: string;
  cluster_type: string;
  version: string;
  status: "draft" | "active" | "inactive" | "archived";
  configuration_data: {
    nodes: number;
    cpu: string;
    memory: string;
    storage?: string;
    [key: string]: any;
  };
  tags: string[];
  created_at: string;
  updated_at: string;
}
```

### Form Widget Mapping

The system implements intelligent mapping between HTML form widgets and API data types:

| Widget Type | API Data Type | Example Usage |
|------------|---------------|---------------|
| number input | Integer/Number | Node count, CPU cores |
| select/datalist | Enum | Cluster type selection |
| radio buttons | Boolean | Feature toggles |
| text input | ConstrainedText | Name patterns |
| date input | DateTime | Schedule settings |

## Development Workflow

### Setting Up Development Environment

1. **Backend Setup**
```bash
# Install uv package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync --dev

# Run development server
uv run python run.py
```

2. **Frontend Setup**
```bash
cd front-end
npm install
npm start
```

### Testing

1. **Backend Tests**
   - Unit tests for API endpoints
   - Integration tests for rule engine
   - Configuration flow tests

2. **Frontend Tests**
   - Component testing
   - Service integration tests
   - End-to-end testing

## Production Considerations

### Recommended Enhancements

1. **Database Integration**
   - Replace in-memory storage with PostgreSQL/MySQL
   - Implement proper migration system
   - Add data backup and recovery

2. **Security**
   - Add authentication system
   - Implement role-based access control
   - Add API rate limiting
   - Secure configuration data

3. **Monitoring & Logging**
   - Add structured logging
   - Implement metrics collection
   - Set up monitoring dashboards
   - Add error tracking

4. **Performance**
   - Implement caching layer
   - Optimize API responses
   - Add load balancing
   - Implement CDN for static assets

### Deployment

1. **Containerization**
   - Docker containers for both frontend and backend
   - Docker Compose for local development
   - Kubernetes manifests for production deployment

2. **CI/CD**
   - Automated testing pipeline
   - Build and deployment automation
   - Environment-specific configurations
   - Automated version management

## Contributing

### Development Guidelines

1. **Code Style**
   - Follow PEP 8 for Python code
   - Use TypeScript for frontend development
   - Maintain consistent component structure
   - Write comprehensive documentation

2. **Testing Requirements**
   - Write unit tests for new features
   - Update integration tests as needed
   - Maintain test coverage standards
   - Document test scenarios

3. **Pull Request Process**
   - Create feature branches
   - Write clear PR descriptions
   - Include test coverage
   - Update documentation

## License

MIT License - See LICENSE file for details.

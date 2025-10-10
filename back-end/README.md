# SaaS Configurator

A FastAPI application for managing cluster configurations with full CRUD operations.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **Pydantic Models**: Type-safe data validation and serialization
- **CRUD Operations**: Complete Create, Read, Update, Delete operations for configurations
- **In-Memory Storage**: Simple in-memory database for development and testing
- **Filtering & Pagination**: List configurations with status and cluster type filters
- **Interactive Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Type Safety**: Full type hints throughout the codebase

## Project Structure

```
saas-configurator/
├── app/                    # FastAPI Backend
│   ├── __init__.py
│   ├── main.py            # FastAPI application and endpoints
│   ├── models.py          # Pydantic models and schemas
│   └── database.py        # In-memory database implementation
├── front-end/             # React Frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ConfigurationList.tsx
│   │   │   ├── ConfigurationForm.tsx
│   │   │   ├── ConfigurationDetails.tsx
│   │   │   └── *.css     # Component styles
│   │   ├── services/      # API communication
│   │   │   └── api.ts
│   │   ├── types.ts       # TypeScript type definitions
│   │   ├── App.tsx        # Main React application
│   │   ├── App.css        # Global styles
│   │   └── index.tsx      # Application entry point
│   ├── package.json       # Node.js dependencies
│   └── tsconfig.json      # TypeScript configuration
├── pyproject.toml         # Python dependencies and configuration
├── run.py                # Backend server runner
├── test_api.py           # API tests
├── example_usage.py      # Example API usage
├── .gitignore            # Git ignore file
└── README.md             # This file
```

## Installation

This backend component uses [uv](https://docs.astral.sh/uv/) as the package manager. If you don't have uv installed:

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then install the project dependencies:

```bash
# Install dependencies
uv sync

# Or install in development mode with dev dependencies
uv sync --dev
```

## Running the Application

### Backend (FastAPI)

```bash
# Install dependencies
uv sync --dev

# Run the development server
uv run python run.py

# Run tests
uv run python test_api.py

# Try the example usage (with server running)
uv run python example_usage.py
```

The backend API will be available at:
- **API**: http://localhost:8000
- **Interactive Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

### Frontend (React)

```bash
# Navigate to the frontend directory
cd front-end

# Install dependencies
npm install

# Start the development server
npm start

# Build for production
npm run build
```

The frontend will be available at:
- **React App**: http://localhost:3000

### Running Both Services

1. **Start the FastAPI backend first:**
   ```bash
   # In the project root
   uv run python run.py
   ```

2. **Then start the React frontend:**
   ```bash
   # In a new terminal, navigate to front-end folder
   cd front-end
   npm start
   ```

3. **Open your browser and visit http://localhost:3000**

The React app will automatically connect to the FastAPI backend running on port 8000.

## API Endpoints

### Configuration Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Welcome message |
| `GET` | `/health` | Health check |
| `POST` | `/configurations/` | Create a new configuration |
| `GET` | `/configurations/` | List configurations (with pagination and filtering) |
| `GET` | `/configurations/{id}` | Get a specific configuration |
| `PUT` | `/configurations/{id}` | Update a configuration |
| `DELETE` | `/configurations/{id}` | Delete a configuration |

### Configuration Model

A configuration has the following structure:

```json
{
  "id": 1,
  "name": "Production Kubernetes Cluster",
  "description": "Main production cluster configuration",
  "cluster_type": "kubernetes",
  "version": "1.0.0",
  "status": "active",
  "configuration_data": {
    "nodes": 3,
    "cpu": "4 cores",
    "memory": "16GB",
    "storage": "100GB SSD"
  },
  "tags": ["production", "kubernetes", "critical"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Configuration Status

- `draft`: Configuration is being prepared
- `active`: Configuration is currently in use
- `inactive`: Configuration is disabled but available
- `archived`: Configuration is archived

## Example Usage

### Create a Configuration

```bash
curl -X POST "http://localhost:8000/configurations/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development K8s Cluster",
    "description": "Development environment cluster",
    "cluster_type": "kubernetes",
    "version": "1.0.0",
    "status": "active",
    "configuration_data": {
      "nodes": 2,
      "cpu": "2 cores",
      "memory": "8GB"
    },
    "tags": ["development", "k8s"]
  }'
```

### List Configurations

```bash
# Get all configurations
curl "http://localhost:8000/configurations/"

# Filter by status
curl "http://localhost:8000/configurations/?status=active"

# Filter by cluster type
curl "http://localhost:8000/configurations/?cluster_type=kubernetes"

# With pagination
curl "http://localhost:8000/configurations/?skip=0&limit=5"
```

### Get a Specific Configuration

```bash
curl "http://localhost:8000/configurations/1"
```

### Update a Configuration

```bash
curl -X PUT "http://localhost:8000/configurations/1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive",
    "description": "Updated description"
  }'
```

### Delete a Configuration

```bash
curl -X DELETE "http://localhost:8000/configurations/1"
```

## Using the Frontend

The React frontend provides an intuitive interface for managing configurations:

### 🏠 **Dashboard View**
- Browse all configurations in a card-based layout
- Filter by status (Active, Draft, Inactive, Archived)
- Search by cluster type
- Pagination for large datasets
- Real-time connection status indicator

### ➕ **Creating Configurations**
1. Click "New Configuration" button
2. Fill out the form with configuration details
3. Add JSON configuration data (e.g., cluster specs)
4. Add tags for better organization
5. Choose status (Draft, Active, etc.)

### 📝 **Editing Configurations**
1. Click on any configuration card to view details
2. Click "Edit" button
3. Modify any field as needed
4. JSON data is syntax-highlighted and validated
5. Save changes to update

### 🔍 **Viewing Details**
- Click any configuration to see full details
- Toggle between summary and raw JSON view
- See creation and update timestamps
- View all tags and metadata

### 🗑️ **Deleting Configurations**
- Use the × button on configuration cards, or
- Use "Delete" button in detail view
- Confirmation dialog prevents accidental deletion

### 📱 **Mobile Responsive**
- Works perfectly on tablets and phones
- Touch-friendly interface
- Responsive layout adapts to screen size

## Development

### Running Tests

```bash
# Install dev dependencies
uv sync --dev

# Run tests (when implemented)
uv run pytest
```

### Code Quality

The project uses modern Python practices:
- Type hints throughout
- Pydantic for data validation
- FastAPI for automatic API documentation
- Clear separation of concerns

### Adding Features

To extend the application:

1. **Models**: Add new Pydantic models in `app/models.py`
2. **Database**: Extend the database operations in `app/database.py`
3. **Endpoints**: Add new API endpoints in `app/main.py`

## Production Considerations

This application uses an in-memory database for simplicity. For production use, consider:

- **Database**: Replace in-memory storage with PostgreSQL, MySQL, or SQLite
- **Authentication**: Add user authentication and authorization
- **Logging**: Implement structured logging
- **Monitoring**: Add health checks and metrics
- **Caching**: Add Redis or similar for caching
- **Rate Limiting**: Implement API rate limiting
- **Error Handling**: Enhanced error handling and validation
- **Configuration**: Environment-based configuration management
- **Docker**: Containerization for deployment

## License

MIT License - see LICENSE file for details.

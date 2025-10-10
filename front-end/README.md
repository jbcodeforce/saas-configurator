# SaaS Configuration

This front end helps to demonstrate how to drive a product configuration with rule based system.

## What This Application Does

The **SaaS Configurator** is a React-based web application that provides a web interface for managing cluster configurations. It serves as the frontend for a configuration management system that allows users to:

- **View** a list of all cluster configurations with filtering capabilities
- **Create** new cluster configurations with custom settings
- **Edit** existing configurations
- **Delete** configurations that are no longer needed
- **Inspect** detailed configuration information including cluster type, version, status, tags, and configuration data

The application communicates with a FastAPI backend running on `http://localhost:8000` to perform CRUD (Create, Read, Update, Delete) operations on configuration data.

## Code Organization

The codebase follows a typical React TypeScript project structure with clear separation of concerns:

### Core Application Files

- **`src/App.tsx`** - Main application component that handles routing between different views (list, details, create, edit), manages application state, and checks API connectivity
- **`src/index.tsx`** - Application entry point that renders the React app into the DOM
- **`src/types.ts`** - TypeScript type definitions including `Configuration`, `ConfigurationStatus`, and API response types

### Components (`src/components/`)

The application uses three main UI components:

- **`ConfigurationList.tsx`** - Displays a paginated list of all configurations with filtering options by status and cluster type
- **`ConfigurationDetails.tsx`** - Shows detailed information about a selected configuration including all metadata and configuration data
- **`ConfigurationForm.tsx`** - Provides a form interface for creating new configurations or editing existing ones

Each component has its own accompanying CSS file for styling.

### Services (`src/services/`)

- **`api.ts`** - API client layer that encapsulates all HTTP communication with the backend using Axios. Includes methods for:
  - Fetching configurations (with pagination and filtering)
  - Creating, updating, and deleting configurations
  - Health check endpoint for connectivity monitoring

### Styling

- **`App.css`** - Global application styles
- **`index.css`** - Base styles and CSS reset
- Component-specific CSS files (e.g., `ConfigurationList.css`)

### State Management

The application uses React's built-in `useState` and `useEffect` hooks for state management, without any external state management libraries. Key state includes:
- Current view (list, details, create, edit)
- Selected configuration
- API connection status
- Refresh triggers

This architecture provides a clean, maintainable codebase that separates presentation (components), data fetching (services), and type safety (types).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Deployment

### Building for Production

To build the frontend for production:

```bash
# Install dependencies
npm ci

# Build the production bundle
npm run build
```

This will create a `build` directory with the production-ready assets.

### Docker Deployment

The frontend can be deployed using Docker:

```bash
# Build the Docker image
docker build -t saas-configurator-frontend .

# Run the container
docker run -p 80:80 saas-configurator-frontend
```

### Using Docker Compose

To run the entire application (frontend + backend):

```bash
# From the project root
docker-compose up --build
```

This will:
1. Build the frontend and backend images
2. Start Nginx serving the frontend on port 80
3. Start the backend API on port 8000
4. Set up networking between services

### Manual Deployment with Nginx

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Copy the build files to your Nginx server:
   ```bash
   cp -r build/* /usr/share/nginx/html/
   ```

3. Copy the Nginx configuration:
   ```bash
   sudo cp nginx.conf /etc/nginx/conf.d/default.conf
   ```

4. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

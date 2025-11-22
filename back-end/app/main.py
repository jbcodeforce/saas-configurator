"""FastAPI application for SaaS Configurator."""

from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import math
from contextlib import asynccontextmanager
import requests

from app.models import (
    Configuration, 
    ConfigurationCreate, 
    ConfigurationUpdate, 
    ConfigurationResponse,
    ConfigurationListResponse,
    ConfigurationStatus
)
from app.database import db, seed_test_data
from app.re_client import RuleEngineClient, OPERATION_PAYLOAD_API_URL


@asynccontextmanager
async def lifespan(app):
    """Initialize the database and rule engine client on startup, using the FastAPI lifespan context."""
    print("\nStarting SaaS Configurator API...")

    # Initialize database
    seed_test_data(db)
    print("Database initialized and ready!")

    # Initialize Rule Engine Client
    #APP_PATH1= "/Configuration/apps/cluster-config-demo/1.0.0"
    #OPERATION1 = "demo.config.configureKafkaCluster"

    #APP_PATH2= "/Insurance/apps/accident-claim-declaration/1.0.0"
    #OPERATION2 = "smartinsure.claimdeclaration.refreshQuestionnaire"
    try:
        RuleEngineClient.initialize()
        re_client = RuleEngineClient.get_instance()
        if re_client.check_server_status():
            print("Rule Engine connected and ready!")
        else:
            print("Warning: Rule Engine server is not responding!")
    except Exception as e:
        print(f"Warning: Failed to initialize Rule Engine client: {e}")
    yield

# Create FastAPI application
app = FastAPI(
    title="SaaS Configurator",
    description="A FastAPI application for managing cluster configurations",
    version="1.0.0",
    contact={
        "name": "SaaS Configurator Team",
        "email": "support@saas-configurator.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan,
)

# Configure CORS
origins = [
    "http://localhost:3000",  # React development server
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite development server
    "http://127.0.0.1:5173",
    "http://localhost",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", summary="Root endpoint")
async def root():
    """Welcome message for the SaaS Configurator API."""
    return {
        "message": "Welcome to SaaS Configurator API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get(
    "/configurations/",
    response_model=ConfigurationListResponse,
    summary="List configurations",
    description="Retrieve a paginated list of configurations with optional filtering."
)
async def list_configurations(
    skip: int = Query(0, ge=0, description="Number of configurations to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of configurations to return"),
    status: Optional[ConfigurationStatus] = Query(None, description="Filter by configuration status"),
    cluster_type: Optional[str] = Query(None, description="Filter by cluster type"),
):
    """List all cluster configurations with pagination and filtering."""
    configurations = db.get_configurations(skip=skip, limit=limit, status=status, cluster_type=cluster_type)
    total = db.count_configurations(status=status, cluster_type=cluster_type)
    pages = math.ceil(total / limit) if total > 0 else 1
    
    return ConfigurationListResponse(
        items=configurations,
        total=total,
        page=(skip // limit) + 1,
        size=limit,
        pages=pages
    )


@app.get(
    "/configurations/{config_id}",
    response_model=ConfigurationResponse,
    summary="Get configuration by ID",
    description="Retrieve a specific configuration by its ID."
)
async def get_configuration(
    config_id: int = Path(..., gt=0, description="The ID of the configuration to retrieve")
):
    """Get a specific cluster configuration by ID."""
    config = db.get_configuration(config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return config



@app.post(
    "/configurations/",
    response_model=ConfigurationResponse,
    status_code=201,
    summary="Create a new configuration",
    description="Create a new cluster configuration with the provided data."
)
async def create_configuration(config: ConfigurationCreate) -> ConfigurationResponse:
    """Create a new cluster configuration. this is to trigger the rule engine configuration process."""
    try:

        # Get rule engine instance
        re_client = RuleEngineClient.get_instance()

        
        payload_url = OPERATION_PAYLOAD_API_URL
         
        # Make request to inference engine
        response = requests.get(payload_url) #, headers=self.headers)
        if not response.ok:
            raise Exception(f"get initial_payload request failed: {response.status_code}")
            
        resp_json = response.json()        
        input_dict = resp_json.get('payload')
        print("input_dict: ", input_dict)
        #print("input_dict: ", input_dict.model_dump_json(indent=2))

        # input_dict = {
        #     "the customer request": {
        #         "LGType_": "demo.config.CustomerRequest"
        #     },
        #     "the configuration": {
        #         "LGType_": "demo.config.Configuration"
        #     }
        # }
            
        try:
            # Configure through rule engine
            rule_response = re_client.configure(
                input_dict=input_dict,
                lang="en",
            )
            
            # Update config with rule engine results
            config.configuration_data = rule_response
            
        except Exception as re_error:
            raise HTTPException(
                status_code=400, 
                detail=f"Rule Engine configuration failed: {str(re_error)}"
            )
        
        # Create configuration in database
        created_config = db.create_configuration(config)
        return created_config
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating configuration: {str(e)}")


@app.put(
    "/configurations/{config_id}",
    response_model=ConfigurationResponse,
    summary="Update configuration",
    description="Update an existing configuration with the provided data."
)
async def update_configuration(
    config_update: ConfigurationUpdate,
    config_id: int = Path(..., gt=0, description="The ID of the configuration to update")) -> ConfigurationResponse:

    """Update an existing cluster configuration."""
    try:
        print("About to update configuration " + str(config_id))
        print(config_update.model_dump_json(indent=2))

        # Check if configuration exists
        existing_config = db.get_configuration(config_id)
        if not existing_config:
            raise HTTPException(status_code=404, detail="Configuration not found")
            
        # Get rule engine instance
        re_client = RuleEngineClient.get_instance()
        
        # Validate configuration through rule engine
        if not re_client.check_server_status():
            raise HTTPException(status_code=503, detail="Rule Engine service is unavailable")
            
        try:
            # Configure through rule engine
            rule_config = re_client.configure(
                input_dict=config_update.configuration_data['payload'],
                lang="en",
            )
            
            # Update config with rule engine results
            config_update.configuration_data = rule_config
            
        except Exception as re_error:
            raise HTTPException(
                status_code=400,
                detail=f"Rule Engine configuration failed: {str(re_error)}"
            )
        
        # Update configuration in database
        updated_config = db.update_configuration(config_id, config_update)
        if not updated_config:
            raise HTTPException(status_code=404, detail="Configuration not found")
        return updated_config
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating configuration: {str(e)}")


@app.delete(
    "/configurations/{config_id}",
    status_code=204,
    summary="Delete configuration",
    description="Delete a configuration by its ID."
)
async def delete_configuration(
    config_id: int = Path(..., gt=0, description="The ID of the configuration to delete")
):
    """Delete a cluster configuration."""
    success = db.delete_configuration(config_id)
    if not success:
        raise HTTPException(status_code=404, detail="Configuration not found")


@app.get(
    "/health",
    summary="Health check",
    description="Check the health status of the API."
)
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "saas-configurator"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
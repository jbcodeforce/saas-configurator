"""
Rule Engine Client that provides interactive configuration capabilities
through the Provingly rule engine API.
"""

import requests
from typing import Dict, Any, List, Optional
import json
from functools import lru_cache

# Rule Engine Configuration
BASE_RULE_ENGINE_URL = "http://localhost:9000"  # This should come from environment variables in production
SERVER_STATUS_URL = BASE_RULE_ENGINE_URL + "/v1/serverStatus"
SERVER_API_URL = BASE_RULE_ENGINE_URL + "/v1/domains"
APP_PATH= "/Configuration/apps/cluster-config-demo/1.0.0"
OPERATION = "demo.config.configureKafkaCluster"
LANG = "en"
RICH_RESULTS = "true"

OPERATIONS_API_URL = SERVER_API_URL + APP_PATH + "/models/" + OPERATION + "/configure?lang=" + LANG + "&richResults=" + RICH_RESULTS

class RuleEngineClient:
    _instance = None

    def __new__(cls, url: str = None):
        if cls._instance is None:
            if url is None:
                raise ValueError("URL must be provided when creating the first instance")
            cls._instance = super(RuleEngineClient, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, url: str = None):
        if not self._initialized:
            self.url = url
            self.headers = {"Content-Type": "application/json"}
            self._initialized = True

    @classmethod
    def get_instance(cls) -> 'RuleEngineClient':
        """Get the singleton instance of RuleEngineClient."""
        if cls._instance is None:
            cls.initialize()
            response = requests.get(SERVER_STATUS_URL)
            if not response.ok:
                raise RuntimeError("Make sure the Provingly server is running. See README and script to start a Docker container")
            else:
                print("Provingly server is up and running")
  
        return cls._instance

    @classmethod
    def initialize(cls) -> 'RuleEngineClient':
        """Initialize the singleton instance with the given URL."""
        return cls(BASE_RULE_ENGINE_URL)


    def _inject_value(self, dictionary: dict, missing_elt: dict, input_value: str) -> dict:
        """Injects a value into the configuration dictionary based on missing element details."""
        target = missing_elt['target']
        legs = target.split(".")
        member = missing_elt['member']
        member_type = missing_elt['memberType']

        dictionary_target = dictionary
        for leg in legs:
            dictionary_target = dictionary_target[leg]

        if member_type == "Boolean":
            dictionary_target[member] = input_value.lower() in ['true', 't', 'y', 'yes']
        elif member_type == "Integer":
            dictionary_target[member] = int(input_value)
        else:  # String
            dictionary_target[member] = input_value
        return dictionary

    def configure(self, 
                 input_dict: str,
                 lang: str = "en", 
                 input_handler: Optional[callable] = None) -> Dict[str, Any]:
        """
        Performs an interactive configuration session with the rule engine.
        
        Args:
            app_path: Path to the application in the rule engine
            operation: Operation to perform
            lang: Language for responses (default: "en")
            input_handler: Optional callback for handling input prompts
                         If None, uses input() function
        
        Returns:
            Dict containing the final configuration
        """
        api_url = OPERATIONS_API_URL
        
        # Initial configuration state
 
        # Make request to rule engine
        response = requests.post(api_url, 
                                data=json.dumps(input_dict), 
                                headers=self.headers)
        
        if not response.ok:
            raise Exception(f"Rule engine request failed: {response.status_code}")
            
        resp_json = response.json()
        
        # Update configuration state
        input_dict = resp_json.get('output', input_dict)
        
        # Check for missing data
        missing_data = resp_json.get('missingData', [])
        if not missing_data:
            print("Stop processing so pass a response to the caller")
            return input_dict
            
        # Handle missing data through input prompts
        for missing_elt in missing_data:
            question = missing_elt['details']['question']
            if input_handler:
                input_val = input_handler(question)
            else:
                input_val = input(question + " ")
                
            input_dict = self._inject_value(input_dict, missing_elt, input_val)
        
        return input_dict

    def get_rule_engine_config(self) -> Dict[str, Any]:
        """Gets the rule engine configuration."""
        response = requests.get(f"{self.url}/rule-engine/config")
        return response.json()

    def check_server_status(self) -> bool:
        """Checks if the rule engine server is running."""
        try:
            response = requests.get(f"{self.url}/v1/serverStatus")
            return response.ok
        except requests.RequestException:
            return False
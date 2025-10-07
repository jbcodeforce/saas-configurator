"""
Rule Engine Client that provides interactive configuration capabilities
through the Provingly rule engine API.
"""

import requests
from typing import Dict, Any, List, Optional
import json
from functools import lru_cache

from pydantic import BaseModel
from enum import Enum

# Rule Engine Configuration
BASE_RULE_ENGINE_URL = "http://localhost:9000"  # This should come from environment variables in production
SERVER_STATUS_URL = BASE_RULE_ENGINE_URL + "/v1/serverStatus"
SERVER_API_URL = BASE_RULE_ENGINE_URL + "/v1/domains"
APP_PATH= "/Configuration/apps/cluster-config-demo/1.0.0"
OPERATION = "demo.config.configureKafkaCluster"

OPERATIONS_API_URL = SERVER_API_URL + APP_PATH + "/models/" + OPERATION + "/configure?richResults=true&lang="


class QuestionType(str, Enum):
    boolean_type = 'Boolean'
    enum_type = "Enum"
    text_type = 'Text'
    integer_type = 'Integer'
    double_type = 'Number'          # a double float
    date_type = 'Date'              # The most common ISO Date Format yyyy-MM-dd — for example, "2000-10-31".
    datetime_type = 'DateTime'      # The most common ISO Date Time Format yyyy-MM-dd'T'HH:mm:ss.SSSXXX — for example, "2000-10-31T01:30:00.000-05:00".

class LabelValuePair(BaseModel):
    value: str
    label: str  

class EnumRestrictions(BaseModel):
    possible_values: Optional[List[LabelValuePair]] = None

class TextRestrictions(BaseModel):
    regex: Optional[str] = None       # only applicable if data_type is text
    minLength: Optional[int] = None   # minimum string length
    maxLength: Optional[int] = None   # maximum string length

class RangeRestrictions(BaseModel):
    min: Optional[str] = None         # min string will be converted to integer, floating point number, date or datetime depending on the data_type
    max: Optional[str] = None         # max string will be converted to integer, floating point number, date or datetime depending on the data_type
    step: Optional[str] = None

class DataRestrictions(BaseModel):    # this object will populate one of the three following members
    range: Optional[RangeRestrictions] = None
    text: Optional[TextRestrictions] = None
    enumeration: Optional[EnumRestrictions] = None

class QuestionInfo(BaseModel):
    path: str
    text: str
    default_value: Optional[str] = None
    info: Optional[str] = None # used in a tooltip
    type: QuestionType
    restrictions: Optional[DataRestrictions] = None


class ConfigResponse(BaseModel):
    payload: Dict[str, Any]         # contains 'the customer request' and 'the configuration'
    questions: List[QuestionInfo]   # we provide a list even if the frontend might present only one question before calling again the server

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


    # TODO: this logic needs to move to the frontend
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

    # TODO: replace hard-coded question by mapping logic
    def _map_question(self, missing_elt) -> QuestionInfo:
        return QuestionInfo(path = "the customer request.cloudProvider",
                            text = "What is the cloud provider?",
                            info = "Please indicate the cloud provider of the provider",
                            default = "AWS",
                            type = QuestionType.enum_type,
                            restrictions=EnumRestrictions(possible_values=[LabelValuePair("AWS", "Amazon Web Services"), 
                                                                           LabelValuePair("GCP", "Google Cloud")]))

    def configure(self, 
                 input_dict: str,
                 lang: str = "en", 
                 input_handler: Optional[callable] = None) -> ConfigResponse:
        """
        Performs an interactive configuration session with the rule engine.
        
        Args:
            app_path: Path to the application in the rule engine
            operation: Operation to perform
            lang: Language for responses (default: "en")
            input_handler: Optional callback for handling input prompts
                         If None, uses input() function
        
        Returns:
            ConfigResponse containing the payload and the questions
        """
        api_url = OPERATIONS_API_URL + lang
         
        # Make request to inference engine
        response = requests.post(api_url, 
                                data=json.dumps(input_dict), 
                                headers=self.headers)
        
        if not response.ok:
            raise Exception(f"Inference engine request failed: {response.status_code}")
            
        resp_json = response.json()
        
        # Update configuration state
        inferred_payload = resp_json.get('output')
        
        # Transform missing element into QuestionInfo
        questions = [self._map_question(missing_elt) for missing_elt in resp_json.get('missingData')]
        
        return ConfigResponse(payload = inferred_payload, 
                              questions=questions)
    

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
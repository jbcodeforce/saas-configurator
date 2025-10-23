"""
Rule Engine Client that provides interactive configuration capabilities
through the Provingly rule engine API.
"""

import requests
from typing import Dict, Any, List, Optional, Literal, Union
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


class LabelValuePair(BaseModel):
    v: str
    l: str  

class Range(BaseModel):
    min: Optional[str] = None         # min string will be converted to integer, floating point number, date or datetime depending on the data_type
    max: Optional[str] = None         # max string will be converted to integer, floating point number, date or datetime depending on the data_type
    step: Optional[str] = None        # 1 for integers, 0.01 typical value for numbers  

class TypeInfo(BaseModel):   
    pass

class NumberType(TypeInfo): 
    type: Literal['Number'] = 'Number'
    range: Optional[Range] = None

class DateType(TypeInfo):
    type: Literal['Date'] = 'Date'
    date: Optional[Range] = None
    range: Optional[Range] = None

class DateTimeType(TypeInfo):
    type: Literal['DateTime'] = 'DateTime'
    datetime: Optional[Range] = None
    range: Optional[Range] = None

class TextType(TypeInfo):
    type: Literal['Text'] = 'Text'
    regex: Optional[str] = None       # only applicable if data_type is text
    minLength: Optional[int] = None   # minimum string length
    maxLength: Optional[int] = None   # maximum string length

class EnumType(TypeInfo):
    type: Literal['Enum'] = 'Enum'
    possible_values: List[LabelValuePair] = list()

class BooleanType(TypeInfo):
    type: Literal['Boolean'] = 'Boolean'

class ObjectCollectionType(TypeInfo): 
    type: Literal['ObjectCollection'] = 'ObjectCollection'
    minSize: int = 0                # minimum collection size
    maxSize: Optional[int] = None   # maximum collection size
    possibleTypes: List[LabelValuePair] = list()

class SimpleCollectionType(TypeInfo): 
    type: Literal['SimpleCollection'] = 'SimpleCollection'
    minSize: int = 0                # minimum collection size
    maxSize: Optional[int] = None   # maximum collection size
    elementType: str = ''


class QuestionInfo(BaseModel):
    path: str                               # path indicating where to inject back the answer into the payload
    text: str                               # text to be presented to the user
    type_info: Union[EnumType, NumberType, BooleanType, TextType, DateType, DateTimeType, ObjectCollectionType, SimpleCollectionType]   # field used to create the right type of widget in the UI
    default_value: Optional[str] = None     # default value that can be used to populate the UI widget
    info: Optional[str] = None              # information to be used in a tooltip
    common_type_name: Optional[str] = None


class ConfigResponse(BaseModel):
    payload: Dict[str, Any]         # contains 'the customer request' and 'the configuration'
    questions: List[QuestionInfo]   # we provide a list even if the frontend might present only one question before calling again the server
    appName: str
    appVersion: str
    operation: str

def simple_type_name(type_name: str) -> str:
    if not '.' in type_name:
        return type_name
    else:
        return type_name[type_name.rindex('.')+1:]

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

        elif member_type == "ObjectCollection":
            list_element_type = "list_element_type"  #TODO: compute this properly
            dictionary_target[member] = [{ "LGType_": list_element_type } for x in range(1..int(input_value))]

            #if input_value.lower in ['no']:
            #    dictionary_target[member] = []
            #else:
            #    dictionary_target[member] = [{ "LGType_": input_value}]

        else:  # String
            dictionary_target[member] = input_value

        return dictionary



        
    # TODO: replace hard-coded question by mapping logic
    def map_question(self, missing_elt: dict) -> QuestionInfo:
        print("mapping question...")
        print(json.dumps(missing_elt, indent=4))
        memberType = missing_elt['memberType']

        type_info = TextType(type='Text')  # we provide a default...

        if memberType == 'Boolean':
            type_info = BooleanType(type='Boolean')
        elif memberType == 'Text':
            type_info = TextType(type='Text')
        elif memberType == 'Integer':
            type_info = NumberType(type='Number', range=Range(step='1'))
        elif memberType == 'Number':
            type_info = NumberType(type='Number', range=Range(step='0.01'))
        elif "List[" in memberType or "NEList[" in memberType or "Option[" in memberType:
            possible_types = missing_elt['details']['collection']['possibleElementTypes']
            min_number_elements = missing_elt['details']['collection']['min']
            max_number_elements = missing_elt['details']['collection']['max']
            type_info = ObjectCollectionType(type='ObjectCollection', 
                                             minSize = min_number_elements,
                                             maxSize=max_number_elements, 
                                             possibleTypes=[LabelValuePair(v=pt, l=simple_type_name(pt)) for pt in possible_types])

        if 'restriction' in missing_elt['details']:
            if missing_elt['details']['restriction']['type'] == 'enum':
                type_info = EnumType(type='Enum', possible_values=[LabelValuePair(v=pv['v'], l=pv['label']) for pv in missing_elt['details']['restriction']['possibleValues']])
            elif missing_elt['details']['restriction']['type'] == 'text':
                regex: Optional[str] = None if not missing_elt['details']['restriction']['regex'] else missing_elt['details']['restriction']['regex']
                minLength: Optional[int] = None if not missing_elt['details']['restriction']['minLength'] else missing_elt['details']['restriction']['minLength']
                maxLength: Optional[int] = None if not missing_elt['details']['restriction']['maxLength'] else missing_elt['details']['restriction']['maxLength']
                type_info = TextType(type='Text', regex=regex, minLength=minLength, maxLength=maxLength)
            elif missing_elt['details']['restriction']['type'] == 'numeric':
                lower_bound = None if  not missing_elt['details']['restriction']['min'] else str(missing_elt['details']['restriction']['min']['bound'])
                upper_bound = None if  not missing_elt['details']['restriction']['max'] else str(missing_elt['details']['restriction']['max']['bound'])

                if missing_elt['details']['restriction']['underlying'] == 'Integer':
                    step = '1' if not missing_elt['details']['restriction']['step'] else missing_elt['details']['restriction']['step']
                    type_info = NumberType(type='Number', range=Range(min=lower_bound, max=upper_bound, step=step))
                elif missing_elt['details']['restriction']['underlying'] == 'Number':
                    step = '0.01' if not missing_elt['details']['restriction']['step'] else missing_elt['details']['restriction']['step']
                    type_info = NumberType(type='Number', range=Range(min=lower_bound, max=upper_bound, step=step))

        question_info = QuestionInfo(path = missing_elt['target'] + '.' + missing_elt['member'],
                            text = missing_elt['details']['question'],
                            info = missing_elt['details']['info'],
                            default_value = None,
                            type_info = type_info,
                            common_type_name=missing_elt['memberType'])
        
        print("output of question mapping")
        print(question_info.model_dump_json(indent=4))

        return question_info

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
        
        # get inferred payload
        inferred_payload = resp_json.get('output')

        missing_elements = resp_json.get('missingData')

        # TODO: this is the place where we could check if some missing data can be fetched by using some data API
        
        # Transform each missing element into a QuestionInfo
        questions = [self.map_question(missing_elt) for missing_elt in missing_elements]
        
        config_response = ConfigResponse(payload = inferred_payload, 
                              questions=questions, 
                              appName=resp_json.get("computationDetails")["appName"],
                              appVersion=resp_json.get("computationDetails")["appVersion"],
                              operation=resp_json.get("computationDetails")["operation"]                              
                              )

        print("Output of configure method in RuleEngineClient")
        print(config_response.model_dump_json(indent=2))
        
        return config_response
    

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
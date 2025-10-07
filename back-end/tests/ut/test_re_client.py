"""Unit tests for configuration flow."""

import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.models import ConfigurationStatus
from app.database import db
from app.re_client import RuleEngineClient

import json

@pytest.fixture
def client():
    """Create a rule engine client."""
    url = ""
    return RuleEngineClient(url)


def test_rule_engine(client):
    response = client.map_question("some missing element")
    assert response.path == "the customer request.cloudProvider"
    assert response.info == "Please indicate the cloud provider of the provider"

    my_json = {
             "path": "the customer request.cloudProvider",
             "text": "What is the cloud provider?",
             "type_info": {
                "type": "Enum",
                "possible_values": [ {"v": "AWS", "l":"Amazon Web Services"}, {"v": "GCP", "l": "Google Cloud"}]
              },
              "default_value": "AWS",
              "info": "Please indicate the cloud provider of the provider"
    } 

    print("-- pydantic dump --")
    print(response.model_dump_json(indent = 2))
    print("-- json dump --")
    print(json.dumps(my_json, indent = 2))

    assert(response.model_dump_json(indent = 2) == json.dumps(my_json, indent = 2))


"""         QuestionInfo(path = "the customer request.cloudProvider",
                            text = "What is the cloud provider?",
                            info = "Please indicate the cloud provider of the provider",
                            default = "AWS",
                            type_info = EnumType(possible_values=(LabelValuePair(v="AWS", l="Amazon Web Services"), 
                                                                  LabelValuePair(v="GCP", l="Google Cloud")))
                            )
"""    
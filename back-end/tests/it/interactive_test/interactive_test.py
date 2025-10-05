import requests
import json

"""
curl -X 'POST' \
  'http://localhost:9000/v1/domains/Configuration/apps/cluster-config-demo/1.0.0/models/demo.config.configureKafkaCluster/configure?lang=en&richResults=true' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "the customer request": {
    "LGType_": "demo.config.CustomerRequest"
  },
  "the configuration": {
    "LGType_": "demo.config.Configuration"
  }
}'
"""
def interactive_test(app_path: str, operation: str, lang: str):
    print("Starting interactive test with application " + app_path + " and operation " + operation)
    api_url = f"http://localhost:9000/v1/domains/{app_path}/models/{operation}/configure?lang={lang}&richResults=true"
    print(f"Calling: {api_url}")
    input_payload = {
        "the customer request": {
            "LGType_": "demo.config.CustomerRequest"
        },
        "the configuration": {
            "LGType_": "demo.config.Configuration"
        }
    }
    headers =  {"Content-Type":"application/json"}
    response = requests.post(api_url, data=json.dumps(input_payload), headers=headers)

    print(f"status code = {response.status_code}")
    print(response.json())

if __name__ == "__main__":
    print("Welcome to the Luego interactive test tool")

    api_url = "http://localhost:9000/v1/serverStatus"
    response = requests.get(api_url)
    if not response.ok:
        print("Make sure the Provingly server is running. See README and script to start a Docker container")
    else:
        print("Provingly server is up and running")
        language = "en"
        interactive_test("Configuration/apps/cluster-config-demo/1.0.0", 
                         "demo.config.configureKafkaCluster", 
                         language)

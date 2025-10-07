import requests
import json

class bcolors:
    RESET = "\033[0;0m"    
    PINK = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def injectValue(dictionary: dict, missing_elt, input_value: str) -> dict:
    print(f"missing_elt={missing_elt}")
    target = missing_elt['target']
    legs = target.split(".")
    print(f"legs={legs}")
    member = missing_elt['member']
    memberType = missing_elt['memberType']
    print(f"memberType={memberType}")

    dictionary_target = dictionary
    for leg in legs:
        # TODO: test if a leg contains an indexed element, e.g. container.elements[1]
        dictionary_target = dictionary_target[leg]

    if memberType == "Boolean":
        print("injecting boolean")
        dictionary_target[member] = True if (input_value.lower() in ['true', 't', 'y', 'yes']) else False
    elif memberType == "Integer":
        print("injecting integer")
        dictionary_target[member] = int(input_value)
    # TODO: cover more data types    
    else:
        print("injecting string")
        dictionary_target[member] = input_value
    return dictionary


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
    headers =  {"Content-Type":"application/json"}
    print(f"Calling: {api_url}")
    input_dict = {
        "the customer request": {
            "LGType_": "demo.config.CustomerRequest"
        },
        "the configuration": {
            "LGType_": "demo.config.Configuration"
        }
    }
    input_json_string = json.dumps(input_dict)
    response = requests.post(api_url, data=input_json_string, headers=headers)

    print(f"status code = {response.status_code}")
    #print(response.json())

    resp_json = response.json()
    num_calls = 0
    while len(resp_json['missingData']) > 0:
        for missing_elt in resp_json['missingData']:
            input_val = input(f"{bcolors.YELLOW}{missing_elt['details']['question']} ")            
            print(f"{bcolors.YELLOW}answer={input_val}{bcolors.RESET}")
            input_dict = injectValue(input_dict, missing_elt, input_val)

        input_json_string = json.dumps(input_dict)
        response = requests.post(api_url, data=input_json_string, headers=headers)
        num_calls += 1
        print(f"{bcolors.RED}status code after {num_calls} calls = {response.status_code}{bcolors.RESET}")
        print(response.json())
    
        resp_json = response.json()
        input_dict = resp_json['output']
        print(f"{bcolors.GREEN}-- the customer request")
        print(f"{bcolors.GREEN}{input_dict['the customer request']}")
        print(f"{bcolors.BLUE}-- the configuration")
        print(f"{bcolors.BLUE}{input_dict['the configuration']}")

    print("Configuration is complete")
    print(f"{bcolors.GREEN}-- the customer request")
    print(f"{bcolors.GREEN}{input_dict['the customer request']}")
    print(f"{bcolors.BLUE}-- the configuration")
    print(f"{bcolors.BLUE}{input_dict['the configuration']}")



if __name__ == "__main__":
    print("Welcome to the Luego interactive test tool")

    api_url = "http://localhost:9000/v1/serverStatus"
    response = requests.get(api_url)
    if not response.ok:
        print("Make sure the Provingly server is running. See README and script to start a Docker container")
    else:
        print("Provingly server is up and running")
        language = "en"
        #language = "fr"
        interactive_test("Configuration/apps/cluster-config-demo/1.0.0", 
                         "demo.config.configureKafkaCluster", 
                         language)

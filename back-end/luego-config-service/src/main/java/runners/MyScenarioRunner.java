package runners;

import luego.runners.Scenario;
import luego.runners.ScenarioRunner;

public class MyScenarioRunner extends ScenarioRunner {

  public Scenario[] getScenarios() {
    Scenario[] scenarios = {
      new Scenario("Call configureKafkaCluster with incomplete info", 
                    "demo.config.configureKafkaCluster", 
                    """
                    {
                      "the customer request": {
                        "LGType_": "demo.config.CustomerRequest"
                      },
                      "the configuration": {
                        "LGType_": "demo.config.Configuration"
                      }
                    }
                    """                    
                  ),
      new Scenario("Call configureKafkaCluster with complete info", 
                    "demo.config.configureKafkaCluster", 
                    """
                    {
                      "the customer request": {
                          "LGType_": "demo.config.CustomerRequest",
                          "cloudProvider": "AWS",
                          "mustHaveDedicatedEnv": true,
                          "includeOptionalComponent": true,
                          "optionalComponent": {
                            "LGType_": "demo.config.EmailNotification",
                            "email": "jjj@gmail.com"
                          }
                      },
                      "the configuration": {
                          "LGType_": "demo.config.Configuration",
                          "cloudProvider": "AWS",
                          "cluster": {
                            "LGType_": "demo.config.DedicatedCluster",
                            "scaling": "Manual",
                            "minNumberOfNodes": 6,
                            "notificationEmail": "jjj@gmail.com"
                          }
                      }
                    }
                    """                    
                  )

    };
    return scenarios;
  }

  static void main(String[] args) {
    new MyScenarioRunner().run(args);
  }
}

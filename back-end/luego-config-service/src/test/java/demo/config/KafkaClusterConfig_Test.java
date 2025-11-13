package demo.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import luego.runtime.application.LuegoAppInfo;
import luego.runtime.application.LuegoRunner;
import luego.runtime.results.*;
import luego.runtime.values.PreEvaluationError;
import luego.types.LGType;
import scala.Tuple2;
import scala.util.Either;

class KafkaClusterConfig_Test {
  
    static LuegoRunner appRunner;

    @BeforeAll
    static void setup() {
        System.out.println("@BeforeAll - executes once before all test methods in this class");

        LuegoAppInfo appInfo = LuegoAppInfo.read(".");
        appRunner = LuegoRunner.apply("./target/luego/app/" + appInfo.appId() + "/" + appInfo.appVersion());
    }  


    @Test
    void configureKafkaClusterIncomplete() {
        String parametersString = 
        """
        {
            "the customer request": {
                "LGType_": "demo.config.CustomerRequest"
            },
            "the configuration": {
                "LGType_": "demo.config.Configuration"
            }
        }
        """;
     
      Either<PreEvaluationError, Tuple2<Result<?>, LGType>> evalRes = appRunner.evaluate("demo.config.configureKafkaCluster", 
                                                                                         parametersString, "en");

      System.out.println("evalRes = " + evalRes);        
      assertTrue(evalRes.toOption().nonEmpty());
      assertEquals(ResultUtil.hasMissingInfo(evalRes.toOption().get(), 
        """
        {
        "type": "MissingData",
        "elements": [
            {
            "target": "the customer request",
            "targetType": "demo.config.CustomerRequest",
            "member": "cloudProvider",
            "memberType": "demo.config.CloudProvider",
            "kind": "has"
            }
        ]
        }
        """,
        appRunner.dataModel()), scala.None$.MODULE$);
    }

    @Test
    void configureKafkaClusterComplete() {
        String parametersString = 
        """
        {
            "the customer request": {
                "LGType_": "demo.config.CustomerRequest",
                "cloudProvider": "AWS",
                "mustHaveDedicatedEnv": true
            },
            "the configuration": {
                "LGType_": "demo.config.Configuration",
                "cluster": {
                    "LGType_": "demo.config.DedicatedCluster",
                    "scaling": "Manual",
                    "optionalComponent": [
                        {
                        "LGType_": "demo.config.EmailNotification",
                        "email": "notify-me@gmail.com"
                        }
                    ],
                    "minNumberOfNodes": 6
                }
            }
        }        
        """;
     
      Either<PreEvaluationError, Tuple2<Result<?>, LGType>> evalRes = appRunner.evaluate("demo.config.configureKafkaCluster", 
                                                                                         parametersString, "en");

      System.out.println("evalRes = " + evalRes);        
      assertTrue(evalRes.toOption().nonEmpty());
      assertEquals(ResultUtil.hasKnownValue(evalRes.toOption().get(), 
        """
        {}
        """,
        appRunner.dataModel()), scala.None$.MODULE$);
    }

}

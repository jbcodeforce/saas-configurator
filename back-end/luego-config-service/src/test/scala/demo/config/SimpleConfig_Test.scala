package demo.config

import luego.runtime.application.LuegoRunner
import luego.runtime.results.{Known, MissingElt, MissingGroup, ResultWrite}
import luego.runtime.values.ValueWrite
import org.scalatest.funsuite.AnyFunSuite

class SimpleConfig_Test extends AnyFunSuite {

  val appRunner: LuegoRunner = TestedApp.appRunner
  val language = "en"
  val rw = ResultWrite(appRunner.dataModel)
  val vw = ValueWrite(appRunner.dataModel)

  test("SimpleConfiguration from scratch") {
    val jsonStr = """{
                    |  "the customer request": {
                    |    "LGType_" : "demo.config.CustomerRequest"
                    |  },
                    |  "the configuration": {
                    |    "LGType_" : "demo.config.Configuration"
                    |  }
                    |}""".stripMargin
    val json = ujson.read(jsonStr).obj
    val evalRes = appRunner.evaluate("demo.config.configureKafkaCluster", json, language)
    evalRes match {
      case Left(error) => assert(false, "Unexpected error: " + error)
      case Right((mg, t)) =>
        val mgJSON = rw.toJSON(mg, t)
        assert(mgJSON ==
          """{
            |"type":"MissingData",
            |"elements":[{
            |"target":"the customer request","targetType":"demo.config.CustomerRequest","member":"cloudProvider","memberType":"demo.config.CloudProvider","kind":"has"
            |}]
            |}""".stripMargin.replaceAll("\n", ""))
    }
  }

  test("SimpleConfiguration with cloudProvider") {
    val jsonStr = """{
                    |  "the customer request": {
                    |    "LGType_" : "demo.config.CustomerRequest",
                    |    "cloudProvider": "AWS"
                    |  },
                    |  "the configuration": {
                    |    "LGType_": "demo.config.Configuration",
                    |    "cloudProvider": "AWS"
                    |  }
                    |}""".stripMargin
    val json = ujson.read(jsonStr).obj
    val evalRes = appRunner.evaluate("demo.config.configureKafkaCluster", json, language)
    evalRes match {
      case Left(error) => assert(false, "Unexpected error: " + error)
      case Right((mg, t)) =>
        val mgJSON = rw.toJSON(mg, t)
          assert(mgJSON ==
            """{"type":"MissingData","elements":[{"target":"the customer request","targetType":"demo.config.CustomerRequest","member":"mustHaveDedicatedEnv","memberType":"Boolean","kind":"has"}]}""")
    }
  }

  test("SimpleConfiguration with wrong cloudProvider") {
    val jsonStr = """{
                    |  "the customer request": {
                    |    "LGType_" : "demo.config.CustomerRequest",
                    |    "cloudProvider": "XYZUV"
                    |  },
                    |   "the configuration": {
                    |      "LGType_": "demo.config.Configuration"
                    |   }
                    |}""".stripMargin
    val json = ujson.read(jsonStr).obj
    val evalRes = appRunner.evaluate("demo.config.configureKafkaCluster", json, language)
    evalRes match {
      case Left(error) =>
      case Right(res) =>
        assert(false, "Unexpected right result: " + res)
    }
  }

  test("SimpleConfiguration with cloudProvider + mustHaveDedicatedEnv true") {
    val jsonStr = """{
                    |  "the customer request": {
                    |    "LGType_" : "demo.config.CustomerRequest",
                    |    "cloudProvider": "AWS",
                    |    "mustHaveDedicatedEnv": true
                    |  },
                    |  "the configuration": {
                    |      "LGType_": "demo.config.Configuration",
                    |      "cloudProvider": "AWS",
                    |      "cluster": {
                    |         "LGType_": "demo.config.DedicatedCluster"
                    |      }
                    |   }
                    |}""".stripMargin
    val json = ujson.read(jsonStr).obj    
    val evalRes = appRunner.evaluate("demo.config.configureKafkaCluster", json, language)
    evalRes match {
      case Left(error) => assert(false, "Unexpected error: " + error)
      case Right((mg, t)) =>
        val mgJSON = rw.toJSON(mg, t)
        assert(mgJSON ==
          """{"type":"MissingData","elements":[{"target":"the customer request","targetType":"demo.config.CustomerRequest","member":"includeOptionalComponent","memberType":"Boolean","kind":"has"}]}""")

    }
  }

  test("SimpleConfiguration with complete configuration => no more questions") {
    val jsonStr = """{
                    |   "the customer request": {
                    |      "LGType_": "demo.config.CustomerRequest",
                    |      "cloudProvider": "AWS",
                    |      "mustHaveDedicatedEnv": true,
                    |      "includeOptionalComponent": false
                    |   },
                    |   "the configuration": {
                    |      "LGType_": "demo.config.Configuration",
                    |      "cloudProvider": "AWS",
                    |      "cluster": {
                    |         "LGType_": "demo.config.DedicatedCluster",
                    |         "minNumberOfNodes": 4
                    |      }
                    |   }
                    |}""".stripMargin
    val json = ujson.read(jsonStr).obj   
    val evalRes = appRunner.evaluate("demo.config.configureKafkaCluster", json, language)
    evalRes match {
      case Left(error) => assert(false, "Unexpected error: " + error)
      case Right((Known(v), t)) =>
        val responseJSON = vw.toJSON(v, t)
        assert(responseJSON == "{}")
    }
  }
}
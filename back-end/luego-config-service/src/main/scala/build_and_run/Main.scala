package build_and_run

import luego.build.application.*
import luego.runtime.application.*
import os.{Path, RelPath}
import scalaz.ValidationNel
import cats.syntax.either.*


object Main {

  val projectName = "sample-app-cluster-configuration"

  case class Scenario(name:String, decisionName: String, parameters: String)

  def getScenarios: List[Scenario] =
    Nil

  type Color = String
  def cprintln(c: Color, s: String): Unit = println(c + s + Console.WHITE)

  def main(args: Array[String]): Unit = {
    cprintln(Console.BLUE, "-----------------------------------------")
    //cprintln(Console.BLUE, "Number of passed arguments: " + args.length)

    val build = args.length > 0 && args.apply(0) == "build"

    val exitOnBuildError = true
    val applicationPath: Path = os.pwd / projectName
    val applicationSrcPath: Path = applicationPath / "src/main"

    val appInfo: LuegoAppInfo = LuegoAppBuilder.getLuegoAppInfo(applicationPath)

    val applicationRuntimePath: Path = applicationPath / "target/luego/app" / RelPath(appInfo.appId) / RelPath(appInfo.appVersion)

    if (build) {
      cprintln(Console.BLUE, "BUILDING THE APPLICATION " + appInfo.appId + "/" + appInfo.appVersion)
      println("Application path = " + applicationPath.toString)
      println("---------- CLEAN ------------------------")

      LuegoAppBuilder.clean(applicationPath)
      println("----------- READ APP CONFIG -----------------------")

      val luegoAppRes: ValidationNel[String, DTLuegoApp] = DTLuegoApp.readDTLuegoApp(applicationSrcPath)
      luegoAppRes match {
        case scalaz.Failure(s) =>
          println("applicationSrcPath: " + applicationSrcPath)
          println("applicationRuntimePath: " + applicationRuntimePath)
          cprintln(Console.RED, "** Error with reading application config " + s)
        case scalaz.Success(luegoApp) =>
          println("App configuration has been read successfully")
          //println("typePackagePaths = " + luegoApp.typePackagePaths)
          cprintln(Console.BLUE, "----------- COMPILE -----------------------")
          val appRes = LuegoAppBuilder.build(luegoApp, true)
          appRes match {
            case scalaz.Success(rtApp) =>

              cprintln(Console.BLUE, "----------- PRERUN CHECKS -----------------------")
              if (rtApp.failingModels.nonEmpty) {
                cprintln(Console.RED, "Failing models: " + rtApp.failingModels.mkString(", "))
                if (exitOnBuildError)
                  return // exiting the program
              }
              cprintln(Console.GREEN, "Working models: " + rtApp.workingModels.map(_.name).mkString(", "))

              for (scenario <- getScenarios) {
                println()
                rtApp.workingModels.find(_.fullName == scenario.decisionName) match {
                  case Some(rta) =>
                    val artefactType = rta match {
                      case _: RTFunction => "function"
                      case _: RTDecisionModel => "decision model"
                    }
                    println(s"==== ${scenario.name} - will call $artefactType '${scenario.decisionName}'")

                  case None =>
                    cprintln(Console.RED, s"** Error - no runtime artefact called '${scenario.decisionName}'")
                }

                println("----------- CHECK PRESENCE OF RUNTIME ARTEFACTS -----------------------")
                val runtimeArtefactFolderPath = applicationRuntimePath / os.RelPath(scenario.decisionName.replace(".", "/"))

                val folderExists = os.exists(runtimeArtefactFolderPath) && os.isDir(runtimeArtefactFolderPath)
                println("Folder " + runtimeArtefactFolderPath.toString + " " + folderExists)

              }

            case scalaz.Failure(e) => cprintln(Console.RED, "** Build error: " + e)
          }
      }
    }
    else {
      cprintln(Console.BLUE, "TESTING THE APPLICATION " + appInfo.appId + "/" + appInfo.appVersion)
      println("----------- RUN by loading binary files -----------------------")
      println("Runtime path = " + applicationRuntimePath)

      val appRunner = new LuegoRunner(applicationRuntimePath)
      val language = "en"
      val parameters = ujson.Obj(("the customer request", ujson.Obj(("LGType_", "demo.config.CustomerRequest"))),
                                  ("the configuration", ujson.Obj(("LGType_", "demo.config.Configuration"))))

      println("Initial empty request")
      cprintln(Console.CYAN, parameters.render(3))
      val exploratoryTest = ExploratoryTestManager(appRunner, "demo.config.configureKafkaCluster", language)
      exploratoryTest.play(parameters)
    }
  }
}
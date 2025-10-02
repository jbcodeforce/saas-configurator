package demo.config

import luego.build.application.LuegoAppBuilder
import luego.runtime.application.{LuegoAppInfo, LuegoRunner}
import os.{Path, RelPath}

object TestedApp {
  val projectName = "sample-app-cluster-configuration"
  val applicationPath: Path = os.pwd / projectName

  val appInfo: LuegoAppInfo = LuegoAppBuilder.getLuegoAppInfo(applicationPath)

  val applicationRuntimePath: Path = applicationPath / "target/luego/app" / RelPath(appInfo.appId) / RelPath(appInfo.appVersion)

  val appRunner: LuegoRunner = {
    println("CLEANING " + applicationPath)
    LuegoAppBuilder.clean(applicationPath)
    println("BUILDING " + applicationPath)
    val buildRes = LuegoAppBuilder.buildFromSource(applicationPath, true)
    println("RESULT OF BUILD: " + buildRes)

    println("CREATING RUNNER WITH COMPILED APP AT : " + applicationRuntimePath)
    new LuegoRunner(applicationRuntimePath)
  }
}
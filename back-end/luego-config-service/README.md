# Running the Luego configuration service
The Luego configuration service is based on a Docker container that will mount a local folder containing the Luego application. 

Luego applications are stored in the "artefacts" folder and can be organized by domains in various "domains" subfolder. In this demo, we run a single Luego application called "cluster-config-demo" and located in "domains/Configuration".

To start the Luego configuration service, please run the script run-apis-on-docker.bash located under the "artefacts" folder.

Once the container has started, open a browser and go to http://localhost:9000/v1/applications/html.
This will present you a view of the various Luego applications that have been deployed. You can then click on the "SwaggerUI" link to see the various API endpoints that can be called and their signature.

# Rebuilding the Luego application
## Requirements
You will need:
- maven
- Java 21: set your JAVA_HOME so that it points to your local Java JDK (JDK21 or later)
If you need to install Java 21, you can download and install it from https://adoptium.net/temurin/releases/?arch=any&version=21&os=any

## Compiling and running an application
Go to the folder 'luego-config-service'. It contains the source code of the Luego application: 
```
cd luego-config-service
```

### Clean the Luego application
```
mvn exec:java@luego-compiler -Dexec.args="app clean"
```
### Compile the Luego application

```
mvn exec:java@luego-compiler -Dexec.args="app compile"
```

If compilation is successful, the folder target/luego will contain binary files for each function or decision model. We will then be ready to run Luego programs that use those functions and decision models.

The default log level of the compiler is Info. If you want the compiler to output more information, you can set the level to Trace as follows:
```
export LUEGOC_LOG_LEVEL="Trace"
```
You can then switch back to the Info log level to get a clear output in the console.
```
export LUEGOC_LOG_LEVEL="Info"
```

### Running some scenarios
```
mvn exec:java@scenario-runner
```
This maven goal runs the Java program `runners.ScenarioRunner` located in src/main/java. You can look at the ScenarioRunner.java file to see how to integrate a Luego program into Java.

### Running exploratory tests
```
mvn exec:java@luego-exploratory-tests
```
This maven goal runs the Java program `runners.ExploratoryTestRunner` located in src/main/java. You can look at the ExploratoryTestRunner.java file to see how to configure an exploratory test for a function/decision model of your choice.

The exploratory test runner is a great way to quickly verify the behaviour of our Luego programs for various scenarios. The creation of scenario data is greatly facilitated by a conversational agent that will ask relevant questions to incrementally build an input payload to test a function or decision model.

We can then reuse the created input payloads in our automated regression tests.

### Automated unit testing with JUnit
```
mvn test
```
This maven goal runs automated tests defined with JUnit in src/test/java.

### Packaging the Luego app
```
mvn exec:java@luego-compiler -Dexec.args="app package"
```

If packaging is successful, you should have an archive called luego-starter-app.zip in the folder target/luego. We will be ready to deploy our application to a Provingly server.

### Deploying to the folder used by the Provingly Server
- copy the zip archive target/luego/cluster-config-demo.zip into the folder artefacts\domains\configuration
- expand the archive
The volume artefacts\domains\configuration will be mounted by the Docker container so that the Luego application will be visible to the Provingly server.

### Start the Docker image to run the Provingly Server APIs
To start the Luego configuration service, please run the script run-apis-on-docker.bash located under the "artefacts" folder.

### Open your browser to ... and test APIs with SwaggerUI
Once the container has started, open a browser and go to http://localhost:9000/v1/applications/html.

## Documentation of the Luego programming language and the Provingly technology
Visit https://docs.provingly.io
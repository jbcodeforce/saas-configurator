# Running the Luego configuration service
The Luego configuration service is based on a Docker container that will mount a local folder containing the Luego application. 

Luego applications are stored in the "artefacts" folder and can be organized by domains in various "domains" subfolder. In this demo, we run a single Luego application called "cluster-config-demo" and located in "domains/Configuration".

To start the Luego configuration service, please run the script run-apis-on-docker.bash located under the "artefacts" folder.

Once the container has started, open a browser and go to http://localhost:9000/v1/applications/html.
This will present you a view of the various Luego applications that have been deployed. You can then click on the "SwaggerUI" link to see the various API endpoints that can be called and their signature.

# Rebuilding the Luego application (coming soon)
- use the Luego dev tools to rebuild and repackage the application
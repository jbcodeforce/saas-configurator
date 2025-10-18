#!/bin/bash
echo "Start Provingly App Execution APIs in Docker"
docker container run -v .:/var/lib/Luego/ -d -p 9000:9000 -e PROVINGLY_SERVER_ENV='stage' provingly/luego-server-apis:1.1.8
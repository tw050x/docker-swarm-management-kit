# The Copilot Instructions for the Docker Swarm Management Kit Project

This repo is for the Docker Swarm Management Kit project. The project must create an electron app that will build on github actions for macos, windows and linux systems.

The project creates the following:

* A docker container image that should be deployed to a docker swarm. Once deployed users can access the app via the web browser and the app should provide a convenient UI for managing the docker swarm configuration and secrets.

* An Electron app that enables users to create a swarm node and add it to the cluster on various cloud providers. The app will also allow the creation of the initial swarm manager node and store the join token.

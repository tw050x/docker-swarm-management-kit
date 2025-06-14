#!/bin/sh

set -e

echo "Starting the web application..."
echo "Docker host: ${DOCKER_HOST:-'not set'}"
echo "Environment: ${NODE_ENV:-'not set'}"

# Note: We don't need to wait for Docker daemon here since
# the application uses Dockerode which will handle connection retries
# and the healthcheck in docker-compose ensures the daemon is ready

exec "$@"

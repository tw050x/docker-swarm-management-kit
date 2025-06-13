#!/bin/bash

# Wait for Docker Swarm to be ready
DOCKER_HOST=${DOCKER_HOST:-tcp://docker-dind:2375}

echo "Waiting for Docker daemon at $DOCKER_HOST..."

# Wait for Docker daemon to be available
while ! docker version >/dev/null 2>&1; do
    echo "Docker daemon not ready, waiting..."
    sleep 2
done

echo "Docker daemon is ready!"

# Wait for Swarm to be initialized
while ! docker node ls >/dev/null 2>&1; do
    echo "Docker Swarm not ready, waiting..."
    sleep 2
done

echo "Docker Swarm is ready!"

#!/bin/bash

# Docker Swarm Management Kit - Local Development Setup
# This script initializes Docker Swarm mode for local development

echo "🐳 Setting up Docker Swarm for local development..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if already in swarm mode
if docker info --format '{{.Swarm.LocalNodeState}}' | grep -q "active"; then
    echo "✅ Docker is already in Swarm mode"
    echo "Node ID: $(docker info --format '{{.Swarm.NodeID}}')"
    echo "Manager: $(docker info --format '{{.Swarm.ControlAvailable}}')"
else
    echo "🔧 Initializing Docker Swarm..."

    # Initialize swarm mode
    docker swarm init

    if [ $? -eq 0 ]; then
        echo "✅ Docker Swarm initialized successfully!"
        echo "Node ID: $(docker info --format '{{.Swarm.NodeID}}')"
    else
        echo "❌ Failed to initialize Docker Swarm"
        exit 1
    fi
fi

echo ""
echo "🚀 Starting Docker Swarm Management Kit..."
echo ""

# Start the application
docker-compose up --build

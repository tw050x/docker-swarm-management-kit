#!/bin/bash

# Script to populate test data in Docker Swarm for development

set -e

DOCKER_HOST=${DOCKER_HOST:-tcp://docker-dind:2375}

export DOCKER_HOST

echo "Creating test secrets and configs in Docker Swarm..."

# Wait for swarm to be ready
/scripts/wait-for-swarm.sh

# Create test secrets
echo "Creating test secrets..."
echo "secret-value-1" | docker secret create test-secret-1 -
echo "secret-value-2" | docker secret create test-secret-2 -
echo "database-password-123" | docker secret create db-password -

# Create test configs
echo "Creating test configs..."
cat << 'EOF' | docker config create nginx-config -
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

cat << 'EOF' | docker config create app-config -
{
    "database": {
        "host": "localhost",
        "port": 5432,
        "name": "myapp"
    },
    "cache": {
        "redis": {
            "host": "redis",
            "port": 6379
        }
    }
}
EOF

echo "Test data created successfully!"
echo "Secrets: $(docker secret ls --format 'table {{.Name}}\t{{.CreatedAt}}' | wc -l) created"
echo "Configs: $(docker config ls --format 'table {{.Name}}\t{{.CreatedAt}}' | wc -l) created"

#!/bin/bash

# Start the application directly - no certificates needed for non-TLS connection
echo "Starting the web application..."
exec "$@"

#!/bin/bash

# Docker TLS Certificate Generation Script
# This script generates TLS certificates for secure Docker daemon communication

set -e

CERT_DIR="/certs"
DOCKER_HOST_IP=${DOCKER_HOST_IP:-"127.0.0.1"}
DOCKER_HOST_NAME=${DOCKER_HOST_NAME:-"docker-dind"}

echo "🔐 Generating Docker TLS certificates..."

# Create certificates directory
mkdir -p $CERT_DIR

# Generate CA private key
openssl genrsa -aes256 -passout pass:changeit -out $CERT_DIR/ca-key.pem 4096

# Generate CA certificate
openssl req -new -x509 -days 365 -key $CERT_DIR/ca-key.pem -passin pass:changeit \
    -sha256 -out $CERT_DIR/ca.pem -subj "/C=US/ST=State/L=City/O=Docker/CN=CA"

# Generate server private key
openssl genrsa -out $CERT_DIR/server-key.pem 4096

# Generate server certificate signing request
openssl req -subj "/C=US/ST=State/L=City/O=Docker/CN=$DOCKER_HOST_NAME" \
    -sha256 -new -key $CERT_DIR/server-key.pem -out $CERT_DIR/server.csr

# Create extensions file for server certificate with broader IP range
cat > $CERT_DIR/server-extfile.cnf <<EOF
subjectAltName = DNS:$DOCKER_HOST_NAME,DNS:localhost,IP:$DOCKER_HOST_IP,IP:127.0.0.1,IP:0.0.0.0
extendedKeyUsage = serverAuth
EOF

# Generate server certificate
openssl x509 -req -days 365 -sha256 -in $CERT_DIR/server.csr \
    -CA $CERT_DIR/ca.pem -CAkey $CERT_DIR/ca-key.pem -passin pass:changeit \
    -out $CERT_DIR/server-cert.pem -extfile $CERT_DIR/server-extfile.cnf -CAcreateserial

# Generate client private key
openssl genrsa -out $CERT_DIR/client-key.pem 4096

# Generate client certificate signing request
openssl req -subj '/C=US/ST=State/L=City/O=Docker/CN=client' \
    -new -key $CERT_DIR/client-key.pem -out $CERT_DIR/client.csr

# Create extensions file for client certificate
echo "extendedKeyUsage = clientAuth" > $CERT_DIR/client-extfile.cnf

# Generate client certificate
openssl x509 -req -days 365 -sha256 -in $CERT_DIR/client.csr \
    -CA $CERT_DIR/ca.pem -CAkey $CERT_DIR/ca-key.pem -passin pass:changeit \
    -out $CERT_DIR/client-cert.pem -extfile $CERT_DIR/client-extfile.cnf -CAcreateserial

# Set appropriate permissions
chmod 400 $CERT_DIR/ca-key.pem $CERT_DIR/server-key.pem $CERT_DIR/client-key.pem
chmod 444 $CERT_DIR/ca.pem $CERT_DIR/server-cert.pem $CERT_DIR/client-cert.pem

# Create additional certificate files with default Docker names for compatibility
cp $CERT_DIR/client-cert.pem $CERT_DIR/cert.pem
cp $CERT_DIR/client-key.pem $CERT_DIR/key.pem
chmod 444 $CERT_DIR/cert.pem
chmod 400 $CERT_DIR/key.pem

# Clean up CSR and extension files
rm $CERT_DIR/server.csr $CERT_DIR/client.csr $CERT_DIR/server-extfile.cnf $CERT_DIR/client-extfile.cnf

echo "✅ Docker TLS certificates generated successfully!"
echo "📁 Certificates location: $CERT_DIR"
echo "🔑 Files generated:"
echo "   - ca.pem (Certificate Authority)"
echo "   - server-cert.pem (Server Certificate)"
echo "   - server-key.pem (Server Private Key)"
echo "   - client-cert.pem (Client Certificate)"
echo "   - client-key.pem (Client Private Key)"
echo "   - cert.pem (Client Certificate - Docker default name)"
echo "   - key.pem (Client Private Key - Docker default name)"

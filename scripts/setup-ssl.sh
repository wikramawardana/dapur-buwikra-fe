#!/bin/bash

# SSL Certificate Setup Script for wikra.cloud
# Run this script on your production server

set -e

DOMAIN="wikra.cloud"
EMAIL="your-email@example.com"  # Change this to your email

echo "=== SSL Certificate Setup for $DOMAIN ==="

# Create necessary directories
echo "Creating directories..."
mkdir -p nginx/certbot/conf
mkdir -p nginx/certbot/www

# Step 1: Stop any existing containers
echo "Stopping existing containers..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Step 2: Start with HTTP-only nginx for certificate challenge
echo "Starting HTTP-only nginx for ACME challenge..."
docker compose -f docker-compose.init-ssl.yml up -d

# Wait for nginx to be ready
echo "Waiting for nginx to start..."
sleep 5

# Step 3: Obtain SSL certificate
echo "Requesting SSL certificate from Let's Encrypt..."
docker run --rm \
  -v "$(pwd)/nginx/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/nginx/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN

# Step 4: Stop HTTP-only nginx
echo "Stopping HTTP-only nginx..."
docker compose -f docker-compose.init-ssl.yml down

# Step 5: Start production with HTTPS
echo "Starting production stack with HTTPS..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "=== Setup Complete ==="
echo "Your site should now be available at https://$DOMAIN"
echo ""
echo "To check the status:"
echo "  docker compose -f docker-compose.prod.yml ps"
echo "  docker compose -f docker-compose.prod.yml logs -f nginx"

#!/bin/bash

# Development startup script for DevOps App with Neon Local
# This script starts the application in development mode with Neon Local

echo "🚀 Starting DevOps App in Development Mode"
echo "================================================"

# Check if .env.development exists
if [ ! -f .env.development ]; then
    echo "❌ Error: .env.development file not found!"
    echo "   Please copy .env.development from the template and update with your Neon credentials."
    exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi

# Create .neon_local directory if it doesn't exist
mkdir -p .neon_local

# Add .neon_local to .gitignore if not already present
if ! grep -q ".neon_local/" .gitignore 2>/dev/null; then
    echo ".neon_local/" >> .gitignore
    echo "✅ Added .neon_local/ to .gitignore"
fi

echo "📦 Recreating development containers and running migrations..."
echo "   - Stopping any existing dev stack"
echo "   - Starting Neon Local + app (ephemeral branch)"
echo "   - Running Drizzle migrations against Neon Local"
echo ""

# Stop existing dev stack
docker compose -f docker-compose.dev.yml down

# Start Neon Local + app in background (creates ephemeral branch)
docker compose -f docker-compose.dev.yml up -d --build

# Run migrations inside the app container against Neon Local
docker compose -f docker-compose.dev.yml run --rm app npm run db:migrate

echo ""
echo "🎉 Development environment started!"
echo "   Application: http://localhost:3000"
echo "   Database (via Neon Local): postgres://neon:npg@localhost:5432/neondb"
echo ""
echo "To stop the environment, run: docker compose -f docker-compose.dev.yml down"
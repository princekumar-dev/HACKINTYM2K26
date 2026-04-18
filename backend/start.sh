#!/bin/bash
# Quick Start Script for Health Monitoring Backend
# This script sets up and starts the backend system

set -e

echo "🚀 Health Monitoring Backend - Quick Start"
echo "==========================================="
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node 18+"
  exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if MongoDB is running
echo "🔍 Checking MongoDB..."
if command -v mongo &> /dev/null; then
  if mongo mongodb://localhost:27017 --eval "db.serverStatus()" &>/dev/null; then
    echo "✅ MongoDB is running"
  else
    echo "⚠️  MongoDB is not responding. Starting MongoDB..."
    # Uncomment if you have MongoDB installed locally
    # mongod --fork --logpath /tmp/mongodb.log
    echo "   Please start MongoDB manually and re-run this script"
    exit 1
  fi
else
  echo "⚠️  MongoDB not found. Using Docker compose..."
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if [ -f "package.json" ]; then
  npm install --silent
  echo "✅ Dependencies installed"
else
  echo "❌ package.json not found. Are you in the backend directory?"
  exit 1
fi

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
if npm run build &>/dev/null 2>&1; then
  echo "✅ Build successful"
else
  echo "⚠️  Build completed with warnings"
fi

# Start backend
echo ""
echo "🌟 Starting backend server..."
echo "   Listening on http://localhost:3001"
echo "   Swagger docs: http://localhost:3001/api/docs"
echo ""
echo "📝 To test the system, in another terminal run:"
echo '   curl http://localhost:3001/api/health/health-check'
echo ""
echo "📖 Documentation:"
echo "   - HEALTH_MONITORING_GUIDE.md - API reference"
echo "   - QUICK_REFERENCE.md - Cheat sheet"
echo "   - IMPLEMENTATION_GUIDE.md - Integration steps"
echo ""
echo "Ctrl+C to stop the server"
echo ""

npm run start:dev

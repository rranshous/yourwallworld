#!/bin/bash

# Setup script for avatar-builder

echo "🎨 Avatar Builder Setup"
echo ""

# Check if .env exists
if [ -f .env ]; then
  echo "✓ .env file already exists"
else
  echo "Creating .env file..."
  cp .env.example .env
  echo "✓ Created .env file"
  echo ""
  echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY"
  echo ""
fi

# Check if node_modules exists
if [ -d node_modules ]; then
  echo "✓ Dependencies already installed"
else
  echo "Installing dependencies..."
  npm install
  echo "✓ Dependencies installed"
fi

echo ""
echo "✓ Setup complete!"
echo ""
echo "To run the app:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"

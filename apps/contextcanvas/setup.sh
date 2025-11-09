#!/bin/bash

echo "Setting up Context Canvas..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY"
fi

echo "Setup complete!"
echo ""
echo "To run the app:"
echo "  npm run dev    # Development mode with auto-reload"
echo "  npm run build  # Build for production"
echo "  npm start      # Run production build"
echo ""
echo "The app will run on http://localhost:3003"

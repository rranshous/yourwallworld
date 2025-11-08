#!/bin/bash

# Setup script for firstlight

echo "Setting up firstlight..."

# Install dependencies
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
ANTHROPIC_API_KEY=your_api_key_here
PORT=3002
EOF
    echo "⚠️  Please edit .env and add your Anthropic API key"
fi

echo "✅ Setup complete!"
echo ""
echo "To run:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3002 in your browser"

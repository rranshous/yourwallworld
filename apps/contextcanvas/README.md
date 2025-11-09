# Context Canvas

A shared communication space between human and AI, where both can collaborate visually and contextually.

## Concept

Context Canvas creates a collaborative workspace where humans and AI meet. The canvas serves as both:
- A visual representation (what both participants see)
- A code representation (JavaScript that renders the canvas)

This dual representation allows the AI to understand both the visual appearance and the precise structure of the shared space.

## Setup

Run the setup script:

```bash
./setup.sh
```

Or manually:

```bash
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

The app will be available at http://localhost:3003

## Current Status

✅ Milestone 1: Foundation - Basic TypeScript web app with Hello World page

## Architecture

- **Backend**: TypeScript Node.js server using Express
- **Frontend**: Single-page app with Canvas and chat interface
- **API**: Anthropic Claude for AI interaction

## Development

See `docs/IPI.md` for the full implementation plan and milestones.

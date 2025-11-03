# Avatar Builder 🎨

An experimental iterative avatar creation system where Claude designs its own visual representation through an evolutionary feedback loop.

## Overview

This application lets Claude (Anthropic's AI) create and refine a visual avatar of itself using JavaScript canvas drawing. Over multiple iterations, Claude sees its previous work, reflects on it through extended thinking, and creates progressively refined versions.

## Features

### Core Capabilities
- **Iterative Design**: Claude refines its avatar over multiple iterations
- **Visual Feedback Loop**: Each iteration includes the previous canvas image
- **Extended Thinking**: Optional 2000-token thinking budget to see Claude's design reasoning
- **Conversation Memory**: Maintains thinking history across iterations for coherent evolution

### UI Features
- **Film Reel**: View progression of all iterations as thumbnails
- **Keyboard Navigation**: Use ← → arrow keys to browse iterations
- **Stop/Continue Controls**: 
  - Stop iterations early
  - Continue beyond initial count (+5 more)
- **Temperature Control**: Adjust creativity (0.0-1.0) when thinking is disabled
- **Code Display**: See the generated JavaScript for each iteration
- **Thinking Display**: View Claude's design reasoning (when enabled)

### Technical Features
- **Auto-retry**: Automatically retries if generated code has syntax errors
- **API Resilience**: Exponential backoff retry for API overload errors
- **Token Optimization**: Only thinking history is preserved (not old code)
- **High Detail**: 30,000 token budget for complex drawings

## Setup

### Prerequisites
- Node.js (v16 or higher)
- Anthropic API key

### Installation

```bash
# Navigate to project directory
cd apps/avatar-builder

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Running

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## Usage

1. **Set your persona**: Describe who you are (this becomes Claude's system prompt)
2. **Configure iterations**: Choose how many iterations to run (default: 5)
3. **Choose mode**:
   - **Extended Thinking**: Enable for 2000-token reasoning (temp locked to 1.0)
   - **Temperature Control**: Disable thinking to adjust creativity (0.0-1.0)
4. **Start**: Click "Start Avatar Creation"
5. **Watch**: Observe as Claude iterates and refines
6. **Navigate**: Use arrow keys or click thumbnails to view any iteration
7. **Continue**: Add more iterations if needed with the Continue button

## How It Works

### Iteration Loop

1. **Prompt**: Claude receives:
   - Your persona description
   - Current iteration number
   - Previous canvas image (if not first iteration)
   - Previous code (if not first iteration)
   - All previous thinking (if thinking mode enabled)

2. **Think** (if enabled): Claude uses up to 2000 tokens to reason about design

3. **Generate**: Claude writes JavaScript code to draw on a 512x512 canvas

4. **Execute**: Code runs in the browser, updating the canvas

5. **Capture**: Canvas image is saved for next iteration

6. **Repeat**: Process continues for configured iterations

### Architecture

```
┌─────────────────┐
│   Frontend      │
│   (HTML/JS)     │
│                 │
│  - Canvas       │
│  - Controls     │
│  - Film Reel    │
└────────┬────────┘
         │
         │ HTTP POST /api/iterate
         │
┌────────▼────────┐
│   Backend       │
│   (Express)     │
│                 │
│  - Rate limit   │
│  - Retry logic  │
└────────┬────────┘
         │
         │ Anthropic API
         │
┌────────▼────────┐
│   Claude        │
│                 │
│  - Think (opt)  │
│  - Generate JS  │
└─────────────────┘
```

## API

### POST /api/iterate

Request body:
```typescript
{
  persona: string,
  iterationNumber: number,
  totalIterations: number,
  enableThinking: boolean,
  temperature: number,
  previousImage?: string,  // base64 PNG
  previousCode?: string,
  conversationHistory?: Array<{
    code: string,
    thinking?: string,
    signature?: string
  }>
}
```

Response:
```typescript
{
  success: boolean,
  code: string,           // Generated JavaScript
  thinking: string,       // Thinking process (if enabled)
  signature: string,      // Cryptographic signature for thinking
  usage: {
    input_tokens: number,
    output_tokens: number
  }
}
```

## Configuration

### Environment Variables
- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)
- `PORT` - Server port (default: 3000)

### Tunable Parameters
- **Max Tokens**: 30,000 (allows for complex, detailed drawings)
- **Thinking Budget**: 2,000 tokens (when enabled)
- **Temperature**: 0.0-1.0 (when thinking disabled)
- **Canvas Size**: 512x512px (fixed)

## Examples

Try different personas to see how Claude represents itself:

- **"You are a helpful AI assistant"** - Classic, friendly
- **"You are a creative artist focused on abstract expressionism"** - Abstract designs
- **"You are a technical engineer who loves precision"** - Geometric patterns
- **"You are playful and whimsical"** - Fun, lighthearted designs

## Development

### Project Structure
```
apps/avatar-builder/
├── src/
│   └── server.ts        # Express API server
├── public/
│   └── index.html       # Frontend application
├── package.json
└── README.md
```

### Key Technologies
- **Frontend**: Vanilla JavaScript, HTML Canvas API
- **Backend**: Express.js, TypeScript
- **AI**: Anthropic Claude (claude-sonnet-4-5-20250929)
- **SDK**: @anthropic-ai/sdk v0.68.0

## Interesting Observations

- Claude's design choices evolve based on seeing its previous work
- Extended thinking provides insight into design reasoning
- Each persona leads to distinctly different visual styles
- Early iterations are exploratory; later ones refine details
- The thinking history creates narrative coherence across iterations

## Limitations

- Canvas is 512x512px (fixed size)
- No external libraries in generated code
- Only 2D canvas context available
- Thinking mode requires temperature=1.0 (API restriction)
- Signature required for thinking blocks in conversation

## Part of YourWallWorld

This is the first experiment in the [YourWallWorld](../../README.md) project - exploring ways to give Claude a persistent presence in physical space through feedback loops and visual interaction.

## License

MIT

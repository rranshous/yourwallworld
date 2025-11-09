# Context Canvas

A shared communication and understanding space where humans and AI collaborate visually. Rather than the canvas being the AI's embodiment, it becomes the place where human and AI meet, collaborate, and build shared understanding.

## Core Concept

Context Canvas reimagines human-AI interaction by creating a **shared workspace** where both participants can:
- See each other's contributions in real-time
- Draw and create visual content
- Build understanding through dual representation (visual + code)
- Collaborate naturally like working on a whiteboard together

## Features

### Bidirectional Drawing
- **Human Drawing**: Click and drag to draw freehand paths on the canvas
- **AI Drawing**: Ask the AI to draw shapes, text, or diagrams using natural language
- **Shared Visibility**: Both participants see all contributions immediately

### Dual Representation
The canvas exists in two forms:
1. **Visual**: PNG screenshot showing what the canvas looks like
2. **Code**: JavaScript that generates the canvas, providing precise structural understanding

Both representations are sent to the AI with every message, giving it rich context.

### Real-time Collaboration
- AI sees visual results of its drawing immediately (server-side rendering)
- Multi-turn tool loops allow AI to make corrections if needed
- Debug panel shows underlying JavaScript for transparency

## Tech Stack

- **Backend**: TypeScript, Node.js, Express
- **Frontend**: HTML5 Canvas API, Vanilla JavaScript
- **AI**: Anthropic Claude API (claude-sonnet-4-5-20250929)
- **Canvas Rendering**: Browser Canvas + node-canvas for server-side rendering
- **Tools**: LM function calling for bidirectional canvas modification

## Getting Started

### Prerequisites
- Node.js v18+
- Anthropic API key

### Installation

```bash
# Navigate to project
cd apps/contextcanvas

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Run the app
npm run dev
```

The app will be available at `http://localhost:3003`

### Usage

1. **Chat with AI**: Use the right sidebar to send messages
2. **Draw**: Click and drag on the canvas to draw
3. **Ask AI to Draw**: Say "draw a blue circle" or "add your name to the canvas"
4. **View Debug Info**: Check the bottom-left panel to see the JavaScript code

## How It Works

### Canvas as Source of Truth
The canvas is maintained as executable JavaScript code. When you draw:
```javascript
// Drawn by human
ctx.strokeStyle = "#ff6b35";
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(100, 150);
ctx.lineTo(200, 250);
ctx.stroke();
```

When the AI draws, it uses the `update_canvas` tool to generate similar code.

### AI Context
Every message to the AI includes:
- Canvas screenshot (base64 PNG)
- Complete canvas JavaScript code
- User's text message

This gives the AI full visual and structural understanding of the shared space.

### Tool Use Loop
When AI wants to draw:
1. AI returns `tool_use` block with JavaScript code
2. Server appends code to canvas JS
3. Server renders updated canvas using node-canvas
4. Server sends `tool_result` with updated screenshot + code
5. AI sees result and can iterate or respond

## Project Structure

```
apps/contextcanvas/
├── src/
│   └── server.ts          # Express server with Anthropic integration
├── public/
│   ├── index.html         # UI layout and styles
│   └── client.js          # Canvas rendering and chat client
├── docs/
│   ├── completed/         # Original IPI and development notes
│   └── enhancements.md    # Future enhancement plans
├── .env.example           # Environment template
└── package.json
```

## Development

### Run in development mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Architecture Notes

- **Conversation History**: Stored in-memory (last 10 messages)
- **Canvas Dimensions**: Frontend sends dimensions; backend renders to match
- **Drawing Comments**: Human drawings tagged with `// Drawn by human`, AI with `// Drawn by AI`
- **Error Handling**: Canvas rendering errors shown visually on canvas

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/chat` - Send message with canvas context
  - Request: `{ message, canvasScreenshot, canvasJS, canvasDimensions }`
  - Response: `{ response, canvasJS, toolUses }`

## Debug API

Open browser console and use:
```javascript
// Get current canvas JavaScript
window.__contextCanvas.getJS()

// Set new canvas JavaScript
window.__contextCanvas.setJS(newCode)

// Re-render canvas
window.__contextCanvas.render()

// Update debug panel
window.__contextCanvas.updateDebug()
```

## Current Status

✅ **All 6 Core Milestones Complete!**

1. ✅ Foundation - TypeScript server infrastructure
2. ✅ Simple Chat - Full chat UI with Anthropic integration
3. ✅ Canvas - HTML5 Canvas with JS code as source of truth
4. ✅ Canvas as Context - AI sees screenshot + code
5. ✅ Simple Draw Tool - Mouse-based drawing
6. ✅ Enable Model to Draw - Bidirectional collaboration

**BONUS**: Server-side canvas rendering for immediate AI visual feedback

## Future Enhancements

See `docs/enhancements.md` for planned features:
- Pan and zoom
- Persistence (save/load canvas)
- Communication frames (starter templates)
- Undo/redo
- Color picker and drawing tools
- Multi-user collaboration

## Credits

Built as part of the YourWallWorld project exploring novel human-AI interaction models.

## License

MIT

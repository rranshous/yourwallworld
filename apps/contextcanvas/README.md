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
- **Streaming responses**: See AI's actions as they happen via NDJSON streaming
- **Progressive canvas updates**: Canvas updates immediately as each tool executes
- **Multi-turn tool loops**: AI can iterate and make corrections
- **Server-side rendering**: AI sees visual results with Playwright browser rendering
- **Debug panel**: Underlying JavaScript visible for transparency
- **No timeouts**: Streaming architecture prevents 504 errors on long responses

## Tech Stack

- **Backend**: TypeScript, Node.js, Express
- **Frontend**: HTML5 Canvas API, Vanilla JavaScript
- **AI**: Anthropic Claude API (claude-sonnet-4-5-20250929)
- **Streaming**: NDJSON (newline-delimited JSON) over HTTP streaming
- **Canvas Rendering**: Playwright browser rendering for full JavaScript support
- **Tools**: Claude function calling for bidirectional canvas modification

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

When the AI draws, it uses canvas tools to generate similar code.

### AI Context
Every message to the AI includes:
- Full canvas screenshot (base64 PNG)
- Viewport screenshot (what user sees)
- Complete canvas JavaScript code (with data URIs redacted for token efficiency)
- Canvas metadata (name, template, dimensions)
- Viewport state (pan/zoom)

This gives the AI full visual and structural understanding of the shared space.

### Multiple Tools
The AI has access to several tools:
- **append_to_canvas**: Add new drawing commands to existing canvas
- **replace_canvas**: Completely rewrite canvas (for reorganization/fixes)
- **update_element**: Update specific named elements efficiently
- **import_webpage**: Screenshot and import any URL to canvas

### Streaming Tool Loop
When AI wants to draw:
1. AI returns `tool_use` block with JavaScript code
2. Server **streams** tool use event to client immediately
3. Server executes tool and renders canvas with Playwright
4. Server **streams** canvas update with new screenshot + code
5. Client updates canvas in real-time
6. Server sends tool result back to AI with updated context
7. AI sees result and can iterate or respond
8. Process repeats until AI is satisfied

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
- `POST /api/chat-stream` - Send message with canvas context (streaming responses)
  - **Request**: `{ message, fullCanvasScreenshot, viewportScreenshot, canvasJS, canvasName, canvasTemplate, canvasDimensions, viewport }`
  - **Response**: Newline-delimited JSON stream with events:
    - `tool_use` - AI is using a tool (type, toolId, canvasJS)
    - `canvas_update` - Canvas has been rendered (canvasJS, screenshot)
    - `message` - AI's text response
    - `usage` - Token usage stats
    - `tool_error` - Tool execution error
    - `error` - Fatal error
    - `done` - Stream complete

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

✅ **Core Foundation Complete + Active Development**

**Implemented Features:**
- ✅ Bidirectional drawing (human + AI)
- ✅ **Real-time streaming** (NDJSON over HTTP, progressive updates)
- ✅ Multi-canvas management (create, switch, rename, delete)
- ✅ Canvas templates (blank, brainstorming, planning, concept map)
- ✅ Webpage import tool (screenshot and import any URL)
- ✅ **Playwright browser rendering** (full JS support, proper image handling)
- ✅ Replace canvas tool (AI can rewrite entire canvas)
- ✅ Element-based editing (update specific sections efficiently)
- ✅ Pan and zoom viewport controls
- ✅ Canvas resizing with constraints
- ✅ Debug panel with JS viewer
- ✅ **Image transform fixes** (imported images respect pan/zoom and layering)

**Recent Milestones (Nov 2025):**
- **Streaming Architecture**: Converted from blocking HTTP to NDJSON streaming for real-time updates
- **Finer Canvas Interaction**: Replace tool, element editing, user rename, browser rendering
- **Image Rendering Fixes**: Transform and layering bugs resolved
- **Context Import Tools (exploring)**: File upload, webcam capture, export possibilities

See `docs/completed/` for implementation details and `docs/ipi-context-import-tools.md` for ideas in progress.

## Future Enhancements

**High Priority:**
- SSE streaming for real-time progress updates
- Context import tools (file upload, webcam, export)
- Animation isolation for interactive canvases

**See Also:**
- `docs/future-enhancements.md` - SSE streaming and animation isolation
- `docs/ipi-context-import-tools.md` - File I/O and media capture tools

## Credits

Built as part of the YourWallWorld project exploring novel human-AI interaction models.

## License

MIT

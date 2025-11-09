# IPI: Context Canvas - Shared Communication Space

## Idea

### Core Concept
Context Canvas reimagines the relationship between humans and AI by creating a **shared communication and understanding space**. Rather than the canvas being the AI's embodiment, it becomes the place where human and AI meet, collaborate, and build shared understanding.

### Key Insights
- **Dual representation**: The canvas exists as both visual output (screenshot) and code (JavaScript), giving the model precise structural understanding alongside visual context
- **Shared workspace**: The canvas is where both participants can contribute, see each other's work, and build context together
- **Clean separation**: Conversation history stays in messages; visual/structural shared state lives in the canvas
- **Tool-mediated collaboration**: Both human (via mouse/UI) and AI (via LM tools) can modify the canvas, with changes reflected in the underlying JavaScript

### What Makes This Exciting
This creates a genuinely interactive and exploratory experience - more like working together on a whiteboard than chatting with a text interface. The canvas can grow organically, you can pan and zoom, and the shared visual space makes abstract concepts concrete.

Future possibilities include:
- Communication frames (starter templates for different types of work)
- Loading external context (webpages, documents) onto the canvas
- Different modes of collaboration (brainstorming, planning, problem-solving)

---

## Plan

### Architecture Overview
- **Backend**: TypeScript Node.js server using Anthropic API
- **Frontend**: Single-page app with two main UI areas:
  - Right sidebar: Chat interface for text conversation
  - Main area: HTML5 Canvas for shared visual workspace
- **Canvas representation**: Maintained as JavaScript code that renders the canvas, allowing both human and AI to understand and modify it
- **Context flow**: Each API call includes conversation history + latest canvas (screenshot + JS)

### Technical Stack
- TypeScript
- Node.js + Express (similar to other apps in workspace)
- HTML5 Canvas API
- Anthropic Claude API with tools support
- Canvas screenshot via browser API

### Milestones

#### Milestone 1: Foundation ✅
**Goal**: Basic TypeScript web app infrastructure

- [x] Set up TypeScript project structure
- [x] Create Express server with basic routing
- [x] Serve "Hello World" HTML page
- [x] Verify build and run process

**Deliverable**: Running web server that displays a simple page

**Status**: COMPLETE - Server running on http://localhost:3003

---

#### Milestone 2: Simple Chat ✅
**Goal**: Functional AI chat interface

- [x] Create right sidebar chat UI
  - [x] Message input field
  - [x] Message display area (human vs AI messages)
  - [x] Send button
- [x] Implement API endpoint for chat messages
- [x] Integrate Anthropic API
  - [x] Set up API client with proper secret handling (reference other apps)
  - [x] Use correct model string (claude-sonnet-4-5-20250929)
  - [x] Handle message sending (non-streaming)
  - [x] Display complete responses
- [x] Maintain conversation history in memory

**Deliverable**: Working chat interface where you can send messages and receive AI responses

**Status**: COMPLETE - Chat interface functional with Anthropic integration

**Technical Notes**:
- Store conversation history as array of messages
- Use Anthropic's messages API (non-streaming)
- Reference other apps in workspace for API setup patterns and secret handling

---

#### Milestone 3: Canvas ✅
**Goal**: Visual canvas workspace

- [x] Add HTML5 Canvas element (fills remaining UI space)
- [x] Set up canvas rendering context
- [x] Create initial canvas JavaScript renderer
  - [x] Raw JavaScript code is the source of truth (no intermediate state objects)
  - [x] Implement render function that executes JS directly
- [x] Prepopulate canvas with starter content
  - [x] Example: Welcome text, a few shapes, maybe areas for "thoughts" and "memories"
- [x] Add debug panel to view canvas JavaScript
  - [x] Display current canvas JS code in UI for debugging

**Deliverable**: Split-screen UI with chat sidebar and visual canvas showing starter content, plus ability to inspect canvas JS

**Status**: COMPLETE - Canvas renders from pure JavaScript code, debug panel shows the JS

**Technical Notes**:
- Canvas rendering code stored as executable JavaScript string
- `eval()` executes the JS to render the canvas
- Render function re-executes the JS on resize or updates
- Debug view shows the actual JS code (no intermediate representations)
- `window.__contextCanvas.getJS()` / `setJS(code)` for programmatic access

---

#### Milestone 4: Canvas as Context ✅
**Goal**: AI can "see" the canvas

- [x] Implement canvas screenshot functionality
  - [x] Use `canvas.toDataURL()` or similar
  - [x] Convert to format for Anthropic API (base64)
- [x] Package canvas JavaScript code as text
- [x] Send canvas in API calls correctly
  - [x] System message: Explain the shared canvas concept and collaboration context
  - [x] User message: Include both screenshot and JS code
  - [x] Format clearly for the model
- [x] Test that model can describe canvas contents

**Deliverable**: AI responses demonstrate awareness of canvas content

**Status**: COMPLETE - Canvas screenshot + JS sent to AI in every message

**Technical Notes**:
- Anthropic API supports image inputs via base64
- System prompt sets context about shared canvas collaboration
- Canvas (screenshot + JS) goes in user messages
- Include JS code as text in markdown code block
- History trimmed to last 10 messages (5 exchanges) due to image size

---

#### Milestone 5: Simple Draw Tool for Human
**Goal**: Human can draw on canvas with mouse

- [ ] Implement mouse event handlers
  - [ ] mousedown, mousemove, mouseup
  - [ ] Track drawing state
- [ ] Create simple drawing tool (freehand line drawing)
- [ ] Update canvas JavaScript as drawing happens
  - [ ] Add drawn paths/shapes to canvas state structure
  - [ ] Ensure render function can replay these additions
- [ ] Test that drawn content persists and appears in canvas JS

**Deliverable**: You can draw on canvas with mouse, and those drawings are captured in the canvas JavaScript

**Technical Notes**:
- Drawing tool adds data to canvas state (e.g., array of paths with points)
- Canvas re-renders from state to include new drawings
- State structure must be inspectable/modifiable by both human code and AI

---

#### Milestone 6: Enable Model to Draw
**Goal**: AI can modify canvas via LM tools

- [ ] Define LM tool for canvas modification
  - [ ] Tool name: something like "update_canvas" or "draw_on_canvas"
  - [ ] Parameters: Accept direct JavaScript code that operates on canvas/ctx
  - [ ] Based on previous experiments: Direct JS manipulation works best
- [ ] Implement tool handler on backend
  - [ ] Parse tool call from Anthropic API response
  - [ ] Execute/integrate JS code to update canvas state
  - [ ] Return updated canvas to frontend
- [ ] Test full cycle:
  - [ ] You draw something
  - [ ] AI sees it in context
  - [ ] AI uses tool to add to canvas
  - [ ] You see AI's additions

**Deliverable**: Bidirectional canvas collaboration - both human and AI can draw, and each can see the other's contributions

**Technical Notes**:
- Use Anthropic's tool/function calling feature
- Tool accepts raw JavaScript code to manipulate canvas/context
- Previous experiments showed direct JS works better than operations or structured commands
- Frontend needs to refresh/re-render when AI updates canvas
- Consider tool safety (validate/sandbox AI code execution)

---

## Implement

### Current Status
**Active Milestone**: Simple Draw Tool for Human (Milestone 5)

**Completed**:
- ✅ Milestone 1: Foundation
- ✅ Milestone 2: Simple Chat
- ✅ Milestone 3: Canvas
- ✅ Milestone 4: Canvas as Context

**In Progress**:
- None

**Next Steps**:
1. Implement mouse event handlers for drawing
2. Update canvas JS as drawing happens
3. Ensure drawn content updates debug panel
4. Test that AI can see drawings

---

### Development Log

#### [Date: 2025-11-09] - Project Initialization
- Created IPI document
- Defined six milestones for first pass implementation

#### [Date: 2025-11-09] - Milestone 1: Foundation Complete ✅
- Created package.json with dependencies (@anthropic-ai/sdk, express, dotenv, tsx, typescript)
- Set up tsconfig.json for TypeScript compilation
- Implemented basic Express server with health check endpoint
- Created Hello World HTML page with server connection status
- Set up .env configuration with API key
- Created setup.sh script and README.md
- Server successfully running on port 3003
- Build process verified (TypeScript compiles without errors)

#### [Date: 2025-11-09] - Milestone 2: Simple Chat Complete ✅
- Created chat UI sidebar with message display, input field, and send button
- Implemented client-side JavaScript (client.js) for chat interactions
  - Send messages on Enter key or button click
  - Display user and assistant messages with role labels
  - Handle loading states and errors
- Created POST /api/chat endpoint on server
  - Maintains conversation history (last 20 messages)
  - Integrates with Anthropic API using claude-sonnet-4-5-20250929
  - Non-streaming response handling
- System prompt establishes Context Canvas collaboration context
- Verified full chat flow working

#### [Date: 2025-11-09] - Milestone 3: Canvas Complete ✅
- Added HTML5 Canvas element to main area with responsive sizing
- Implemented canvas rendering using **raw JavaScript code as source of truth**
  - No intermediate state objects or JSON representations
  - Canvas JS code stored as executable JavaScript string
  - `eval()` executes the JS to render the canvas
- Prepopulated starter content: welcome box, memories area, decorative circle
- Created floating debug panel (bottom-left) that displays current canvas JS
- Added resize handling for canvas to maintain crisp rendering
- Exposed `window.__contextCanvas` API for console debugging:
  - `getJS()` - retrieve current canvas JS
  - `setJS(code)` - update and re-render canvas
  - `render()` - re-execute canvas JS
  - `updateDebug()` - refresh debug panel

#### [Date: 2025-11-09] - Milestone 4: Canvas as Context Complete ✅
- Implemented canvas screenshot capture using `canvas.toDataURL('image/png')`
- Updated client to send canvas screenshot + JS code with every chat message
- Modified server to receive and format canvas data:
  - Canvas screenshot sent as base64 image in message content
  - Canvas JS code sent as text in markdown code block
  - Both included in user message content array
- Created comprehensive system prompt explaining shared canvas concept
- Updated conversation history to support multi-modal content (text + images)
- Reduced history retention to 10 messages (5 exchanges) due to image size
- AI can now see both visual representation and code structure of canvas

---

### Notes & Decisions

**Canvas State Representation**:
- Will maintain canvas as JavaScript data structure + render function
- This allows both visual (screenshot) and programmatic (JS code) representation
- AI can reason about structure via code, visual appearance via screenshot

**Why Both Screenshot AND Code?**:
- Screenshot: Gives model visual understanding (spatial relationships, colors, overall composition)
- JavaScript: Gives model precise structure (exact coordinates, data relationships, modifiable state)
- Together: Model can "see" and "understand" at both levels, similar to how humans work

**Future Considerations** (out of scope for first pass):
- Communication frames (starter templates)
- Pan/zoom functionality for canvas navigation
- Loading external content (webpages, documents) onto canvas
- Persistence (saving/loading canvas sessions)
- Multiple canvas tools (draw, text, shapes, etc.)

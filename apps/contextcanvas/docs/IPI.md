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

#### Milestone 1: Foundation
**Goal**: Basic TypeScript web app infrastructure

- [ ] Set up TypeScript project structure
- [ ] Create Express server with basic routing
- [ ] Serve "Hello World" HTML page
- [ ] Verify build and run process

**Deliverable**: Running web server that displays a simple page

---

#### Milestone 2: Simple Chat
**Goal**: Functional AI chat interface

- [ ] Create right sidebar chat UI
  - [ ] Message input field
  - [ ] Message display area (human vs AI messages)
  - [ ] Send button
- [ ] Implement API endpoint for chat messages
- [ ] Integrate Anthropic API
  - [ ] Set up API client with proper secret handling (reference other apps)
  - [ ] Use correct model string (claude-3-5-sonnet-20241022 or current)
  - [ ] Handle message sending (non-streaming for now)
  - [ ] Display complete responses
- [ ] Maintain conversation history in memory

**Deliverable**: Working chat interface where you can send messages and receive AI responses

**Technical Notes**:
- Store conversation history as array of messages
- Use Anthropic's messages API (non-streaming)
- Reference other apps in workspace for API setup patterns and secret handling

---

#### Milestone 3: Canvas
**Goal**: Visual canvas workspace

- [ ] Add HTML5 Canvas element (fills remaining UI space)
- [ ] Set up canvas rendering context
- [ ] Create initial canvas JavaScript renderer
  - [ ] Define simple data structure for canvas state
  - [ ] Implement render function that draws from state
- [ ] Prepopulate canvas with starter content
  - [ ] Example: Welcome text, a few shapes, maybe areas for "thoughts" and "memories"
- [ ] Add debug panel to view canvas JavaScript
  - [ ] Display current canvas JS code in UI for debugging

**Deliverable**: Split-screen UI with chat sidebar and visual canvas showing starter content, plus ability to inspect canvas JS

**Technical Notes**:
- Canvas state stored as JavaScript code/data structure
- Render function executes to draw canvas from state
- Consider coordinate system and sizing
- Debug view essential for development and troubleshooting

---

#### Milestone 4: Canvas as Context
**Goal**: AI can "see" the canvas

- [ ] Implement canvas screenshot functionality
  - [ ] Use `canvas.toDataURL()` or similar
  - [ ] Convert to format for Anthropic API (base64)
- [ ] Package canvas JavaScript code as text
- [ ] Send canvas in API calls correctly
  - [ ] System message: Explain the shared canvas concept and collaboration context
  - [ ] User message: Include both screenshot and JS code
  - [ ] Format clearly for the model
- [ ] Test that model can describe canvas contents

**Deliverable**: AI responses demonstrate awareness of canvas content

**Technical Notes**:
- Anthropic API supports image inputs via base64
- System prompt sets context about what we're doing together
- Canvas (screenshot + JS) goes in user messages
- Include JS code as text in message
- Consider message size limits

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
**Active Milestone**: Foundation

**Completed**:
- None yet

**In Progress**:
- Setting up initial project structure

**Next Steps**:
1. Create basic TypeScript + Express server setup
2. Set up build configuration
3. Create hello world HTML page
4. Test that everything runs

---

### Development Log

#### [Date: 2025-11-09] - Project Initialization
- Created IPI document
- Defined six milestones for first pass implementation
- Ready to begin Milestone 1: Foundation

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

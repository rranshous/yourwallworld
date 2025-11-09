# Context Canvas - Future Enhancements

This document outlines potential enhancements and new features for Context Canvas now that the core functionality is complete.

## Status

**Core System**: ✅ COMPLETE (All 6 milestones)
- Bidirectional drawing (human + AI)
- Dual representation (visual + code)
- Real-time collaboration
- Server-side rendering for immediate AI feedback

---

## Enhancement Categories

### 1. Canvas Interaction & Navigation

#### Pan and Zoom
**Goal**: Allow users to navigate a larger canvas space

- [ ] Implement pan (drag to move viewport)
- [ ] Implement zoom (scroll or pinch to zoom in/out)
- [ ] Add minimap/overview in corner
- [ ] Preserve zoom/pan state across messages
- [ ] Update coordinate system to handle viewport transforms

**Benefits**: Enables working on larger, more complex canvases without cluttering the visible space

**Technical Notes**:
- Need to track viewport position and scale
- Transform mouse coordinates to canvas space
- Consider how AI understands "off-screen" content
- May need to send viewport bounds to AI

---

#### Undo/Redo
**Goal**: Allow users to undo/redo drawing actions

- [ ] Maintain history stack of canvas states
- [ ] Add Ctrl+Z / Ctrl+Y keyboard shortcuts
- [ ] Show undo/redo buttons in UI
- [ ] Handle AI drawing operations in history
- [ ] Limit history depth (e.g., last 50 actions)

**Benefits**: Makes experimentation safer, reduces fear of making mistakes

**Technical Notes**:
- Store snapshots of canvas JS at each change
- Consider memory implications of storing many states
- Need to distinguish user actions vs AI actions in history

---

### 2. Drawing Tools & Customization

#### Color Picker
**Goal**: Let users choose drawing colors

- [ ] Add color picker UI element
- [ ] Store current color in state
- [ ] Apply color to new drawings
- [ ] Show current color indicator
- [ ] Remember recent colors

**Benefits**: More expressive human drawings, better visual variety

---

#### Drawing Tool Modes
**Goal**: Support different drawing primitives

- [ ] Freehand (current mode)
- [ ] Line (click-drag-click)
- [ ] Rectangle (click-drag)
- [ ] Circle (click-drag)
- [ ] Text (click to place, type to input)
- [ ] Eraser mode

**Benefits**: Faster creation of common shapes, cleaner diagrams

**Technical Notes**:
- Add toolbar with tool selection
- Each tool generates appropriate JS code
- Preview shape while dragging

---

#### Brush Settings
**Goal**: Customize drawing appearance

- [ ] Line width slider
- [ ] Opacity control
- [ ] Line cap/join style options
- [ ] Fill vs stroke toggle

**Benefits**: More control over visual style

---

### 3. Persistence & Sessions

#### Save/Load Canvas
**Goal**: Persist canvas across sessions

- [ ] Add "Save" button to export canvas JS
- [ ] Download as .js or .json file
- [ ] Add "Load" button to import saved canvas
- [ ] Store canvas in localStorage as backup
- [ ] Auto-save periodically

**Benefits**: Don't lose work, can return to previous canvases

**Technical Notes**:
- Include both JS code and metadata (dimensions, etc.)
- Consider version compatibility
- May want to save conversation history too

---

#### Canvas Gallery
**Goal**: Browse and manage saved canvases

- [ ] Database or file storage for canvases
- [ ] List view of saved canvases
- [ ] Thumbnail previews
- [ ] Search and filter
- [ ] Delete/rename canvases

**Benefits**: Easy access to previous work, build library of canvases

---

### 4. Communication Frames

#### Starter Templates
**Goal**: Provide pre-built canvas layouts for different use cases

Examples:
- **Brainstorming**: Areas for ideas, connections, themes
- **Planning**: Timeline, tasks, milestones
- **Concept Map**: Central topic with branches
- **Story Board**: Sequence of panels
- **Mind Map**: Hierarchical structure
- **Blank Canvas**: Current default

Implementation:
- [ ] Define template system (JSON + initial JS)
- [ ] Add template selector at start
- [ ] "New from template" menu option
- [ ] Allow saving custom templates

**Benefits**: Faster setup for common tasks, clearer structure

**Technical Notes**:
- Templates are initial canvas JS + layout guides
- May include helper functions or regions
- AI should understand template structure

---

### 5. Collaboration Features

#### Multi-user Support
**Goal**: Multiple humans collaborate with AI simultaneously

- [ ] WebSocket for real-time updates
- [ ] User cursors/indicators
- [ ] Presence awareness
- [ ] Conflict resolution for simultaneous edits
- [ ] User-specific drawing colors

**Benefits**: Team collaboration, shared exploration

**Technical Notes**:
- Significant architecture change
- Need session management
- Consider operational transforms or CRDTs for sync

---

#### Export/Share
**Goal**: Share canvases with others

- [ ] Export as image (PNG/SVG)
- [ ] Export as HTML (standalone page)
- [ ] Generate shareable link
- [ ] Embed in other pages
- [ ] Export conversation + canvas as PDF

**Benefits**: Present work to others, integrate into documents

---

### 6. AI Capabilities

#### Improved Visual Understanding
**Goal**: Help AI better understand and reference canvas content

- [ ] Add coordinate grid overlay (toggle)
- [ ] Named regions/zones on canvas
- [ ] Object labeling system
- [ ] Spatial relationship queries ("what's left of the circle?")

**Benefits**: More precise AI interactions with canvas

---

#### Tool Enhancements
**Goal**: Give AI more sophisticated drawing capabilities

- [ ] Add helper functions to tool (drawCircle, drawText, etc.)
- [ ] Support animation/tweening
- [ ] Layer management
- [ ] Group/transform operations

**Benefits**: AI can create more complex visuals more easily

---

### 7. Technical Improvements

#### Performance
- [ ] Optimize canvas rendering for large/complex canvases
- [ ] Lazy rendering (only render visible area)
- [ ] Canvas caching/layers
- [ ] Throttle server-side rendering

---

#### Error Handling
- [ ] Better error messages for invalid JS
- [ ] Validation before executing canvas code
- [ ] Sandboxing for safety
- [ ] Graceful degradation

---

#### Testing
- [ ] Unit tests for canvas rendering
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user flows
- [ ] Visual regression tests

---

### 8. User Experience

#### Onboarding
- [ ] Welcome tutorial/guide
- [ ] Interactive demo
- [ ] Example canvases to explore
- [ ] Tooltips and hints

---

#### UI Polish
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Responsive design for mobile
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Loading states and progress indicators
- [ ] Toast notifications for actions

---

#### Settings
- [ ] User preferences (auto-save, theme, etc.)
- [ ] Canvas defaults (size, background color)
- [ ] AI behavior settings (verbosity, tool usage)

---

## Prioritization

### High Priority (Next Steps)
1. **Undo/Redo** - Essential for usability
2. **Color Picker** - Quick win for expressiveness
3. **Save/Load** - Don't lose work
4. **Communication Frames** - Core to the vision

### Medium Priority
5. Pan and Zoom
6. Drawing Tool Modes
7. Export/Share
8. UI Polish

### Low Priority / Future
9. Multi-user Support
10. Advanced AI Tools
11. Gallery/Management

---

## Implementation Notes

When implementing enhancements:
- Maintain the JS-as-source-of-truth architecture
- Keep the dual representation (visual + code)
- Ensure AI can understand new features through context
- Test with AI to verify it can use new capabilities
- Update system prompt as needed
- Document changes in canvas JS comments

---

## Open Questions

- Should we support multiple canvases in one session?
- How to handle very large canvases (memory, API limits)?
- Should drawing tools generate more semantic JS vs raw commands?
- How to balance feature richness with simplicity?
- Should we add a layer/object model or stay purely code-based?

---

## Success Metrics

For each enhancement, consider:
- **Usability**: Does it make the canvas easier to use?
- **Expressiveness**: Does it enable new types of collaboration?
- **AI Integration**: Can the AI understand and use it?
- **Performance**: Does it maintain responsive interaction?
- **Simplicity**: Does it fit the minimalist aesthetic?

---

Last Updated: 2025-11-09

# Context Canvas - Future Enhancements

This document outlines potential enhancements and new features for Context Canvas now that the core functionality is complete.

## Status

**Core System**: ✅ COMPLETE (All 6 milestones)
- Bidirectional drawing (human + AI)
- Dual representation (visual + code)
- Real-time collaboration
- Server-side rendering for immediate AI feedback

---

## Enhancement Milestones

### Milestone 1: Pan and Zoom with Focus Context

#### Pan and Zoom
**Goal**: Allow users to navigate a larger canvas space

- [ ] Implement pan (drag to move viewport)
- [ ] Implement zoom (scroll or pinch to zoom in/out)
- [ ] Add minimap/overview in corner
- [ ] Preserve zoom/pan state across messages
- [ ] Update coordinate system to handle viewport transforms

#### Dual Context Sending
**Goal**: AI always sees full canvas + user's current focus area

- [ ] Always send complete rendered canvas screenshot
- [ ] Additionally send user's viewport/focus area as separate image
- [ ] Label focus image in message: "Current user focus area"
- [ ] Include viewport bounds in context (x, y, width, height, zoom)

**Benefits**: 
- AI maintains awareness of entire canvas
- AI understands what human is currently focusing on
- Enables "look at this" style interactions

**Technical Notes**:
- Two screenshots per message: full canvas + viewport crop
- Viewport metadata helps AI understand spatial relationships
- May need to limit full canvas size (scale down if too large)

---

### Milestone 2: Multi-Canvas Management

#### Canvas Persistence
**Goal**: All canvases auto-saved, easy switching between them

- [ ] Auto-save every canvas change to storage (localStorage or backend DB)
- [ ] Each canvas has unique ID and metadata (created date, last modified, thumbnail)
- [ ] Add top action bar to UI
- [ ] "Switch Canvas" button/dropdown in action bar
- [ ] Canvas picker UI (grid or list with thumbnails)
- [ ] "New Canvas" button (creates blank canvas)
- [ ] "Delete Canvas" button (removes current canvas)
- [ ] Default canvas created on first visit

**Important**: Chat context does NOT change when switching canvases - only the canvas being operated on changes

**Benefits**: 
- Never lose work (auto-save)
- Jump between different collaborative spaces
- Experiment freely, delete mistakes
- Build library of canvases over time

**Technical Notes**:
- Store canvas JS + metadata + thumbnail
- Canvas ID in URL or state
- Conversation history stays global (doesn't switch with canvas)
- Need confirmation before delete
- Consider soft delete (trash/archive)

**UI Layout**:
```
[Action Bar]
  [Canvas Picker ▼] [New Canvas] [Delete Canvas] [...other actions]
  
[Main Canvas Area]
[Chat Sidebar]
```

---

### Milestone 3: Communication Frame Starters

**Goal**: Provide pre-built canvas templates for different use cases

**Depends on**: Milestone 2 (Multi-Canvas Management)

- [ ] Define template system (JSON + initial JS)
- [ ] When creating new canvas, show template picker
- [ ] Default templates:
  - **Blank Canvas**: Empty white canvas
  - **Brainstorming**: Areas for ideas, connections, themes
  - **Planning**: Timeline, tasks, milestones sections
  - **Concept Map**: Central topic with branch areas
  - **Story Board**: Sequence of numbered panels
  - **Mind Map**: Hierarchical structure with center node

Implementation:
- [ ] Template selector in "New Canvas" flow
- [ ] Templates as JS files or JSON configs
- [ ] Include helper regions/guides in template JS
- [ ] Allow saving custom templates (future)

**Benefits**: 
- Faster setup for common tasks
- Clear structure guides collaboration
- AI understands template conventions

**Technical Notes**:
- Templates are initial canvas JS + optional metadata
- May include comments explaining regions
- AI should be informed of template type in context

---

### Milestone 4: Web Page Import Tool

#### New AI Tool: import_webpage
**Goal**: AI can bring external web content into the canvas

Tool Definition:
```json
{
  "name": "import_webpage",
  "description": "Import a screenshot of a webpage into the canvas at specified position",
  "parameters": {
    "url": "string (required) - URL of webpage to import",
    "x": "number (optional) - X coordinate for top-left corner",
    "y": "number (optional) - Y coordinate for top-left corner",
    "width": "number (optional) - Max width to scale image to",
    "caption": "string (optional) - Caption/label for the imported page"
  }
}
```

Implementation:
- [ ] Define import_webpage tool in API
- [ ] Backend: Use headless browser (puppeteer) to screenshot URL
- [ ] Convert screenshot to base64 data URI
- [ ] Generate canvas JS code to draw image on canvas:
  ```javascript
  // Imported webpage: [url]
  const img_[id] = new Image();
  img_[id].src = 'data:image/png;base64,[data]';
  img_[id].onload = () => {
    ctx.drawImage(img_[id], x, y, width, height);
  };
  ```
- [ ] Handle async image loading in canvas rendering
- [ ] Add image reference to canvas JS
- [ ] Safety: Validate URL, set timeout, limit image size
- [ ] Error handling: Invalid URL, timeout, too large

**Benefits**:
- AI can bring in reference material
- Visual research and analysis
- Multimodal context building
- "Show me this website" interactions

**Technical Notes**:
- Images embedded as data URIs in JS code
- May need image caching/storage for large images
- Consider max image size limits
- Puppeteer adds significant dependency

**Example Interaction**:
```
User: "Show me what the Anthropic homepage looks like"
AI: [uses import_webpage tool]
AI: "I've added a screenshot of the Anthropic homepage to the canvas."
```

---

### Milestone 5: Canvas Resizing

#### Expand Canvas Dimensions
**Goal**: Allow users to grow the canvas as they need more space

- [ ] Add "Resize Canvas" button to action bar
- [ ] Modal/dropdown with resize options:
  - 2x Width (double width, keep height)
  - 2x Height (keep width, double height)
  - 2x Both (double both dimensions)
  - Custom size input (advanced)
- [ ] When resizing:
  - Preserve all existing content (top-left anchored)
  - Update canvas element dimensions
  - Update stored canvas metadata
  - Re-render canvas with new size
- [ ] Show current canvas size in UI
- [ ] Confirm before resize (warn about large sizes)

**Benefits**:
- Start small, grow organically
- Don't run out of space
- Supports large, complex collaborations
- More efficient than starting with huge canvas

**Technical Notes**:
- Canvas content is top-left anchored (x=0, y=0 stays same)
- Existing JS code still works (coordinates unchanged)
- Need to update canvas.width and canvas.height
- May need to scale down for full-canvas screenshots if very large
- Consider maximum size limits (performance, memory, API tokens)

**Suggested Limits**:
- Starting size: 1600x900
- Max size: 6400x3600 (4x starting size)
- Allow doubling while under max

**UI**:
```
[Resize Canvas ▼]
  ├─ 2x Width (→ 3200x900)
  ├─ 2x Height (→ 1600x1800)
  ├─ 2x Both (→ 3200x1800)
  └─ Custom Size...
  
Current: 1600x900
```

---

## Removed / Deferred

### Not Implementing:
- ❌ Undo/Redo - Keep rolling forward, don't dwell on past
- ❌ Drawing tool enhancements (colors, shapes, brushes) - Basic drawing is sufficient
- ❌ Multi-user collaboration - Single user + AI is the focus
- ❌ Export/share features - Not needed yet
- ❌ AI capability enhancements - Current capabilities sufficient
- ❌ Technical improvements (testing, performance) - Polish later
- ❌ UI polish / onboarding - Keep it simple

---

## Implementation Order

### Phase 1: Single Canvas Enhancement
1. **Milestone 1**: Pan and Zoom with Focus Context (navigate canvas space)
2. **Milestone 5**: Canvas Resizing (allow organic growth)

### Phase 2: External Content
3. **Milestone 4**: Web Page Import Tool (bring in web content)

### Phase 3: Multi-Canvas Foundation
4. **Milestone 2**: Multi-Canvas Management (persistence, switching, deletion)
5. **Milestone 3**: Communication Frame Starters (depends on M2)

**Rationale**: Perfect the single-canvas experience first (navigation, resizing, importing content), then add multi-canvas management and templates once the core interaction is solid.

---

## Open Questions

**Multi-Canvas**:
- Should conversation history be per-canvas or global?
  - **Decision**: Global - chat context doesn't change, only canvas changes
- How to handle canvas thumbnails (generation, storage)?
- What metadata to store per canvas?
- Backend storage or localStorage for MVP?

**Pan/Zoom**:
- How to scale down large canvases for "full canvas" screenshot?
- Maximum canvas size before scaling?
- How to communicate viewport bounds to AI?

**Web Import**:
- Should we cache imported images separately or always embed?
- How to handle dynamic/interactive pages?
- Should AI be able to import multiple pages at once?
- Rate limiting for URL imports?

---

## Success Metrics

For each enhancement:
- **Usability**: Does it make collaboration more fluid?
- **Expressiveness**: Does it enable new types of interaction?
- **AI Integration**: Can the AI understand and use it naturally?
- **Simplicity**: Does it fit the minimalist aesthetic?
- **Forward Motion**: Does it support "keep rolling forward" philosophy?

---

Last Updated: 2025-11-09

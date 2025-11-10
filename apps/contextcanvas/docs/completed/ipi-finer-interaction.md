# IPI: Finer Canvas Interaction

**Status**: 🚧 In Progress (67% Complete)  
**Started**: November 9, 2025  
**Goal**: Give Claude more precise control over canvas content through better editing tools and spatial awareness

---

## Problem Statement

Currently, Claude can only **append** JavaScript to the canvas. This creates several limitations:

- **No iteration**: Can't fix mistakes or reorganize without rewriting everything
- **Accumulating bloat**: Canvas JS grows with every edit, even when replacing content
- **Poor refactoring**: Moving or modifying existing elements requires copying all code
- **Limited precision**: Can't guide user attention by controlling viewport

**User Impact**: Collaboration feels one-directional. Claude draws but can't truly edit, reorganize, or guide spatial navigation.

---

## Vision

Claude should be able to:
1. **Replace** canvas content (not just append)
2. **Edit** specific elements efficiently
3. **Control viewport** to direct user attention
4. **Navigate** the canvas spatially during conversation

This enables true collaborative iteration: "move that circle left", "zoom in on the chart", "let me show you this corner".

---

## Implementation Milestones

### Milestone 1: Canvas Replace Tool ✅ START HERE

**Goal**: Add `replace` mode to allow Claude to completely rewrite canvas JS

**Current State**:
- Tool: `update_canvas`
- Behavior: Always appends new JS code to existing canvas

**New State**:
- Tool renamed: `append_to_canvas` (explicit about behavior)
- New tool: `replace_canvas` (overwrites entire canvas JS)
- Both tools available to Claude

**Why Two Tools**:
- **Explicit intent**: Claude chooses append vs replace
- **Safety**: Append is additive (safe), replace is destructive (intentional)
- **Clear semantics**: Tool name = behavior

**MVP Scope - Accept Limitations**:
- For Milestone 1, `replace_canvas` will **lose imported images** (data URIs are redacted)
- This is acceptable for MVP - most use cases are drawing/text, not images
- Milestone 3 will fix this with placeholder restoration system
- Document the limitation clearly in tool description

**Implementation Tasks**:
- [ ] Rename `update_canvas` → `append_to_canvas` in tool definition
- [ ] Update system prompt to explain append behavior
- [ ] Create new `replace_canvas` tool definition
- [ ] Add tool handler on backend for replace mode
- [ ] Update frontend to handle complete JS replacement
- [ ] Add UI indicator when canvas is replaced (vs appended)
- [ ] Test: Claude can fix mistakes by replacing canvas
- [ ] Test: Claude can reorganize content by replacing

**Tool Definitions**:
```typescript
{
  name: 'append_to_canvas',
  description: 'Add new drawing commands to the existing canvas. The code you provide will be appended after all existing canvas code.',
  input_schema: {
    javascript_code: string,
    reason?: string  // Optional: explain what you're adding
  }
}

{
  name: 'replace_canvas',
  description: 'Replace the entire canvas with new code. This removes all existing content. Use this to reorganize, refactor, or fix mistakes. LIMITATION: This will lose any imported webpage images. If you need to preserve imported images, use append_to_canvas instead.',
  input_schema: {
    javascript_code: string,
    reason?: string  // Optional: explain what you're changing
  }
}
```

**Known Limitation - MVP**:
- Image data URIs are redacted in the JS shown to Claude (to save tokens)
- If Claude uses `replace_canvas`, any imported images will be **lost** unless Claude rewrites them
- For MVP: Accept this limitation. If user wants to keep images, they should use `append_to_canvas`
- **Milestone 3 will fix this** with placeholder restoration

**Success Metrics**:
- Claude can fix drawing mistakes without accumulating code
- Canvas JS stays clean (no redundant code)
- User can ask "change that to blue" and it works
- ⚠️ Known: Replacing canvas loses imported images (documented limitation)

---

### Milestone 2: Browser-Based Canvas Rendering

**Goal**: Replace node-canvas with real browser rendering for full JavaScript support

**Why This Matters**:
- **Full JS support**: Callbacks, promises, async/await work naturally
- **Fixes image limitation**: Images work properly with `onload` events
- **Simpler code**: Remove `if (image.complete)` workarounds
- **Enables future features**: Animations, DOM integration, Web APIs
- **Better fidelity**: Exactly matches browser rendering

**Current State**:
- Using node-canvas for server-side rendering
- Image `onload` doesn't fire naturally (need workarounds)
- Limited JavaScript API support
- Replace canvas loses imported images

**New State**:
- Use Playwright to render canvas in real browser
- Generate HTML page with canvas and user's JS
- Screenshot with same method as `import_webpage`
- Full browser environment available to canvas code

**Implementation Tasks**:
- [ ] Create HTML template for canvas rendering
- [ ] Update `renderCanvasOnServer` to use Playwright instead of node-canvas
- [ ] Launch browser, load HTML with canvas JS, screenshot
- [ ] Remove node-canvas dependency
- [ ] Remove `if (image.complete)` workaround from image import code
- [ ] Update tool descriptions (remove image limitation warnings)
- [ ] Test: Images work with replace_canvas
- [ ] Test: Async/callback code works in canvas

**Benefits**:
- ✅ Replace canvas now works with images (no placeholder system needed!)
- ✅ Canvas code can use full JavaScript features
- ✅ Simpler architecture (one rendering method)
- ✅ Opens door to interactive canvas apps

**Technical Approach**:
```typescript
// Generate HTML page
const html = `
<!DOCTYPE html>
<html>
<body>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ${canvasJS}
  </script>
</body>
</html>
`;

// Render with Playwright
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html);
await page.waitForTimeout(500); // Let images load
const screenshot = await page.screenshot();
await browser.close();
```

**Success Metrics**:
- Canvas renders identically to browser view
- Images work naturally in all scenarios
- No special-case code needed for image handling
- Canvas code can use modern JavaScript features

---

### Milestone 3: Viewport Control Tool

**Goal**: Let Claude control pan/zoom to guide user attention

**Why This Matters**:
- "Look at the top-right where I added the timeline"
- "Let me zoom in on this detail"
- "Here's an overview of everything"
- Guided tours of large canvases

**Implementation Tasks**:
- [ ] Create `set_viewport` tool definition
- [ ] Add tool handler to update viewport state
- [ ] Smooth animation for viewport transitions
- [ ] Update system prompt with spatial awareness guidance
- [ ] Show viewport indicator in UI when Claude moves it
- [ ] Test: Claude can guide attention to specific areas
- [ ] Test: Viewport changes are smooth and natural

**Tool Definition**:
```typescript
{
  name: 'set_viewport',
  description: 'Control the user\'s view of the canvas. Use this to direct attention to specific areas or zoom in/out for detail.',
  input_schema: {
    center_x: number,    // X coordinate to center on
    center_y: number,    // Y coordinate to center on
    scale: number,       // Zoom level: 0.1 (far out) to 5.0 (close up), 1.0 is default
    animate: boolean     // If true, smoothly transition. If false, jump instantly
  }
}
```

**Design Decisions**:
- Use **center** coordinates (not offset) - more intuitive for Claude
- Clamp scale to 0.1-5.0 range (prevent extreme zooms)
- Default `animate: true` for better UX
- Show subtle indicator when Claude controls viewport

**Success Metrics**:
- Claude naturally uses viewport to guide conversation
- User doesn't have to hunt for new additions
- Spatial dialogue feels natural ("over here", "zoom out")

---

### Milestone 4: User Canvas Rename

**Goal**: Allow users to rename canvases when the purpose changes

**Why This Matters**:
- Canvas purpose often evolves during collaboration
- "Brainstorm" becomes "Project Plan" as ideas solidify
- Clear naming helps organize multiple canvases
- User should control their canvas organization

**Implementation Tasks**:
- [ ] Add "Rename Canvas" button to canvas management UI
- [ ] Create rename modal/prompt
- [ ] Update canvas metadata (name + modified timestamp)
- [ ] Refresh canvas picker dropdown with new name
- [ ] Save to localStorage
- [ ] Test: Rename canvas and verify it persists

**UI Approach**:
```
[Canvas Picker ▼] [+ New] [Rename] [Delete]
```

**Success Metrics**:
- Users can rename any canvas easily
- New name shows immediately in picker
- Rename persists across page refresh
- Simple, quick interaction (inline edit or modal)

---

### Milestone 5: Selective Element Editing

**Goal**: Edit specific parts of canvas without rewriting everything

**Why This Matters**:
- More efficient token usage
- Faster iterations
- Clearer change tracking
- Better for large canvases

**Approach**: Comment-based element markers

**Example Canvas JS**:
```javascript
// Clear background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// ELEMENT: timeline
ctx.fillStyle = '#2196f3';
ctx.fillRect(20, 20, 800, 100);
// END ELEMENT: timeline

// ELEMENT: notes
ctx.fillStyle = '#ff9800';
ctx.fillRect(20, 140, 800, 200);
// END ELEMENT: notes
```

**Implementation Tasks**:
- [ ] Define element marker syntax
- [ ] Create `update_element` tool
- [ ] Add parser to extract/replace elements
- [ ] Update system prompt with element guidance
- [ ] Show which elements changed in UI
- [ ] Test: Claude can update single element
- [ ] Test: Multiple elements can be updated independently

**Tool Definition**:
```typescript
{
  name: 'update_element',
  description: 'Update a specific named element on the canvas without rewriting everything. Elements are marked with comments like // ELEMENT: name',
  input_schema: {
    element_name: string,        // Name of element to update
    javascript_code: string,     // New code for this element
    create_if_missing: boolean   // If true, add element if it doesn't exist
  }
}
```

**Success Metrics**:
- Can update single element without touching others
- Token usage reduced for iterative edits
- Canvas JS remains organized and readable

---

### Milestone 6: AI Canvas Rename Tool

**Goal**: Let Claude suggest canvas name updates based on content

**Why This Matters**:
- Claude can see when canvas purpose has shifted
- Proactive naming based on what's actually on the canvas
- "I see you're building a timeline now - should we rename this to 'Project Timeline'?"
- Helps keep canvas organization meaningful

**Implementation Tasks**:
- [ ] Create `rename_canvas` tool definition
- [ ] Add tool handler to update canvas metadata
- [ ] Show rename notification in chat UI
- [ ] Update canvas picker with new name
- [ ] Update system prompt explaining when to suggest renames
- [ ] Test: Claude suggests rename when content shifts
- [ ] Test: User can accept/reject rename suggestions

**Tool Definition**:
```typescript
{
  name: 'rename_canvas',
  description: 'Suggest a new name for the current canvas based on its content. Use this when the canvas purpose has clearly evolved beyond its original name.',
  input_schema: {
    new_name: string,           // Proposed new name for the canvas
    reason?: string             // Optional: explain why this name fits better
  }
}
```

**System Prompt Guidance**:
- Only suggest renames when canvas content clearly diverges from name
- Be thoughtful about disrupting user's organization
- Explain reasoning briefly when suggesting rename
- Don't rename too frequently

**Success Metrics**:
- Claude suggests meaningful, contextually appropriate names
- Renames happen at natural transition points
- User can easily accept or revert if needed
- Helps keep canvas library well-organized

---

## Open Questions

1. **Should we show a diff when canvas is replaced?**
   - **Decision**: No. Keep it simple - just show "Canvas replaced" message in chat

2. **How to handle viewport control during active editing?**
   - **Decision**: Queue viewport changes, apply after Claude's full response completes
   - This prevents jarring mid-edit viewport jumps
   - User sees final state after all rendering is done

3. **Element naming conventions?**
   - **Decision**: Lead by example in starter JS/templates
   - Let Claude choose names naturally
   - No enforcement - Claude decides what makes sense

4. **Should there be a canvas history/undo?**
   - **Decision**: Out of scope for this IPI
   - Consider for future enhancement

---

## Success Criteria

**This IPI is successful when:**
- ✅ **ACHIEVED**: Claude can iterate on canvas content naturally (fix, reorganize, refine) - `replace_canvas` and `update_element` tools
- ✅ **ACHIEVED**: Token usage is efficient (no redundant code accumulation) - `update_element` updates only specific parts
- ⏳ **PARTIAL**: Claude can guide user attention spatially - Viewport control not yet implemented
- ✅ **ACHIEVED**: Collaboration feels bi-directional and fluid - Replace, update, and user rename capabilities
- ✅ **ACHIEVED**: Large canvases remain manageable - Element-based editing keeps things organized

**User Feedback to Validate**:
- "Claude fixed the mistake without me asking" ✅ Possible with replace_canvas
- "I love how Claude shows me around the canvas" ⏳ Awaiting viewport control
- "Editing feels natural now, not just additive" ✅ Multiple editing modes available

---

## Timeline

- **Week 1**: Milestone 1 (Canvas Replace Tool - MVP) ✅ COMPLETE
- **Week 2**: Milestone 2 (Browser-Based Rendering) ✅ COMPLETE
- **Week 3**: Milestone 3 (Viewport Control) - Not started
- **Week 4**: Milestone 4 (User Canvas Rename) ✅ COMPLETE
- **Week 5**: Milestone 5 (Element Editing) ✅ COMPLETE
- **Week 6**: Milestone 6 (AI Canvas Rename) - Not started

**Completed**: 4/6 milestones (67%)  
**Remaining**: Viewport Control, AI Canvas Rename

**Note**: Milestone 2 eliminates the need for image placeholder system - browser rendering handles images naturally!

---

## Related Work

- ✅ Completed: Multi-canvas management (switching contexts)
- ✅ Completed: Canvas templates (starting structures)
- ✅ Completed: Web page imports (external content)
- 🔜 Future: Undo/redo system
- 🔜 Future: Collaborative cursors (multi-user)

---

## Notes

- Keep both append and replace tools available (explicit choice)
- Browser-based rendering unlocks full JavaScript capabilities
- Viewport control enables new interaction patterns
- Element-based editing is powerful but adds complexity
- No need for image placeholder system with browser rendering

**Key Insight**: The shift from "append-only" to "editable canvas" fundamentally changes the collaboration dynamic. Claude becomes a true editing partner, not just an additive assistant. Browser-based rendering makes the canvas a true JavaScript runtime environment.

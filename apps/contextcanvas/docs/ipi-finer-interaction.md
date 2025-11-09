# IPI: Finer Canvas Interaction

**Status**: 🚧 In Progress  
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
  description: 'Replace the entire canvas with new code. This removes all existing content. Use this to reorganize, refactor, or fix mistakes. IMPORTANT: Image data from imported webpages is shown as [REDACTED_IMAGE_DATA] - if you want to keep an image, you must include the full data URI from the original code (not visible in context).',
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

### Milestone 2: Viewport Control Tool

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

### Milestone 3: Image Data Placeholder System

**Goal**: Allow Claude to replace canvas while preserving imported images

**The Problem**:
- Image data URIs are **huge** (100k+ tokens each)
- We redact them in JS sent to Claude: `data:image/jpeg;base64,[REDACTED_IMAGE_DATA]`
- When Claude uses `replace_canvas`, it can't include the real image data (not in context)
- Result: Imported images are lost on replace

**The Solution**: Unique placeholder tokens + restoration

**How It Works**:
1. **Extract & Tag**: When sending JS to Claude, replace each image data URI with unique token
   ```javascript
   // Before (sent to backend):
   img_abc123.src = 'data:image/jpeg;base64,/9j/4AAQ...[500KB]...';
   
   // After (sent to Claude):
   img_abc123.src = '%%IMAGE_DATA:img_abc123%%';
   ```

2. **Claude Edits**: Claude sees placeholder, can include it in replace code
   ```javascript
   // Claude's replacement code:
   const img_abc123 = new Image();
   img_abc123.src = '%%IMAGE_DATA:img_abc123%%';  // Keeps placeholder
   img_abc123.onload = () => ctx.drawImage(img_abc123, 50, 50);  // New position!
   ```

3. **Restore**: Backend restores real data URIs before executing
   ```javascript
   // Backend restores before execution:
   img_abc123.src = 'data:image/jpeg;base64,/9j/4AAQ...[500KB]...';
   ```

**Implementation Tasks**:
- [ ] Create placeholder extraction function (unique IDs per image)
- [ ] Store image ID → data URI mapping during redaction
- [ ] Update `replace_canvas` tool to restore placeholders
- [ ] Handle edge cases (image deleted, image duplicated)
- [ ] Update system prompt to explain placeholder usage
- [ ] Test: Replace canvas while keeping image
- [ ] Test: Replace canvas while moving image
- [ ] Test: Replace canvas while deleting image

**Placeholder Format**:
```
%%IMAGE_DATA:<image_variable_name>%%
```
- Easy to parse with regex
- Unlikely to appear in real code
- Preserves variable name for clarity

**Success Metrics**:
- Claude can replace canvas without losing images
- Images can be repositioned during replace
- Image data never sent to Claude (token savings maintained)

---

### Milestone 4: Selective Element Editing

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

### Milestone 5: Spatial Query Tool

**Goal**: Let Claude query canvas state and element positions

**Why This Matters**:
- Claude can reason about spatial relationships
- "Is there room on the left?"
- "What's at coordinate (100, 200)?"
- Better placement decisions

**Implementation Tasks**:
- [ ] Create `query_canvas` tool
- [ ] Add spatial analysis on backend
- [ ] Return element positions, bounds, free space
- [ ] Test: Claude can find free space
- [ ] Test: Claude avoids overlapping existing content

**Tool Definition**:
```typescript
{
  name: 'query_canvas',
  description: 'Get information about the current canvas state, elements, and available space.',
  input_schema: {
    query_type: 'elements' | 'free_space' | 'bounds',
    region?: {x: number, y: number, width: number, height: number}
  }
}
```

**Returns**:
```typescript
{
  elements: [{name: string, bounds: {x, y, width, height}}],
  free_regions: [{x, y, width, height}],
  canvas_bounds: {width, height},
  viewport: {x, y, scale}
}
```

**Success Metrics**:
- Claude intelligently places new content in free space
- Fewer overlapping elements
- Better spatial organization

---

## Open Questions

1. **Should we show a diff when canvas is replaced?**
   - Pro: User sees what changed
   - Con: Adds UI complexity
   - Decision: Start simple (just show "Canvas replaced"), add diff later if needed

2. **How to handle viewport control during active editing?**
   - Lock viewport during tool execution?
   - Allow Claude to move viewport mid-edit?
   - Decision: Allow at any time, but queue updates until rendering complete

3. **Element naming conventions?**
   - Enforce unique names?
   - Auto-generate names?
   - Decision: Suggest naming convention, don't enforce (Claude can decide)

4. **Should there be a canvas history/undo?**
   - Out of scope for this IPI
   - Consider for future enhancement

---

## Success Criteria

**This IPI is successful when:**
- ✅ Claude can iterate on canvas content naturally (fix, reorganize, refine)
- ✅ Token usage is efficient (no redundant code accumulation)
- ✅ Claude can guide user attention spatially
- ✅ Collaboration feels bi-directional and fluid
- ✅ Large canvases remain manageable

**User Feedback to Validate**:
- "Claude fixed the mistake without me asking"
- "I love how Claude shows me around the canvas"
- "Editing feels natural now, not just additive"

---

## Timeline

- **Week 1**: Milestone 1 (Canvas Replace Tool - MVP with image limitation)
- **Week 2**: Milestone 2 (Viewport Control)
- **Week 3**: Milestone 3 (Image Placeholder System - fixes replace limitation)
- **Week 4**: Milestone 4 (Element Editing)
- **Week 5**: Milestone 5 (Spatial Queries) + Polish

**Estimated Total**: 5 weeks

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
- Viewport control enables new interaction patterns
- Element-based editing is powerful but adds complexity
- Spatial queries might be overkill - evaluate after M2

**Key Insight**: The shift from "append-only" to "editable canvas" fundamentally changes the collaboration dynamic. Claude becomes a true editing partner, not just an additive assistant.

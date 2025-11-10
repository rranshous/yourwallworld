# SSE Implementation Plan

**Date**: November 10, 2025  
**Goal**: Convert Context Canvas from blocking HTTP to Server-Sent Events (SSE) for real-time streaming

---

## Current Architecture Analysis

### Blocking HTTP Flow
1. **Client** sends POST to `/api/chat` with:
   - User message
   - Full canvas screenshot (base64 PNG)
   - Viewport screenshot (base64 PNG)
   - Canvas JavaScript code
   - Canvas metadata (name, template, dimensions)
   - Viewport state (offsetX, offsetY, scale)

2. **Server** processes in loop:
   - Calls Claude API with canvas context
   - Waits for complete response
   - Processes ALL tool uses (append/replace/update_element/import_webpage)
   - Renders canvas after EACH tool use
   - Loops back to Claude with updated canvas until no more tool uses
   - Returns final response with all tool uses

3. **Client** receives:
   - Final text response
   - Updated canvas JS
   - Array of tool uses with metadata
   - Token usage

### Features That Must Work

**Tool Types:**
- ✅ `append_to_canvas` - Add drawing commands
- ✅ `replace_canvas` - Overwrite entire canvas
- ✅ `update_element` - Update specific named elements
- ✅ `import_webpage` - Screenshot and import URLs

**Canvas Management:**
- ✅ Multi-canvas switching
- ✅ Canvas templates (blank, brainstorm, planning, concept map)
- ✅ User rename functionality
- ✅ Create/delete canvases
- ✅ localStorage persistence

**Viewport:**
- ✅ Pan and zoom controls
- ✅ Viewport screenshot sent to Claude
- ✅ Reset view button

**UI Features:**
- ✅ Chat sidebar with message history
- ✅ Canvas rendering area
- ✅ Debug panel with JS viewer
- ✅ Tool use indicators in chat
- ✅ Token usage counter
- ✅ Resize canvas modal
- ✅ **User drawing with mouse** (freehand paths)
- ✅ **Drawing generates JavaScript code** (added to canvasJS)

**Error Handling:**
- ✅ Canvas rendering errors shown on canvas
- ✅ Tool use errors reported
- ✅ 504 timeout handling (external infrastructure)

---

## SSE Streaming Design

### New Flow

**Server → Client Event Types:**

1. **`tool_use`** - Claude is using a tool
   ```json
   {
     "type": "append|replace|update_element|import_webpage",
     "toolId": "tool_xyz",
     "elementName": "timeline",  // for update_element
     "url": "https://...",        // for import_webpage
     "canvasJS": "..."            // updated canvas code
   }
   ```

2. **`canvas_update`** - Canvas has been rendered
   ```json
   {
     "canvasJS": "...",
     "screenshot": "data:image/png;base64,..."
   }
   ```

3. **`message`** - Claude's text response
   ```json
   {
     "text": "Here's what I drew..."
   }
   ```

4. **`usage`** - Token usage info
   ```json
   {
     "usage": {
       "input_tokens": 1000,
       "output_tokens": 500
     }
   }
   ```

5. **`tool_error`** - Tool execution failed
   ```json
   {
     "type": "update_element_error",
     "toolId": "tool_xyz",
     "elementName": "timeline",
     "error": "Element not found"
   }
   ```

6. **`error`** - Fatal error
   ```json
   {
     "error": "Failed to process",
     "details": "..."
   }
   ```

7. **`done`** - Stream complete
   ```json
   {
     "canvasJS": "...",
     "usage": {...}
   }
   ```

### Server Implementation

**New Endpoint: `/api/chat-stream`**

```typescript
app.post('/api/chat-stream', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  try {
    // Same tool loop as before BUT:
    // - Stream tool_use event BEFORE processing
    // - Stream canvas_update AFTER rendering
    // - Stream message at end
    // - Stream done when complete
    
    // Tool loop...
    for (const toolUse of toolUseBlocks) {
      // 1. Stream tool use notification
      sendEvent('tool_use', { type, toolId, ... });
      
      // 2. Process tool (append/replace/etc)
      currentCanvasJS = ...;
      
      // 3. Render canvas
      screenshot = await renderCanvasOnServer(...);
      
      // 4. Stream canvas update
      sendEvent('canvas_update', { canvasJS, screenshot });
    }
    
    // 5. Stream final message
    sendEvent('message', { text });
    sendEvent('usage', { usage });
    sendEvent('done', {});
    
    res.end();
  } catch (error) {
    sendEvent('error', { error, details });
    res.end();
  }
});
```

### Client Implementation

**Replace `fetch()` with `EventSource`**

```javascript
async function sendMessage(message) {
  // Prepare canvas context (same as before)
  const canvasData = {
    message,
    fullCanvasScreenshot: await captureFullCanvas(),
    viewportScreenshot: captureViewport(),
    canvasJS,
    canvasName,
    canvasTemplate,
    canvasDimensions,
    viewport
  };
  
  // Can't use GET with EventSource, so still POST but stream response
  // Use fetch to initiate, then read stream
  const response = await fetch('/api/chat-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(canvasData)
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // Parse SSE events from buffer
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line
    
    let currentEvent = null;
    
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.substring(7);
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        handleStreamEvent(currentEvent, data);
        currentEvent = null;
      }
    }
  }
}

function handleStreamEvent(event, data) {
  switch (event) {
    case 'tool_use':
      // Show "🔧 Using tool..." in chat
      addMessage('system', getToolMessage(data.type, data));
      break;
      
    case 'canvas_update':
      // Update canvas immediately
      setCanvasJS(data.canvasJS);
      // Screenshot is available but client re-renders anyway
      break;
      
    case 'message':
      // Show Claude's response
      addMessage('assistant', data.text);
      break;
      
    case 'usage':
      updateContextCounter(data.usage);
      break;
      
    case 'tool_error':
      addMessage('system', `❌ ${data.error}`);
      break;
      
    case 'error':
      addMessage('system', `Error: ${data.details}`);
      break;
      
    case 'done':
      // Clean up, enable input
      break;
  }
}
```

---

## Benefits of SSE

1. **Real-time Progress**: User sees each tool use as it happens
2. **No 504 Timeouts**: Codespaces proxy won't timeout because events stream continuously
3. **Better UX**: "Claude is drawing..." instead of frozen UI
4. **Cancellation**: User could cancel mid-stream (future)
5. **Efficiency**: Same data transfer, but spread over time

---

## Migration Strategy

### Phase 1: Add SSE Endpoint (Parallel)
- Keep `/api/chat` working
- Add `/api/chat-stream` alongside
- Both endpoints coexist

### Phase 2: Update Client (Feature Flag)
- Add `USE_STREAMING` constant
- If true, use SSE; if false, use old fetch
- Test both modes

### Phase 3: Switch Default
- Make `USE_STREAMING = true` default
- Keep old endpoint for fallback

### Phase 4: Remove Old (Later)
- After SSE is proven stable
- Remove `/api/chat` endpoint

---

## Testing Checklist

- [ ] Basic drawing (append tool)
- [ ] Replace canvas works
- [ ] Update element works
- [ ] Import webpage streams correctly
- [ ] Multiple tool uses in sequence
- [ ] Error handling (bad URL, missing element)
- [ ] Canvas switching mid-stream (should complete/cancel)
- [ ] Multiple canvases
- [ ] Templates work
- [ ] Rename persists
- [ ] Viewport state maintained
- [ ] Token counter updates
- [ ] Chat history preserved
- [ ] Debug panel shows correct JS
- [ ] **User drawing disabled during streaming**
- [ ] **User drawing works after streaming completes**
- [ ] **Resize disabled during streaming**
- [ ] **Input field disabled during streaming**

---

## Known Limitations

1. **EventSource POST workaround**: Need to use fetch + ReadableStream instead of native EventSource
2. **Connection management**: Need to handle reconnection if stream drops
3. **Cancellation**: Not implemented initially (future enhancement)
4. **Progress indicators**: Need to show "Claude is thinking..." state
5. **User interactions during streaming**: 
   - User drawing should be disabled while stream is active
   - Canvas switching should complete/cancel current stream
   - Resize should be disabled during streaming

---

## Implementation Status

- [x] Architecture analysis complete
- [ ] Server SSE endpoint
- [ ] Client streaming handler
- [ ] Event parsing
- [ ] UI updates
- [ ] Error handling
- [ ] Testing
- [ ] Documentation

---

## Next Steps

1. Implement server SSE endpoint
2. Test with curl/postman
3. Implement client streaming
4. Test all features
5. Polish UI for streaming UX
6. Deploy and monitor

---

## Code Locations

**Server:**
- `/apps/contextcanvas/src/server.ts` - Add streaming endpoint after line 705

**Client:**
- `/apps/contextcanvas/public/client.js` - Replace `sendMessage()` function around line 290

**Key Functions to Preserve:**
- `renderCanvasOnServer()` - Canvas rendering
- `updateElement()` - Element-based editing
- `screenshotWebpage()` - Webpage import
- `redactDataURIs()` - Token efficiency
- All canvas management functions

---

## Success Criteria

✅ User sees tool uses happen in real-time  
✅ No 504 timeouts on long responses  
✅ All existing features work identically  
✅ Canvas updates appear progressively  
✅ Error messages stream properly  
✅ UI remains responsive throughout  

---

**Ready to implement!** 🚀

# Future Enhancements

**Status**: 📋 Documented for future work  
**Date**: November 10, 2025

---

## High-Priority Improvements

### 1. Server-Sent Events (SSE) for Streaming Responses

**Problem**: 
- Currently using blocking HTTP POST to `/api/chat`
- UI freezes while waiting for complete Claude response
- Long responses (multi-tool-use) can take 2-5+ minutes
- GitHub Codespaces proxy timeout (504) on requests >2 minutes
- User has no feedback during processing

**Solution**: Replace blocking HTTP with SSE streaming

**Benefits**:
- Real-time progress updates as Claude generates response
- Show tool uses as they happen: "🔧 Claude is drawing..." "🌐 Importing webpage..."
- No UI freeze - user sees activity
- Better UX for long responses
- Reduces perceived wait time
- Can handle responses that exceed proxy timeouts

**Implementation**:
```javascript
// Client - use EventSource instead of fetch
const eventSource = new EventSource('/api/chat-stream');
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'tool_use') {
        addMessage('system', `🔧 Using tool: ${data.toolName}`);
    } else if (data.type === 'canvas_update') {
        setCanvasJS(data.canvasJS);
    } else if (data.type === 'message') {
        addMessage('assistant', data.text);
    }
};

// Server - stream events instead of single response
app.post('/api/chat-stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send progress events as work happens
    res.write(`data: ${JSON.stringify({type: 'tool_use', toolName: 'append_to_canvas'})}\n\n`);
    
    // ... process and stream ...
    
    res.write(`data: ${JSON.stringify({type: 'complete'})}\n\n`);
    res.end();
});
```

**Complexity**: Medium
- Requires refactoring request/response flow
- Need to handle SSE connection lifecycle
- Must send incremental updates during Claude's response
- Error handling for dropped connections

**Priority**: High - Significantly improves UX for long responses

---

### 2. Sandbox/Isolate Animation Loops

**Problem**:
- Canvas JS executes via `eval()` in global scope
- Animation loops (`requestAnimationFrame`) continue running after canvas switch
- Multiple canvases with animations interfere with each other
- UI becomes unresponsive with stuck animations
- No way to stop animation loops when switching canvases

**Current Workaround**: User must reload page to stop stuck animations

**Solution**: Augment JS eval environment with proper isolation

**Approach Options**:

**Option A: iframe Sandbox** (Recommended)
```javascript
// Render canvas in isolated iframe
const iframe = document.createElement('iframe');
iframe.sandbox = 'allow-scripts';
iframe.srcdoc = `
<!DOCTYPE html>
<html>
<body>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ${canvasJS}
  </script>
</body>
</html>
`;

// Destroy iframe when switching canvases
function switchCanvas() {
    if (currentIframe) {
        currentIframe.remove(); // Kills all animations
    }
    currentIframe = createNewIframe();
}
```

**Benefits**:
- Complete isolation - animations can't escape
- Easy to destroy and recreate
- Browser handles cleanup automatically
- No manual animation tracking needed

**Drawbacks**:
- Adds complexity to rendering
- Need to handle iframe communication
- May affect performance slightly

**Option B: Track Animation IDs**
```javascript
const animationIds = new Set();

// Wrap requestAnimationFrame
const originalRAF = window.requestAnimationFrame;
window.requestAnimationFrame = (callback) => {
    const id = originalRAF(callback);
    animationIds.add(id);
    return id;
};

// Cancel all when switching
function switchCanvas() {
    animationIds.forEach(id => cancelAnimationFrame(id));
    animationIds.clear();
}
```

**Benefits**:
- Less complex than iframe
- Direct control over animation lifecycle

**Drawbacks**:
- Must track all animation IDs
- User code could bypass wrapper
- Doesn't handle setTimeout/setInterval
- Not foolproof isolation

**Option C: Worker-based Execution** (Advanced)
- Execute canvas code in Web Worker
- Use OffscreenCanvas API
- Complete isolation from main thread

**Benefits**:
- Best isolation
- Doesn't block UI thread
- Can terminate worker cleanly

**Drawbacks**:
- OffscreenCanvas API not universally supported
- Significant refactoring required
- More complex debugging

**Recommended**: **Option A (iframe sandbox)** - Best balance of isolation and simplicity

**Complexity**: Medium-High
- Requires refactoring canvas rendering
- Need to handle iframe lifecycle
- Must preserve existing functionality (zoom, pan, etc.)

**Priority**: Medium - Important for interactive canvas apps, but workaround exists (reload page)

---

## Implementation Order

1. **SSE Streaming** (High priority, better UX)
2. **Animation Isolation** (Medium priority, enables interactive apps)

Both would significantly improve the canvas experience for complex, interactive use cases.

---

## Related Issues

- GitHub Codespaces 504 timeout workaround → SSE would help
- Canvas switching stuck on animations → Isolation would fix
- User feedback during long operations → SSE provides this

---

## Notes

- SSE is more critical for current pain points (long waits, timeouts)
- Animation isolation is important for future interactive canvas apps
- Both are medium complexity - should be planned separately
- Consider these for next major version or when time permits

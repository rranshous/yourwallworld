# IPI: Context Import Tools

**Status**: 🎯 Planning  
**Started**: November 10, 2025  
**Goal**: Give Claude more ways to bring external context into the canvas for richer collaboration

---

## Problem Statement

Currently, Claude can only import **web pages**. This limits the types of context that can be brought into the collaborative space:

- **No file uploads**: Can't work with user's local documents, images, PDFs
- **No saves**: Can't export canvas state back to user's computer
- **No live inputs**: Can't capture webcam, microphone, screen
- **Limited media**: Only static screenshots of web content

**User Impact**: Canvas feels isolated from the user's local environment and real-world context.

---

## Vision

Claude should be able to:
1. **Import local files** (images, documents, data)
2. **Export canvas** to user's computer
3. **Capture live media** (webcam, screen share)
4. **Work with clipboard** content
5. **Access file system** (with permission) for richer workflows

This enables scenarios like: "Let's review this PDF", "Can you sketch over my webcam feed?", "Export this as PNG", "Use the image I just copied".

---

## Implementation Ideas

### Idea 1: File Upload Tool 📁

**What it enables:**
- "Import this image and annotate it"
- "Let's review this PDF together"
- "Here's my data file, visualize it on the canvas"

**User Flow:**
1. Claude asks: "Would you like to upload a file?"
2. Tool triggers file picker on client
3. User selects file
4. File is converted to data URI (or uploaded)
5. Claude receives file and can import it to canvas

**Technical Approach:**

**Option A: Direct File Picker** (Simple)
```javascript
// Claude triggers file picker
{
  name: 'request_file_upload',
  description: 'Ask user to upload a file (image, PDF, etc.) to bring into canvas',
  input_schema: {
    file_types: string[],  // ['image/*', 'application/pdf']
    reason: string         // "I'd like to annotate your image"
  }
}

// Client shows file picker
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    const dataUrl = await fileToDataUrl(file);
    // Send back to Claude
};
```

**Option B: File System Access API** (Advanced)
```javascript
// Claude can browse user's files (with permission)
const dirHandle = await window.showDirectoryPicker();
// Read files, show thumbnails, etc.
```

**Considerations:**
- Security: User must explicitly choose files
- Size limits: Large files need compression/chunking
- File types: Images (easy), PDFs (need rendering), others?

---

### Idea 2: Export Canvas Tool 💾

**What it enables:**
- "Save this canvas as a PNG"
- "Export the current view"
- "Download this drawing"

**User Flow:**
1. Claude: "I'll export this for you"
2. Tool captures canvas as PNG/PDF
3. Browser triggers download
4. File saved to user's Downloads folder

**Technical Approach:**
```javascript
{
  name: 'export_canvas',
  description: 'Export the current canvas as an image file that downloads to user\'s computer',
  input_schema: {
    format: 'png' | 'jpeg' | 'pdf',
    filename: string,
    quality?: number  // For JPEG
  }
}

// Implementation
function exportCanvas(format, filename) {
    const dataUrl = canvas.toDataURL(`image/${format}`);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}
```

**Advanced: PDF Export**
- Use jsPDF library
- Multi-page if canvas is large
- Include metadata

---

### Idea 3: Webcam Capture Tool 📷

**What it enables:**
- "Let me sketch over your webcam feed"
- "Show me what you're holding, I'll annotate it"
- "Capture a frame and we'll work with it"
- AR-style drawing on live camera feed

**User Flow:**
1. Claude: "Can I access your webcam?"
2. Browser requests camera permission
3. Live feed shows in canvas background
4. Claude can draw over it
5. Optionally capture still frame

**Technical Approach:**
```javascript
{
  name: 'request_webcam',
  description: 'Request access to user\'s webcam. Can show live feed or capture still images.',
  input_schema: {
    mode: 'live' | 'capture',  // Live feed or single frame
    reason: string
  }
}

// Implementation
async function startWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    // Draw video to canvas continuously
    function drawFrame() {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
    }
    drawFrame();
}

// Capture still frame
function captureFrame() {
    const imageData = canvas.toDataURL('image/jpeg');
    return imageData;
}
```

**Exciting Use Cases:**
- Virtual whiteboard with user
- AR annotations
- "Show me the physical object"
- Interactive tutorials
- Gesture recognition (future)

---

### Idea 4: Screen Share Tool 🖥️

**What it enables:**
- "Share your screen and I'll help debug"
- "Let's review this app together"
- "Annotate over your screen"

**Similar to webcam but captures screen:**
```javascript
const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
```

---

### Idea 5: Clipboard Tool 📋

**What it enables:**
- "Paste that image you copied"
- "Let's work with the screenshot you took"
- "Copy this canvas section"

**Technical Approach:**
```javascript
{
  name: 'paste_from_clipboard',
  description: 'Import image or text from user\'s clipboard',
  input_schema: {}
}

// Implementation
async function pasteFromClipboard() {
    const items = await navigator.clipboard.read();
    for (const item of items) {
        if (item.types.includes('image/png')) {
            const blob = await item.getType('image/png');
            const url = URL.createObjectURL(blob);
            // Load to canvas
        }
    }
}

// Copy to clipboard
async function copyCanvasToClipboard() {
    canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
    });
}
```

---

### Idea 6: File System Access (Persistent Files) 📂

**What it enables:**
- "Browse your project folder"
- "Save/load canvas states"
- "Work with multiple files"

**HTML5 File System Access API:**
```javascript
// Open directory picker
const dirHandle = await window.showDirectoryPicker();

// Read files
for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
        const file = await entry.getFile();
        // Process file
    }
}

// Write files back
const fileHandle = await dirHandle.getFileHandle('drawing.png', { create: true });
const writable = await fileHandle.createWritable();
await writable.write(blob);
await writable.close();
```

**Not widely supported yet** but could be a "progressive enhancement"

---

## Priority Ranking

**High Priority** (Implement Soon):
1. 📁 **File Upload** - Most requested, simple to implement
2. 💾 **Export Canvas** - Essential utility, easy win
3. 📋 **Clipboard** - Natural workflow, good UX

**Medium Priority** (Nice to Have):
4. 📷 **Webcam** - Cool demos, specific use cases
5. 🖥️ **Screen Share** - Debugging/review scenarios

**Low Priority** (Future/Advanced):
6. 📂 **File System Access** - Limited browser support, complex

---

## Implementation Phases

### Phase 1: File I/O Basics
- File upload tool
- Export canvas tool
- Basic clipboard support

### Phase 2: Live Media
- Webcam capture (still frames first)
- Screen share
- Live video feed drawing

### Phase 3: Advanced
- File system access
- Multi-file workflows
- Persistent storage

---

## Technical Considerations

### Security & Permissions
- All require **user consent** (browser handles this)
- File uploads: User explicitly chooses
- Webcam/screen: Browser permission prompt
- Clipboard: Requires user gesture (click/paste)

### Size Limits
- Images: Compress to reasonable size
- Videos: Short clips only
- Files: Limit to 10MB?

### Browser Support
- File API: ✅ Universal
- Webcam: ✅ Modern browsers
- Clipboard: ✅ Modern browsers (with gesture)
- File System Access: ⚠️ Chrome/Edge only

### Privacy
- Don't send media to Claude automatically
- User controls what gets shared
- Clear consent messages

---

## Tool Definitions (Draft)

### 1. request_file_upload
```typescript
{
  name: 'request_file_upload',
  description: 'Ask user to select a file from their computer to import into the canvas',
  input_schema: {
    accept: string,     // MIME types: 'image/*', 'application/pdf'
    reason: string,     // Why you need this file
    multiple: boolean   // Allow multiple files?
  }
}
```

### 2. export_canvas
```typescript
{
  name: 'export_canvas',
  description: 'Download the current canvas as an image file to user\'s computer',
  input_schema: {
    filename: string,   // e.g., 'my-drawing.png'
    format: 'png' | 'jpeg' | 'pdf',
    full_canvas: boolean  // Export full canvas or just viewport?
  }
}
```

### 3. request_webcam_capture
```typescript
{
  name: 'request_webcam_capture',
  description: 'Request a still image from user\'s webcam to import into canvas',
  input_schema: {
    reason: string,
    preview: boolean   // Show preview before capturing?
  }
}
```

### 4. paste_clipboard_image
```typescript
{
  name: 'paste_clipboard_image',
  description: 'Import an image from user\'s clipboard (if they just copied/screenshotted something)',
  input_schema: {}
}
```

---

## Success Criteria

**This IPI is successful when:**
- Users can easily bring local files into canvas
- Claude can export results back to user's computer
- Live media capture works smoothly
- All require explicit user consent (secure)
- Workflows feel natural and integrated

**User Feedback to Validate:**
- "I love that I can upload my photos and Claude annotates them"
- "Exporting my canvas is so easy now"
- "The webcam feature is surprisingly useful"
- "It feels like Claude can work with my actual stuff"

---

## Next Steps

1. Start with **File Upload** (highest value, easiest)
2. Add **Export Canvas** (quick win)
3. Experiment with **Webcam** (coolest demo)
4. Polish based on user feedback

---

## Notes

- All features require user interaction (security)
- Start simple, add features incrementally
- Webcam is the "wow" feature
- File upload is the practical necessity
- Export is table stakes

**Key Insight**: Making canvas work with the user's **real context** (their files, camera, screen) transforms it from a drawing tool into a true collaborative workspace.

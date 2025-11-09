// Client-side JavaScript for Context Canvas

// Test server connection
fetch('/api/health')
    .then(res => res.json())
    .then(data => {
        console.log('Server status:', data);
        document.getElementById('statusText').textContent = data.message + ' ✓';
    })
    .catch(err => {
        console.error('Server connection failed:', err);
        document.getElementById('statusText').textContent = 'Server connection failed ✗';
        document.getElementById('statusText').style.color = '#f48771';
    });

// JS Modal controls
const jsModal = document.getElementById('jsModal');
const showJsButton = document.getElementById('showJsButton');
const closeJsButton = document.getElementById('closeJsButton');
const canvasCodePre = document.getElementById('canvasCode');

showJsButton.addEventListener('click', () => {
    updateDebugPanel();
    jsModal.style.display = 'flex';
});

closeJsButton.addEventListener('click', () => {
    jsModal.style.display = 'none';
});

// Close modal on background click
jsModal.addEventListener('click', (e) => {
    if (e.target === jsModal) {
        jsModal.style.display = 'none';
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && jsModal.style.display === 'flex') {
        jsModal.style.display = 'none';
    }
});

// Resize Modal controls
const resizeModal = document.getElementById('resizeModal');
const resizeButton = document.getElementById('resizeButton');
const closeResizeButton = document.getElementById('closeResizeButton');
const canvasSizeDisplay = document.getElementById('canvasSize');
const currentSizeDisplay = document.getElementById('currentSize');
const resize2xWidthBtn = document.getElementById('resize2xWidth');
const resize2xHeightBtn = document.getElementById('resize2xHeight');
const resize2xBothBtn = document.getElementById('resize2xBoth');
const resetViewButton = document.getElementById('resetViewButton');

resizeButton.addEventListener('click', () => {
    updateSizeDisplays();
    resizeModal.style.display = 'flex';
});

closeResizeButton.addEventListener('click', () => {
    resizeModal.style.display = 'none';
});

// Reset viewport button
resetViewButton.addEventListener('click', () => {
    viewport.offsetX = 0;
    viewport.offsetY = 0;
    viewport.scale = 1.0;
    renderCanvas();
});

// Canvas management UI
const canvasPicker = document.getElementById('canvasPicker');
const newCanvasButton = document.getElementById('newCanvasButton');
const deleteCanvasButton = document.getElementById('deleteCanvasButton');

function updateCanvasPicker() {
    const canvases = loadCanvases();
    const canvasIds = Object.keys(canvases);
    
    canvasPicker.innerHTML = '';
    
    canvasIds.forEach(id => {
        const canvas = canvases[id];
        const option = document.createElement('option');
        option.value = id;
        option.textContent = canvas.name;
        if (id === currentCanvasId) {
            option.selected = true;
        }
        canvasPicker.appendChild(option);
    });
    
    // Update delete button state
    deleteCanvasButton.disabled = canvasIds.length <= 1;
    if (canvasIds.length <= 1) {
        deleteCanvasButton.style.opacity = '0.5';
        deleteCanvasButton.style.cursor = 'not-allowed';
    } else {
        deleteCanvasButton.style.opacity = '1';
        deleteCanvasButton.style.cursor = 'pointer';
    }
}

canvasPicker.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    if (selectedId && selectedId !== currentCanvasId) {
        saveCurrentCanvas(); // Save before switching
        loadCanvas(selectedId);
    }
});

newCanvasButton.addEventListener('click', () => {
    const name = prompt('Enter canvas name:', 'New Canvas');
    if (name) {
        saveCurrentCanvas(); // Save current before creating new
        const id = createCanvas(name);
        loadCanvas(id);
    }
});

deleteCanvasButton.addEventListener('click', () => {
    const canvases = loadCanvases();
    const canvasIds = Object.keys(canvases);
    
    if (canvasIds.length <= 1) {
        alert('Cannot delete the last canvas.');
        return;
    }
    
    const currentCanvas = getCurrentCanvas();
    if (currentCanvas && confirm(`Delete canvas "${currentCanvas.name}"? This cannot be undone.`)) {
        deleteCanvas(currentCanvasId);
        
        // Load another canvas
        const remainingIds = Object.keys(loadCanvases());
        if (remainingIds.length > 0) {
            loadCanvas(remainingIds[0]);
        }
    }
});

// Close modal on background click
resizeModal.addEventListener('click', (e) => {
    if (e.target === resizeModal) {
        resizeModal.style.display = 'none';
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resizeModal.style.display === 'flex') {
        resizeModal.style.display = 'none';
    }
});

// Context counter
const contextCounter = document.getElementById('contextCounter');

function updateContextCounter(usage) {
    if (usage && usage.input_tokens) {
        // input_tokens is the total context size (includes everything: history, images, system prompt, etc.)
        contextCounter.textContent = `Context: ${usage.input_tokens.toLocaleString()} tokens`;
    }
}

// Chat functionality
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');

let isProcessing = false;

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const roleLabel = document.createElement('div');
    roleLabel.className = 'message-role';
    roleLabel.textContent = role === 'user' ? 'You' : 'Assistant';
    
    const contentDiv = document.createElement('div');
    contentDiv.textContent = content;
    
    messageDiv.appendChild(roleLabel);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return messageDiv;
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isProcessing) return;
    
    // Add user message to UI
    addMessage('user', message);
    
    // Clear input
    messageInput.value = '';
    
    // Disable input while processing
    isProcessing = true;
    sendButton.disabled = true;
    messageInput.disabled = true;
    
    // Add loading indicator
    const loadingMsg = addMessage('assistant', '...');
    
    try {
        // Capture canvas screenshots (both full and viewport)
        let fullCanvasScreenshot = null;
        let viewportScreenshot = null;
        let canvasJSCode = null;
        let canvasDimensions = null;
        let viewportData = null;
        
        if (canvas) {
            try {
                fullCanvasScreenshot = await captureFullCanvas();
                viewportScreenshot = captureViewport();
                canvasJSCode = canvasJS;
                canvasDimensions = {
                    width: canvas.width,
                    height: canvas.height
                };
                viewportData = {
                    offsetX: viewport.offsetX,
                    offsetY: viewport.offsetY,
                    scale: viewport.scale
                };
            } catch (error) {
                console.error('Error capturing canvas:', error);
            }
        }
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message,
                fullCanvasScreenshot,
                viewportScreenshot,
                canvasJS: canvasJSCode,
                canvasDimensions,
                viewport: viewportData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove loading indicator
        loadingMsg.remove();
        
        // Update context counter if usage data is available
        if (data.usage) {
            updateContextCounter(data.usage);
        }
        
        // If there were tool uses, show them in the chat
        if (data.toolUses && data.toolUses.length > 0) {
            for (const toolUse of data.toolUses) {
                let toolMessage = '🔧 Used tool';
                if (toolUse.type === 'import_webpage' && toolUse.url) {
                    toolMessage = `🌐 Imported webpage: ${toolUse.url}`;
                } else if (toolUse.type === 'import_webpage_error' && toolUse.url) {
                    toolMessage = `❌ Failed to import: ${toolUse.url}`;
                } else {
                    toolMessage = '🔧 Used drawing tool';
                }
                addMessage('assistant', toolMessage);
            }
        }
        
        // Update canvas with new JS if provided
        if (data.canvasJS && data.canvasJS !== canvasJS) {
            setCanvasJS(data.canvasJS);
        }
        
        // Add assistant response to UI
        if (data.response) {
            addMessage('assistant', data.response);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        // Remove loading indicator
        loadingMsg.remove();
        addMessage('assistant', 'Sorry, there was an error processing your message.');
    } finally {
        // Re-enable input
        isProcessing = false;
        sendButton.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

// Send on button click
sendButton.addEventListener('click', sendMessage);

// Send on Enter (but allow Shift+Enter for new lines)
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Focus input on load
messageInput.focus();

// -------------------------
// Multi-Canvas Management
// -------------------------

// Canvas data model
const STORAGE_KEY = 'contextcanvas_canvases';
const ACTIVE_CANVAS_KEY = 'contextcanvas_active';

// Active canvas state
let currentCanvasId = null;

// Storage functions
function saveCanvases(canvases) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases));
}

function loadCanvases() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

function getActiveCanvasId() {
    return localStorage.getItem(ACTIVE_CANVAS_KEY) || null;
}

function setActiveCanvasId(id) {
    localStorage.setItem(ACTIVE_CANVAS_KEY, id);
    currentCanvasId = id;
}

function createCanvas(name) {
    const id = 'canvas_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    const canvases = loadCanvases();
    
    canvases[id] = {
        id: id,
        name: name || 'Untitled Canvas',
        canvasJS: `
// Clear and set background
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Canvas boundary (so you can see edges when zoomed out)
ctx.strokeStyle = '#cccccc';
ctx.lineWidth = 2;
ctx.strokeRect(0, 0, canvas.width, canvas.height);

// Simple hello message
ctx.fillStyle = '#858585';
ctx.font = '16px Arial';
ctx.fillText('Hello World', 20, 35);
`,
        created: Date.now(),
        modified: Date.now()
    };
    
    saveCanvases(canvases);
    return id;
}

function deleteCanvas(id) {
    const canvases = loadCanvases();
    delete canvases[id];
    saveCanvases(canvases);
}

function getCurrentCanvas() {
    if (!currentCanvasId) return null;
    const canvases = loadCanvases();
    return canvases[currentCanvasId] || null;
}

function saveCurrentCanvas() {
    if (!currentCanvasId) return;
    
    const canvases = loadCanvases();
    if (canvases[currentCanvasId]) {
        canvases[currentCanvasId].canvasJS = canvasJS;
        canvases[currentCanvasId].modified = Date.now();
        saveCanvases(canvases);
    }
}

function loadCanvas(id) {
    const canvases = loadCanvases();
    const canvas = canvases[id];
    
    if (canvas) {
        currentCanvasId = id;
        setActiveCanvasId(id);
        setCanvasJS(canvas.canvasJS);
        updateCanvasPicker();
        console.log('Loaded canvas:', canvas.name);
    }
}

// Initialize - create default canvas if none exist
function initializeCanvases() {
    const canvases = loadCanvases();
    const canvasIds = Object.keys(canvases);
    
    if (canvasIds.length === 0) {
        // No canvases exist, create default
        const id = createCanvas('Main Canvas');
        loadCanvas(id);
    } else {
        // Load active canvas or first available
        const activeId = getActiveCanvasId();
        if (activeId && canvases[activeId]) {
            loadCanvas(activeId);
        } else {
            loadCanvas(canvasIds[0]);
        }
    }
}

// -------------------------
// Canvas JS code renderer
// -------------------------

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext && canvas.getContext('2d');

// Viewport state for pan and zoom
let viewport = {
    offsetX: 0,
    offsetY: 0,
    scale: 1.0
};

// The canvas JS code is the source of truth
// This is the actual JavaScript that renders the canvas
// Will be loaded from storage or set to default
let canvasJS = '';

function resizeCanvasToFit() {
    const rect = canvas.getBoundingClientRect();
    // Use device pixel ratio for crispness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    // Don't apply transforms here - renderCanvas will do it
}

function renderCanvas() {
    if (!ctx) return;
    
    // Save current transform
    ctx.save();
    
    // Reset to identity for full clear
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    // Apply viewport transform
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.scale, viewport.scale);
    
    try {
        // Execute the canvas JS code
        eval(canvasJS);
    } catch (error) {
        console.error('Error executing canvas JS:', error);
        // Show error on canvas
        ctx.fillStyle = '#f48771';
        ctx.font = '14px monospace';
        ctx.fillText('Error rendering canvas: ' + error.message, 20, 20);
    }
    
    // Restore transform
    ctx.restore();
}

function updateDebugPanel() {
    canvasCodePre.textContent = canvasJS;
}

function setCanvasJS(newJS) {
    canvasJS = newJS;
    renderCanvas();
    updateDebugPanel();
    saveCurrentCanvas(); // Auto-save when canvas JS changes
}

// Initialize
function initCanvas() {
    resizeCanvasToFit();
    renderCanvas();
    updateDebugPanel();
}

window.addEventListener('resize', () => {
    resizeCanvasToFit();
    renderCanvas();
});

// Initialize canvases and then init canvas rendering
initializeCanvases();
setTimeout(initCanvas, 60);

// -------------------------
// Canvas resizing
// -------------------------

const MAX_WIDTH = 6400;
const MAX_HEIGHT = 3600;

function updateSizeDisplays() {
    const currentW = canvas.width;
    const currentH = canvas.height;
    const sizeText = `${currentW}×${currentH}`;
    canvasSizeDisplay.textContent = sizeText;
    currentSizeDisplay.textContent = sizeText;
    
    // Update button states based on limits
    resize2xWidthBtn.disabled = (currentW * 2 > MAX_WIDTH);
    resize2xHeightBtn.disabled = (currentH * 2 > MAX_HEIGHT);
    resize2xBothBtn.disabled = (currentW * 2 > MAX_WIDTH || currentH * 2 > MAX_HEIGHT);
    
    // Style disabled buttons
    [resize2xWidthBtn, resize2xHeightBtn, resize2xBothBtn].forEach(btn => {
        if (btn.disabled) {
            btn.style.background = '#555';
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.5';
        } else {
            btn.style.background = '#0e639c';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
        }
    });
}

function resizeCanvas(newWidth, newHeight) {
    console.log(`Resizing canvas from ${canvas.width}×${canvas.height} to ${newWidth}×${newHeight}`);
    
    // Update canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Re-render with existing JS (content is top-left anchored)
    renderCanvas();
    updateSizeDisplays();
    
    // Close modal
    resizeModal.style.display = 'none';
}

resize2xWidthBtn.addEventListener('click', () => {
    const newWidth = Math.min(canvas.width * 2, MAX_WIDTH);
    resizeCanvas(newWidth, canvas.height);
});

resize2xHeightBtn.addEventListener('click', () => {
    const newHeight = Math.min(canvas.height * 2, MAX_HEIGHT);
    resizeCanvas(canvas.width, newHeight);
});

resize2xBothBtn.addEventListener('click', () => {
    const newWidth = Math.min(canvas.width * 2, MAX_WIDTH);
    const newHeight = Math.min(canvas.height * 2, MAX_HEIGHT);
    resizeCanvas(newWidth, newHeight);
});

// Expose for debug in console
window.__contextCanvas = {
    getJS: () => canvasJS,
    setJS: setCanvasJS,
    render: renderCanvas,
    updateDebug: updateDebugPanel,
    resize: resizeCanvas
};

// -------------------------
// Drawing tool
// -------------------------

let isDrawing = false;
let currentPath = [];

function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get screen coordinates
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    
    // Transform to canvas coordinates (accounting for viewport)
    const canvasX = (screenX / viewport.scale) - viewport.offsetX / viewport.scale;
    const canvasY = (screenY / viewport.scale) - viewport.offsetY / viewport.scale;
    
    return { x: canvasX, y: canvasY };
}

function startDrawing(e) {
    // Don't start drawing if right mouse (panning)
    if (e.button === 2) return;
    
    isDrawing = true;
    const coords = getCanvasCoordinates(e);
    currentPath = [coords];
}

function draw(e) {
    if (!isDrawing || isPanning) return;
    
    const coords = getCanvasCoordinates(e);
    currentPath.push(coords);
    
    // Draw the current stroke live on canvas
    if (ctx && currentPath.length > 1) {
        const prev = currentPath[currentPath.length - 2];
        
        // Save context and apply viewport transform
        ctx.save();
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.translate(viewport.offsetX, viewport.offsetY);
        ctx.scale(viewport.scale, viewport.scale);
        
        // Draw the line segment
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        
        // Restore context
        ctx.restore();
    }
}

function endDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (currentPath.length > 1) {
        // Generate JS code for this path
        const pathJS = generatePathJS(currentPath);
        
        // Append to canvas JS
        canvasJS += '\n' + pathJS;
        
        // Re-render and update debug
        renderCanvas();
        updateDebugPanel();
    }
    
    currentPath = [];
}

function generatePathJS(path) {
    let code = '\n// Drawn by human\n';
    code += 'ctx.strokeStyle = "#ff6b35";\n';
    code += 'ctx.lineWidth = 3;\n';
    code += 'ctx.lineCap = "round";\n';
    code += 'ctx.lineJoin = "round";\n';
    code += 'ctx.beginPath();\n';
    code += `ctx.moveTo(${path[0].x.toFixed(1)}, ${path[0].y.toFixed(1)});\n`;
    
    for (let i = 1; i < path.length; i++) {
        code += `ctx.lineTo(${path[i].x.toFixed(1)}, ${path[i].y.toFixed(1)});\n`;
    }
    
    code += 'ctx.stroke();';
    
    return code;
}

// Add event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseleave', endDrawing);

// -------------------------
// Pan and Zoom controls
// -------------------------

let isPanning = false;
let panStart = { x: 0, y: 0 };

// Pan with right-click drag
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // Right click
        e.preventDefault();
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grab';
    }
});

// Prevent context menu on right-click
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        
        viewport.offsetX += dx;
        viewport.offsetY += dy;
        
        panStart = { x: e.clientX, y: e.clientY };
        renderCanvas();
        canvas.style.cursor = 'grabbing';
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 2 || (isPanning && e.button === 0)) { // Right click or was panning
        isPanning = false;
        canvas.style.cursor = 'default';
    }
});

// Zoom with mouse wheel
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const oldScale = viewport.scale;
    viewport.scale *= zoomFactor;
    
    // Clamp zoom level
    viewport.scale = Math.max(0.1, Math.min(viewport.scale, 5.0));
    
    // Adjust offset to zoom toward mouse position
    const scaleChange = viewport.scale / oldScale;
    viewport.offsetX = mouseX - (mouseX - viewport.offsetX) * scaleChange;
    viewport.offsetY = mouseY - (mouseY - viewport.offsetY) * scaleChange;
    
    renderCanvas();
}, { passive: false });

// Reset viewport
window.__contextCanvas.resetView = function() {
    viewport.offsetX = 0;
    viewport.offsetY = 0;
    viewport.scale = 1.0;
    renderCanvas();
    console.log('Viewport reset to default');
};

// -------------------------
// Canvas screenshot generation
// -------------------------

// Generate full canvas screenshot (no viewport transform)
async function captureFullCanvas() {
    if (!canvas || !ctx) return null;
    
    // Create temporary canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Render at identity transform (no pan/zoom)
    const dpr = window.devicePixelRatio || 1;
    tempCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tempCtx.clearRect(0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr);
    
    try {
        // Create a function scope with temp canvas/ctx variables
        // This ensures the canvas JS uses the temp canvas, not the main one
        const renderFunc = new Function('canvas', 'ctx', canvasJS);
        renderFunc(tempCanvas, tempCtx);
    } catch (error) {
        console.error('Error rendering full canvas:', error);
    }
    
    // Wait for images to load (data URIs load fast in browser)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return tempCanvas.toDataURL('image/png');
}

// Generate viewport screenshot (current user view)
function captureViewport() {
    if (!canvas) return null;
    
    // Current canvas already shows the viewport view
    return canvas.toDataURL('image/png');
}


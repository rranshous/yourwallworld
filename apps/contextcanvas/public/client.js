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
                fullCanvasScreenshot = captureFullCanvas();
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
            const toolMessage = `🔧 Used drawing tool (${data.toolUses.length} operation${data.toolUses.length > 1 ? 's' : ''})`;
            addMessage('assistant', toolMessage);
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
let canvasJS = `
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
`;

function resizeCanvasToFit() {
    const rect = canvas.getBoundingClientRect();
    // Use device pixel ratio for crispness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    if (ctx) {
        // Apply DPR scaling
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Then apply viewport transform
        ctx.translate(viewport.offsetX, viewport.offsetY);
        ctx.scale(viewport.scale, viewport.scale);
    }
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

// run init after a tick so layout settled
setTimeout(initCanvas, 60);

// Expose for debug in console
window.__contextCanvas = {
    getJS: () => canvasJS,
    setJS: setCanvasJS,
    render: renderCanvas,
    updateDebug: updateDebugPanel
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
    // Don't start drawing if middle mouse or shift+click (panning)
    if (e.button === 1 || e.shiftKey) return;
    
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

// Pan with middle mouse or space+drag
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) { // Middle click or Shift+left click
        e.preventDefault();
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grab';
    }
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
    if (e.button === 1 || (isPanning && e.button === 0)) {
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
function captureFullCanvas() {
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
        // Execute canvas JS without viewport transform
        eval(canvasJS);
    } catch (error) {
        console.error('Error rendering full canvas:', error);
    }
    
    return tempCanvas.toDataURL('image/png');
}

// Generate viewport screenshot (current user view)
function captureViewport() {
    if (!canvas) return null;
    
    // Current canvas already shows the viewport view
    return canvas.toDataURL('image/png');
}


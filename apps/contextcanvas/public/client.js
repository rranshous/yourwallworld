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

// Debug panel toggle
const debugPanel = document.getElementById('debugPanel');
const debugHeader = document.getElementById('debugHeader');
const debugToggle = document.getElementById('debugToggle');

debugHeader.addEventListener('click', () => {
    debugPanel.classList.toggle('hidden');
    debugToggle.textContent = debugPanel.classList.contains('hidden') ? '▼' : '▲';
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
        // Capture canvas screenshot
        let canvasScreenshot = null;
        let canvasJSCode = null;
        let canvasDimensions = null;
        
        if (canvas) {
            try {
                canvasScreenshot = canvas.toDataURL('image/png');
                canvasJSCode = canvasJS;
                canvasDimensions = {
                    width: canvas.width,
                    height: canvas.height
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
                canvasScreenshot,
                canvasJS: canvasJSCode,
                canvasDimensions
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
const canvasCodePre = document.getElementById('canvasCode');

// The canvas JS code is the source of truth
// This is the actual JavaScript that renders the canvas
let canvasJS = `
// Clear and set background
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Welcome box
ctx.fillStyle = '#0e639c';
ctx.fillRect(40, 40, 400, 140);
ctx.fillStyle = '#ffffff';
ctx.font = '24px Arial';
ctx.fillText('Welcome to Context Canvas', 60, 95);

// Memories box
ctx.fillStyle = '#2d2d30';
ctx.fillRect(480, 40, 320, 120);
ctx.fillStyle = '#d4d4d4';
ctx.font = '18px Arial';
ctx.fillText('Memories', 500, 85);

// Circle
ctx.fillStyle = '#ffaa00';
ctx.beginPath();
ctx.arc(200, 260, 40, 0, Math.PI * 2);
ctx.fill();
`;

function resizeCanvasToFit() {
    const rect = canvas.getBoundingClientRect();
    // Use device pixel ratio for crispness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderCanvas() {
    if (!ctx) return;
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
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function startDrawing(e) {
    isDrawing = true;
    const coords = getCanvasCoordinates(e);
    currentPath = [coords];
}

function draw(e) {
    if (!isDrawing) return;
    
    const coords = getCanvasCoordinates(e);
    currentPath.push(coords);
    
    // Draw the current stroke live on canvas
    if (ctx && currentPath.length > 1) {
        const prev = currentPath[currentPath.length - 2];
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
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

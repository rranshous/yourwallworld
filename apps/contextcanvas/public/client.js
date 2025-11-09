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
    
    try {
        // Capture canvas screenshot
        let canvasScreenshot = null;
        let canvasJSCode = null;
        
        if (canvas) {
            try {
                canvasScreenshot = canvas.toDataURL('image/png');
                canvasJSCode = canvasJS;
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
                canvasJS: canvasJSCode
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Add assistant response to UI
        if (data.response) {
            addMessage('assistant', data.response);
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
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

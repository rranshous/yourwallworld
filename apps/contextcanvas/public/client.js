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
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
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
// Canvas state & renderer
// -------------------------

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext && canvas.getContext('2d');
const canvasCodePre = document.getElementById('canvasCode');

// Basic canvas state representation (this will be sent to the model later)
const canvasState = {
    width: 1600,
    height: 900,
    shapes: [
        { type: 'rect', x: 40, y: 40, width: 400, height: 140, color: '#0e639c', fill: true },
        { type: 'text', text: 'Welcome to Context Canvas', x: 60, y: 95, color: '#ffffff', font: '24px Arial' },
        { type: 'rect', x: 480, y: 40, width: 320, height: 120, color: '#2d2d30', fill: true },
        { type: 'text', text: 'Memories', x: 500, y: 85, color: '#d4d4d4', font: '18px Arial' },
        { type: 'circle', x: 200, y: 260, radius: 40, color: '#ffaa00', fill: true }
    ]
};

function resizeCanvasToFit() {
    const rect = canvas.getBoundingClientRect();
    // Use device pixel ratio for crispness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvasState.width = canvas.width;
    canvasState.height = canvas.height;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderFromState() {
    if (!ctx) return;
    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const s of canvasState.shapes) {
        switch (s.type) {
            case 'rect':
                ctx.fillStyle = s.color || '#000';
                if (s.fill) ctx.fillRect(s.x, s.y, s.width, s.height);
                else ctx.strokeRect(s.x, s.y, s.width, s.height);
                break;
            case 'circle':
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                if (s.fill) {
                    ctx.fillStyle = s.color || '#000';
                    ctx.fill();
                } else {
                    ctx.strokeStyle = s.color || '#000';
                    ctx.stroke();
                }
                break;
            case 'text':
                ctx.fillStyle = s.color || '#000';
                ctx.font = s.font || '16px Arial';
                ctx.fillText(s.text, s.x, s.y);
                break;
        }
    }
}

function generateCanvasJSString() {
    // This returns a small JS snippet that represents the canvas state and render usage
    const stateJSON = JSON.stringify(canvasState, null, 2);
    return `// Canvas state (JSON)\nconst canvasState = ${stateJSON};\n\n// render(ctx, canvasState) - rendering logic is implemented on the client\n`;
}

function updateDebugPanel() {
    canvasCodePre.textContent = generateCanvasJSString();
}

// Initialize
function initCanvas() {
    resizeCanvasToFit();
    renderFromState();
    updateDebugPanel();
}

window.addEventListener('resize', () => {
    resizeCanvasToFit();
    renderFromState();
});

// run init after a tick so layout settled
setTimeout(initCanvas, 60);

// Expose for debug in console
window.__contextCanvas = {
    state: canvasState,
    render: renderFromState,
    updateDebug: updateDebugPanel
};

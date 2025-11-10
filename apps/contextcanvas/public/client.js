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

// Template picker modal
const templateModal = document.getElementById('templateModal');
const closeTemplateButton = document.getElementById('closeTemplateButton');
const templateGrid = document.getElementById('templateGrid');

function showTemplatePicker() {
    // Populate template grid
    templateGrid.innerHTML = '';
    
    Object.keys(CANVAS_TEMPLATES).forEach(templateId => {
        const template = CANVAS_TEMPLATES[templateId];
        
        const card = document.createElement('div');
        card.style.cssText = 'background: #2d2d30; border: 2px solid #3e3e42; border-radius: 6px; padding: 15px; cursor: pointer; transition: all 0.2s;';
        card.onmouseenter = () => {
            card.style.borderColor = '#0e639c';
            card.style.background = '#383838';
        };
        card.onmouseleave = () => {
            card.style.borderColor = '#3e3e42';
            card.style.background = '#2d2d30';
        };
        
        const title = document.createElement('div');
        title.style.cssText = 'color: #4ec9b0; font-weight: 600; font-size: 16px; margin-bottom: 8px;';
        title.textContent = template.name;
        
        const desc = document.createElement('div');
        desc.style.cssText = 'color: #cccccc; font-size: 13px;';
        desc.textContent = template.description;
        
        card.appendChild(title);
        card.appendChild(desc);
        
        card.addEventListener('click', () => {
            const name = prompt('Enter canvas name:', template.name);
            if (name) {
                saveCurrentCanvas();
                const id = createCanvas(name, templateId);
                loadCanvas(id);
                templateModal.style.display = 'none';
            }
        });
        
        templateGrid.appendChild(card);
    });
    
    templateModal.style.display = 'flex';
}

closeTemplateButton.addEventListener('click', () => {
    templateModal.style.display = 'none';
});

templateModal.addEventListener('click', (e) => {
    if (e.target === templateModal) {
        templateModal.style.display = 'none';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && templateModal.style.display === 'flex') {
        templateModal.style.display = 'none';
    }
});

newCanvasButton.addEventListener('click', () => {
    showTemplatePicker();
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

// Rename canvas button
const renameCanvasButton = document.getElementById('renameCanvasButton');
renameCanvasButton.addEventListener('click', () => {
    const currentCanvas = getCurrentCanvas();
    if (!currentCanvas) return;
    
    const newName = prompt('Enter new canvas name:', currentCanvas.name);
    if (newName && newName.trim() && newName.trim() !== currentCanvas.name) {
        renameCanvas(currentCanvasId, newName.trim());
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
    let loadingMsg = addMessage('assistant', '...');
    
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
        
        // Get current canvas info
        const currentCanvas = getCurrentCanvas();
        const canvasName = currentCanvas ? currentCanvas.name : 'Unknown Canvas';
        const canvasTemplate = currentCanvas ? currentCanvas.template : 'blank';
        const templateName = canvasTemplate && CANVAS_TEMPLATES[canvasTemplate] 
            ? CANVAS_TEMPLATES[canvasTemplate].name 
            : 'Custom';
        
        // Use SSE streaming endpoint
        const response = await fetch('/api/chat-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message,
                fullCanvasScreenshot,
                viewportScreenshot,
                canvasJS: canvasJSCode,
                canvasName: canvasName,
                canvasTemplate: templateName,
                canvasDimensions,
                viewport: viewportData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Read stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        let buffer = '';
        let hasReceivedContent = false;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            
            // Parse newline-delimited JSON
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
                if (!line.trim()) continue;
                
                try {
                    const { event, data } = JSON.parse(line);
                    
                    handleStreamEvent(event, data);
                    
                    // Remove loading indicator on first real content (not connected event)
                    if (!hasReceivedContent && event !== 'connected' && loadingMsg) {
                        loadingMsg.remove();
                        loadingMsg = null;
                        hasReceivedContent = true;
                    }
                } catch (err) {
                    console.error('Error parsing stream data:', err, line);
                }
            }
        }
        
        // Clean up loading indicator if still there
        if (loadingMsg) {
            loadingMsg.remove();
        }
        
    } catch (error) {
        console.error('Error sending message:', error);
        // Remove loading indicator
        if (loadingMsg) {
            loadingMsg.remove();
        }
        addMessage('assistant', 'Sorry, there was an error processing your message.');
    } finally {
        // Re-enable input
        isProcessing = false;
        sendButton.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

function handleStreamEvent(event, data) {
    
    switch (event) {
        case 'connected':
            // Stream connection established, update loading indicator
            console.log('Stream connected:', data.status);
            if (loadingMsg) {
                loadingMsg.textContent = '💭 Claude is thinking...';
            }
            break;
            
        case 'tool_use':
            // Show tool use notification
            let toolMessage = '🔧 Using tool...';
            if (data.type === 'append') {
                toolMessage = '� Adding to canvas...';
            } else if (data.type === 'replace') {
                toolMessage = '� Replacing canvas...';
            } else if (data.type === 'update_element' && data.elementName) {
                toolMessage = `✏️ Updating element: ${data.elementName}...`;
            } else if (data.type === 'import_webpage' && data.url) {
                toolMessage = `🌐 Importing webpage: ${data.url}...`;
            }
            addMessage('system', toolMessage);
            break;
            
        case 'canvas_update':
            // Update canvas immediately
            if (data.canvasJS && data.canvasJS !== canvasJS) {
                setCanvasJS(data.canvasJS);
            }
            break;
            
        case 'message':
            // Show Claude's text response
            if (data.text) {
                addMessage('assistant', data.text);
            }
            break;
            
        case 'usage':
            // Update token counter
            if (data.usage) {
                updateContextCounter(data.usage);
            }
            break;
            
        case 'tool_error':
            // Show error message
            let errorMsg = '❌ Tool error';
            if (data.type === 'update_element_error' && data.elementName) {
                errorMsg = `❌ Failed to update element: ${data.elementName}`;
            } else if (data.type === 'import_webpage_error' && data.url) {
                errorMsg = `❌ Failed to import: ${data.url}`;
            }
            if (data.error) {
                errorMsg += ` - ${data.error}`;
            }
            addMessage('system', errorMsg);
            break;
            
        case 'error':
            // Show fatal error
            addMessage('system', `❌ Error: ${data.details || data.error || 'Unknown error'}`);
            break;
            
        case 'done':
            // Stream complete
            console.log('Stream complete');
            if (data.usage) {
                updateContextCounter(data.usage);
            }
            break;
            
        default:
            console.log('Unknown event type:', event);
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
// Canvas Templates
// -------------------------

const CANVAS_TEMPLATES = {
    blank: {
        name: 'Blank Canvas',
        description: 'Empty white canvas for freeform creation',
        generateJS: (width, height) => `
// ELEMENT: background
// Clear and set background
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);
// END ELEMENT: background

// ELEMENT: boundary
// Canvas boundary (so you can see edges when zoomed out)
ctx.strokeStyle = '#cccccc';
ctx.lineWidth = 2;
ctx.strokeRect(0, 0, canvas.width, canvas.height);
// END ELEMENT: boundary
`
    },
    brainstorm: {
        name: 'Brainstorming',
        description: 'Areas for ideas, connections, and themes',
        generateJS: (width, height) => `
// ELEMENT: background
// Clear and set background
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);
// END ELEMENT: background

// ELEMENT: boundary
// Canvas boundary
ctx.strokeStyle = '#cccccc';
ctx.lineWidth = 2;
ctx.strokeRect(0, 0, canvas.width, canvas.height);
// END ELEMENT: boundary

// ELEMENT: ideas_section
// Ideas section (left)
ctx.strokeStyle = '#4fc3f7';
ctx.lineWidth = 2;
ctx.setLineDash([5, 5]);
ctx.strokeRect(20, 20, 450, canvas.height - 40);
ctx.setLineDash([]);

ctx.fillStyle = '#4fc3f7';
ctx.font = 'bold 18px Arial';
ctx.fillText('💡 IDEAS', 30, 50);
// END ELEMENT: ideas_section

// ELEMENT: connections_section
// Connections section (middle)
ctx.strokeStyle = '#9c27b0';
ctx.lineWidth = 2;
ctx.setLineDash([5, 5]);
ctx.strokeRect(490, 20, 450, canvas.height - 40);
ctx.setLineDash([]);

ctx.fillStyle = '#9c27b0';
ctx.font = 'bold 18px Arial';
ctx.fillText('🔗 CONNECTIONS', 500, 50);
// END ELEMENT: connections_section

// ELEMENT: themes_section
// Themes section (right)
ctx.strokeStyle = '#ff9800';
ctx.lineWidth = 2;
ctx.setLineDash([5, 5]);
ctx.strokeRect(960, 20, 450, canvas.height - 40);
ctx.setLineDash([]);

ctx.fillStyle = '#ff9800';
ctx.font = 'bold 18px Arial';
ctx.fillText('🎨 THEMES', 970, 50);
// END ELEMENT: themes_section
`
    },
    planning: {
        name: 'Planning',
        description: 'Timeline, tasks, and milestones sections',
        generateJS: (width, height) => `
// ELEMENT: background
// Clear and set background
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);
// END ELEMENT: background

// ELEMENT: boundary
// Canvas boundary
ctx.strokeStyle = '#cccccc';
ctx.lineWidth = 2;
ctx.strokeRect(0, 0, canvas.width, canvas.height);
// END ELEMENT: boundary

// ELEMENT: timeline
// Timeline section
ctx.fillStyle = '#e3f2fd';
ctx.fillRect(20, 20, canvas.width - 40, 150);
ctx.strokeStyle = '#2196f3';
ctx.lineWidth = 2;
ctx.strokeRect(20, 20, canvas.width - 40, 150);

ctx.fillStyle = '#2196f3';
ctx.font = 'bold 20px Arial';
ctx.fillText('📅 TIMELINE', 30, 50);

// Draw timeline arrow
ctx.strokeStyle = '#2196f3';
ctx.lineWidth = 3;
ctx.beginPath();
ctx.moveTo(30, 120);
ctx.lineTo(canvas.width - 50, 120);
ctx.stroke();
// Arrow head
ctx.beginPath();
ctx.moveTo(canvas.width - 50, 120);
ctx.lineTo(canvas.width - 65, 113);
ctx.lineTo(canvas.width - 65, 127);
ctx.closePath();
ctx.fillStyle = '#2196f3';
ctx.fill();
// END ELEMENT: timeline

// ELEMENT: tasks
// Tasks section
ctx.fillStyle = '#fff3e0';
ctx.fillRect(20, 190, canvas.width - 40, 380);
ctx.strokeStyle = '#ff9800';
ctx.lineWidth = 2;
ctx.strokeRect(20, 190, canvas.width - 40, 380);

ctx.fillStyle = '#ff9800';
ctx.font = 'bold 20px Arial';
ctx.fillText('✓ TASKS', 30, 220);
// END ELEMENT: tasks

// ELEMENT: milestones
// Milestones section
ctx.fillStyle = '#e8f5e9';
ctx.fillRect(20, 590, canvas.width - 40, 150);
ctx.strokeStyle = '#4caf50';
ctx.lineWidth = 2;
ctx.strokeRect(20, 590, canvas.width - 40, 150);

ctx.fillStyle = '#4caf50';
ctx.font = 'bold 20px Arial';
ctx.fillText('🎯 MILESTONES', 30, 620);
// END ELEMENT: milestones
`
    },
    conceptmap: {
        name: 'Concept Map',
        description: 'Central topic with branch areas for subtopics',
        generateJS: (width, height) => `
// Clear and set background
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Canvas boundary
ctx.strokeStyle = '#cccccc';
ctx.lineWidth = 2;
ctx.strokeRect(0, 0, canvas.width, canvas.height);

// --- Concept Map Template ---
// Central circle with radiating connection lines

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Draw connection lines (8 directions)
ctx.strokeStyle = '#b0bec5';
ctx.lineWidth = 2;
ctx.setLineDash([10, 5]);

const angles = [0, 45, 90, 135, 180, 225, 270, 315];
angles.forEach(angle => {
    const rad = angle * Math.PI / 180;
    const x1 = centerX + Math.cos(rad) * 100;
    const y1 = centerY + Math.sin(rad) * 100;
    const x2 = centerX + Math.cos(rad) * 350;
    const y2 = centerY + Math.sin(rad) * 350;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
});

ctx.setLineDash([]);

// Central topic circle
ctx.fillStyle = '#5c6bc0';
ctx.beginPath();
ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
ctx.fill();

ctx.strokeStyle = '#3f51b5';
ctx.lineWidth = 3;
ctx.stroke();

// Helper circles for subtopics
const positions = [
    {x: centerX + 350, y: centerY},
    {x: centerX - 350, y: centerY},
    {x: centerX, y: centerY - 350},
    {x: centerX, y: centerY + 350}
];

positions.forEach(pos => {
    ctx.fillStyle = '#e3f2fd';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 60, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#90caf9';
    ctx.lineWidth = 2;
    ctx.stroke();
});
`
    },
    storyboard: {
        name: 'Story Board',
        description: 'Sequence of numbered panels for visual storytelling',
        generateJS: (width, height) => `
// Clear and set background
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Canvas boundary
ctx.strokeStyle = '#cccccc';
ctx.lineWidth = 2;
ctx.strokeRect(0, 0, canvas.width, canvas.height);

// --- Story Board Template ---
// 6 panels arranged in 2 rows

const panelWidth = 450;
const panelHeight = 350;
const startX = 50;
const startY = 50;
const gapX = 50;
const gapY = 50;

for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
        const x = startX + col * (panelWidth + gapX);
        const y = startY + row * (panelHeight + gapY);
        const panelNum = row * 3 + col + 1;
        
        // Panel background
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(x, y, panelWidth, panelHeight);
        
        // Panel border
        ctx.strokeStyle = '#607d8b';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, panelWidth, panelHeight);
        
        // Panel number
        ctx.fillStyle = '#263238';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(panelNum + '.', x + 10, y + 35);
        
        // Placeholder text
        ctx.fillStyle = '#90a4ae';
        ctx.font = '14px Arial';
        ctx.fillText('Scene ' + panelNum, x + 10, y + panelHeight - 15);
    }
}
`
    },
    mindmap: {
        name: 'Mind Map',
        description: 'Hierarchical structure with center node and branches',
        generateJS: (width, height) => `
// Clear and set background
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Canvas boundary
ctx.strokeStyle = '#cccccc';
ctx.lineWidth = 2;
ctx.strokeRect(0, 0, canvas.width, canvas.height);

// --- Mind Map Template ---
// Central node with main branches and sub-branches

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Main branches (4 primary directions)
const branches = [
    {angle: 0, color: '#f44336'},
    {angle: 90, color: '#4caf50'},
    {angle: 180, color: '#2196f3'},
    {angle: 270, color: '#ff9800'}
];

branches.forEach(branch => {
    const rad = branch.angle * Math.PI / 180;
    
    // Main branch line
    ctx.strokeStyle = branch.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const branchX = centerX + Math.cos(rad) * 250;
    const branchY = centerY + Math.sin(rad) * 250;
    ctx.lineTo(branchX, branchY);
    ctx.stroke();
    
    // Main branch node
    ctx.fillStyle = branch.color;
    ctx.beginPath();
    ctx.arc(branchX, branchY, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // Sub-branches
    const subAngles = [branch.angle - 35, branch.angle + 35];
    subAngles.forEach(subAngle => {
        const subRad = subAngle * Math.PI / 180;
        
        ctx.strokeStyle = branch.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(branchX, branchY);
        const subX = branchX + Math.cos(subRad) * 150;
        const subY = branchY + Math.sin(subRad) * 150;
        ctx.lineTo(subX, subY);
        ctx.stroke();
        
        // Sub-branch node
        ctx.fillStyle = branch.color;
        ctx.beginPath();
        ctx.arc(subX, subY, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
});

// Central node
ctx.fillStyle = '#673ab7';
ctx.beginPath();
ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
ctx.fill();

ctx.strokeStyle = '#512da8';
ctx.lineWidth = 4;
ctx.stroke();
`
    }
};

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

function createCanvas(name, templateId = 'blank') {
    const id = 'canvas_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    const canvases = loadCanvases();
    
    const template = CANVAS_TEMPLATES[templateId] || CANVAS_TEMPLATES.blank;
    const templateJS = template.generateJS(canvas.width, canvas.height);
    
    canvases[id] = {
        id: id,
        name: name || 'Untitled Canvas',
        template: templateId,
        canvasJS: templateJS,
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

function renameCanvas(id, newName) {
    const canvases = loadCanvases();
    if (canvases[id]) {
        canvases[id].name = newName;
        canvases[id].modified = Date.now();
        saveCanvases(canvases);
        updateCanvasPicker();
        console.log('Canvas renamed to:', newName);
    }
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
    
    // Re-render after a short delay to catch any image onload callbacks
    // This ensures images that weren't immediately complete get rendered with correct transforms
    setTimeout(() => {
        if (!ctx) return;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        ctx.translate(viewport.offsetX, viewport.offsetY);
        ctx.scale(viewport.scale, viewport.scale);
        try {
            eval(canvasJS);
        } catch (error) {
            // Ignore errors on re-render
        }
        ctx.restore();
    }, 100);
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


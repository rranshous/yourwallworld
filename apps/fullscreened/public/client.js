// Client-side canvas rendering and interaction

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// Panel layout configuration (1920x1080)
const LAYOUT = {
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  
  // Left column: Memory panel (vertical)
  MEMORY: {
    x: 0,
    y: 0,
    width: 400,
    height: 1080,
    padding: 20,
    lineHeight: 30,
    fontSize: 16
  },
  
  // Center: Free draw area
  FREE_DRAW: {
    x: 400,
    y: 200,
    width: 920,
    height: 680,
    padding: 10
  },
  
  // Top center: Avatar
  AVATAR: {
    x: 400,
    y: 0,
    width: 300,
    height: 200,
    padding: 10
  },
  
  // Top right: Stats
  STATS: {
    x: 700,
    y: 0,
    width: 300,
    height: 200,
    padding: 20,
    lineHeight: 25,
    fontSize: 14
  },
  
  // Right column: Thoughts
  THOUGHTS: {
    x: 1320,
    y: 0,
    width: 600,
    height: 1080,
    padding: 20,
    lineHeight: 24,
    fontSize: 15
  },
  
  // Bottom center: Status/interaction area
  STATUS: {
    x: 400,
    y: 880,
    width: 920,
    height: 200,
    padding: 15,
    fontSize: 18
  }
};

// State
let panelContent = {
  memories: [],
  thoughts: '',
  stats: {
    iteration: 0,
    tokensUsed: 0,
    contextLevel: 0
  },
  avatar: {
    color: '#4A9EFF',
    state: 'idle' // idle, thinking, listening, speaking
  },
  freeDrawCommands: [],
  statusMessage: 'Initializing...'
};

// Drawing functions
function clearCanvas() {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
}

function drawPanel(config, title, bgColor = '#1a1a1a') {
  // Panel background
  ctx.fillStyle = bgColor;
  ctx.fillRect(config.x, config.y, config.width, config.height);
  
  // Panel border
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(config.x, config.y, config.width, config.height);
  
  // Panel title
  if (title) {
    ctx.fillStyle = '#666';
    ctx.font = 'bold 14px Courier New';
    ctx.fillText(title, config.x + config.padding, config.y + 20);
  }
}

function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function drawMemoryPanel() {
  const cfg = LAYOUT.MEMORY;
  drawPanel(cfg, 'MEMORIES', '#1a1a2e');
  
  ctx.fillStyle = '#88ccff';
  ctx.font = `${cfg.fontSize}px Courier New`;
  
  let y = cfg.y + cfg.padding + 40;
  const maxWidth = cfg.width - (cfg.padding * 2);
  
  for (const memory of panelContent.memories.slice(-15)) { // Last 15 memories
    const lines = wrapText(memory, maxWidth);
    for (const line of lines) {
      if (y + cfg.lineHeight > cfg.y + cfg.height - cfg.padding) break;
      ctx.fillText(line, cfg.x + cfg.padding, y);
      y += cfg.lineHeight;
    }
    y += 10; // Space between memories
  }
}

function drawThoughtsPanel() {
  const cfg = LAYOUT.THOUGHTS;
  drawPanel(cfg, 'THOUGHTS', '#1a1a2e');
  
  ctx.fillStyle = '#ffcc88';
  ctx.font = `${cfg.fontSize}px Courier New`;
  
  let y = cfg.y + cfg.padding + 40;
  const maxWidth = cfg.width - (cfg.padding * 2);
  
  const lines = wrapText(panelContent.thoughts, maxWidth);
  for (const line of lines) {
    if (y + cfg.lineHeight > cfg.y + cfg.height - cfg.padding) break;
    ctx.fillText(line, cfg.x + cfg.padding, y);
    y += cfg.lineHeight;
  }
}

function drawStatsPanel() {
  const cfg = LAYOUT.STATS;
  drawPanel(cfg, 'STATS', '#1a1a2e');
  
  ctx.fillStyle = '#aaffaa';
  ctx.font = `${cfg.fontSize}px Courier New`;
  
  const stats = panelContent.stats;
  let y = cfg.y + cfg.padding + 40;
  
  ctx.fillText(`Iteration: ${stats.iteration}`, cfg.x + cfg.padding, y);
  y += cfg.lineHeight;
  ctx.fillText(`Tokens: ${stats.tokensUsed}`, cfg.x + cfg.padding, y);
  y += cfg.lineHeight;
  ctx.fillText(`Context: ${(stats.contextLevel * 100).toFixed(1)}%`, cfg.x + cfg.padding, y);
}

function drawAvatarPanel() {
  const cfg = LAYOUT.AVATAR;
  drawPanel(cfg, 'AVATAR', '#1a1a2e');
  
  const centerX = cfg.x + cfg.width / 2;
  const centerY = cfg.y + cfg.height / 2 + 10;
  const radius = 50;
  
  // Simple circular avatar
  ctx.fillStyle = panelContent.avatar.color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // State indicator
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(panelContent.avatar.state.toUpperCase(), centerX, cfg.y + cfg.height - 20);
  ctx.textAlign = 'left';
  
  // Pulse effect for thinking/speaking
  if (panelContent.avatar.state === 'thinking' || panelContent.avatar.state === 'speaking') {
    ctx.strokeStyle = panelContent.avatar.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }
}

function drawFreeDrawPanel() {
  const cfg = LAYOUT.FREE_DRAW;
  drawPanel(cfg, 'FREE DRAW', '#0f0f0f');
  
  // Execute free draw commands
  ctx.save();
  ctx.translate(cfg.x + cfg.padding, cfg.y + cfg.padding);
  
  for (const cmd of panelContent.freeDrawCommands) {
    executeDrawCommand(cmd);
  }
  
  ctx.restore();
}

function executeDrawCommand(cmd) {
  // Simple drawing command executor
  // Format: { type: 'line'|'circle'|'rect'|'text', ...params }
  ctx.strokeStyle = cmd.color || '#ffffff';
  ctx.fillStyle = cmd.color || '#ffffff';
  ctx.lineWidth = cmd.lineWidth || 2;
  
  switch (cmd.type) {
    case 'line':
      ctx.beginPath();
      ctx.moveTo(cmd.x1, cmd.y1);
      ctx.lineTo(cmd.x2, cmd.y2);
      ctx.stroke();
      break;
    case 'circle':
      ctx.beginPath();
      ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
      if (cmd.fill) ctx.fill();
      else ctx.stroke();
      break;
    case 'rect':
      if (cmd.fill) ctx.fillRect(cmd.x, cmd.y, cmd.width, cmd.height);
      else ctx.strokeRect(cmd.x, cmd.y, cmd.width, cmd.height);
      break;
    case 'text':
      ctx.font = cmd.font || '16px Courier New';
      ctx.fillText(cmd.text, cmd.x, cmd.y);
      break;
  }
}

function drawStatusPanel() {
  const cfg = LAYOUT.STATUS;
  drawPanel(cfg, null, '#2a1a1a');
  
  ctx.fillStyle = '#ffaaaa';
  ctx.font = `${cfg.fontSize}px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText(panelContent.statusMessage, cfg.x + cfg.width / 2, cfg.y + cfg.height / 2);
  ctx.textAlign = 'left';
}

function render() {
  clearCanvas();
  drawMemoryPanel();
  drawThoughtsPanel();
  drawStatsPanel();
  drawAvatarPanel();
  drawFreeDrawPanel();
  drawStatusPanel();
}

// API interactions
async function fetchContent() {
  try {
    const response = await fetch('/api/content');
    const data = await response.json();
    
    // Merge with existing content
    panelContent = { ...panelContent, ...data };
    render();
  } catch (error) {
    console.error('Error fetching content:', error);
  }
}

async function updateContent(updates) {
  try {
    const response = await fetch('/api/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    await response.json();
  } catch (error) {
    console.error('Error updating content:', error);
  }
}

async function captureSnapshot() {
  try {
    const imageData = canvas.toDataURL('image/png');
    await fetch('/api/snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData })
    });
  } catch (error) {
    console.error('Error capturing snapshot:', error);
  }
}

// Initialize
async function init() {
  panelContent.statusMessage = 'Ready';
  render();
  
  // Fetch initial content
  await fetchContent();
  
  // Periodic updates
  setInterval(fetchContent, 1000);
  
  // Periodic snapshots
  setInterval(captureSnapshot, 5000);
}

// Speech recognition
let recognition = null;
let isListening = false;

function setupSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Speech recognition not supported');
    panelContent.statusMessage = 'Speech recognition not supported in this browser';
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => {
    isListening = true;
    panelContent.avatar.state = 'listening';
    panelContent.statusMessage = 'Listening...';
    render();
  };
  
  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('Heard:', transcript);
    
    panelContent.statusMessage = `You said: "${transcript}"`;
    panelContent.avatar.state = 'thinking';
    render();
    
    // Send to server for processing
    await processUserInput(transcript);
    
    // Capture snapshot after update
    await captureSnapshot();
    
    // Resume listening after a short delay
    setTimeout(() => {
      if (recognition) {
        startListening();
      }
    }, 2000);
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    panelContent.avatar.state = 'idle';
    
    if (event.error !== 'no-speech') {
      panelContent.statusMessage = `Error: ${event.error}`;
    }
    
    render();
    
    // Retry after error
    setTimeout(() => {
      if (recognition) {
        startListening();
      }
    }, 3000);
  };
  
  recognition.onend = () => {
    isListening = false;
  };
}

function startListening() {
  if (recognition && !isListening) {
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      // Already started, ignore
    }
  }
}

function stopListening() {
  if (recognition && isListening) {
    recognition.stop();
  }
}

async function processUserInput(input) {
  try {
    const response = await fetch('/api/process-input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: input })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update panel content with response
      panelContent = { ...panelContent, ...data.content };
      
      // Speak the response if available
      if (data.spokenResponse && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(data.spokenResponse);
        utterance.onend = () => {
          panelContent.avatar.state = 'idle';
          render();
        };
        speechSynthesis.speak(utterance);
      } else {
        panelContent.avatar.state = 'idle';
      }
      
      render();
    }
  } catch (error) {
    console.error('Error processing input:', error);
    panelContent.statusMessage = 'Error processing input';
    panelContent.avatar.state = 'idle';
    render();
  }
}

// Keyboard controls
document.addEventListener('keydown', (event) => {
  // Press 'L' to toggle listening
  if (event.key === 'l' || event.key === 'L') {
    if (isListening) {
      stopListening();
      panelContent.statusMessage = 'Listening stopped';
      panelContent.avatar.state = 'idle';
    } else {
      startListening();
    }
    render();
  }
  
  // Press 'C' to clear free draw
  if (event.key === 'c' || event.key === 'C') {
    panelContent.freeDrawCommands = [];
    render();
  }
  
  // Press 'S' to capture snapshot manually
  if (event.key === 's' || event.key === 'S') {
    captureSnapshot();
    panelContent.statusMessage = 'Snapshot captured';
    render();
  }
});

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Enhanced initialization
async function enhancedInit() {
  await init();
  setupSpeechRecognition();
  
  // Auto-start listening after a moment
  setTimeout(() => {
    panelContent.statusMessage = 'Press L to start listening';
    render();
  }, 1000);
}

// Call enhanced init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', enhancedInit);
} else {
  enhancedInit();
}

// Expose for debugging
window.panelContent = panelContent;
window.render = render;
window.updateContent = updateContent;
window.startListening = startListening;
window.stopListening = stopListening;
window.processUserInput = processUserInput;

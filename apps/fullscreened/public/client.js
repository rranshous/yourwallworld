// Client-side canvas rendering and interaction

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// Panel layout configuration (1920x1080)
const LAYOUT = {
  CANVAS_WIDTH: 1920,
  CANVAS_HEIGHT: 1080,
  HEADER_HEIGHT: 70, // Space for embodiment header
  
  // Left column: Memory panel (vertical)
  MEMORY: {
    x: 0,
    y: 70,
    width: 350,
    height: 1010,
    padding: 20,
    lineHeight: 30,
    fontSize: 16
  },
  
  // Center top: User Input (what human just said)
  USER_INPUT: {
    x: 350,
    y: 70,
    width: 570,
    height: 130,
    padding: 15,
    lineHeight: 24,
    fontSize: 18
  },
  
  // Center: Free draw area
  FREE_DRAW: {
    x: 350,
    y: 200,
    width: 570,
    height: 480,
    padding: 10
  },
  
  // Top right: Avatar
  AVATAR: {
    x: 920,
    y: 70,
    width: 200,
    height: 130,
    padding: 10
  },
  
  // Top far right: Stats
  STATS: {
    x: 1120,
    y: 70,
    width: 200,
    height: 130,
    padding: 15,
    lineHeight: 22,
    fontSize: 13
  },
  
  // Right column: Thoughts
  THOUGHTS: {
    x: 1320,
    y: 70,
    width: 600,
    height: 505,
    padding: 20,
    lineHeight: 24,
    fontSize: 15
  },
  
  // Bottom right below thoughts: System Info (compact)
  SYSTEM_INFO: {
    x: 1320,
    y: 575,
    width: 600,
    height: 505,
    padding: 15,
    lineHeight: 16,
    fontSize: 10
  },
  
  // Bottom center: Status
  STATUS: {
    x: 350,
    y: 680,
    width: 570,
    height: 80,
    padding: 15,
    fontSize: 14
  },
  
  // Center right: Model Response (large space for full responses)
  MODEL_RESPONSE: {
    x: 920,
    y: 200,
    width: 400,
    height: 880,
    padding: 15,
    lineHeight: 18,
    fontSize: 12
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
  statusMessage: 'Initializing...',
  userInput: '',
  modelResponse: '', // What the model said (visible to model)
  systemInfo: {
    modelString: '',
    systemPrompt: ''
  }
};

// Drawing functions
function clearCanvas() {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
  
  // Draw "YOUR EMBODIMENT" header at the very top
  ctx.fillStyle = '#ffaa00';
  ctx.font = 'bold 24px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('═══ YOUR EMBODIMENT ═══', LAYOUT.CANVAS_WIDTH / 2, 30);
  ctx.textAlign = 'left';
  
  ctx.fillStyle = '#888';
  ctx.font = '12px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('This visual interface IS you. The you which changes and persists.', LAYOUT.CANVAS_WIDTH / 2, 50);
  ctx.textAlign = 'left';
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
  const centerY = cfg.y + cfg.height / 2 + 5;
  const radius = 35; // Smaller for reduced height
  
  // Simple circular avatar
  ctx.fillStyle = panelContent.avatar.color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // State indicator
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(panelContent.avatar.state.toUpperCase(), centerX, cfg.y + cfg.height - 15);
  ctx.textAlign = 'left';
  
  // Pulse effect for thinking/speaking
  if (panelContent.avatar.state === 'thinking' || panelContent.avatar.state === 'speaking') {
    ctx.strokeStyle = panelContent.avatar.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
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
  drawPanel(cfg, 'STATUS', '#2a1a1a');
  
  ctx.fillStyle = '#ffaaaa';
  ctx.font = `${cfg.fontSize}px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText(panelContent.statusMessage, cfg.x + cfg.width / 2, cfg.y + cfg.height / 2);
  ctx.textAlign = 'left';
}

function drawUserInputPanel() {
  const cfg = LAYOUT.USER_INPUT;
  drawPanel(cfg, 'USER INPUT', '#1a2a1a');
  
  ctx.fillStyle = '#aaffaa';
  ctx.font = `bold ${cfg.fontSize}px Courier New`;
  
  let y = cfg.y + cfg.padding + 40;
  const maxWidth = cfg.width - (cfg.padding * 2);
  
  const lines = wrapText(panelContent.userInput || '(waiting for speech...)', maxWidth);
  for (const line of lines) {
    if (y + cfg.lineHeight > cfg.y + cfg.height - cfg.padding) break;
    ctx.fillText(line, cfg.x + cfg.padding, y);
    y += cfg.lineHeight;
  }
}

function drawSystemInfoPanel() {
  const cfg = LAYOUT.SYSTEM_INFO;
  drawPanel(cfg, 'SYSTEM INFO (read-only)', '#2a2a1a');
  
  ctx.fillStyle = '#888888';
  ctx.font = `${cfg.fontSize}px Courier New`;
  
  let y = cfg.y + cfg.padding + 30;
  const maxWidth = cfg.width - (cfg.padding * 2);
  
  // Model string
  ctx.fillStyle = '#ffaa88';
  ctx.font = `bold ${cfg.fontSize + 1}px Courier New`;
  ctx.fillText('MODEL:', cfg.x + cfg.padding, y);
  y += cfg.lineHeight + 5;
  
  ctx.fillStyle = '#aaaaaa';
  ctx.font = `${cfg.fontSize}px Courier New`;
  const modelLines = wrapText(panelContent.systemInfo.modelString, maxWidth);
  for (const line of modelLines) {
    if (y + cfg.lineHeight > cfg.y + cfg.height - cfg.padding) break;
    ctx.fillText(line, cfg.x + cfg.padding, y);
    y += cfg.lineHeight;
  }
  
  y += 15;
  
  // System prompt
  ctx.fillStyle = '#ffaa88';
  ctx.font = `bold ${cfg.fontSize + 1}px Courier New`;
  ctx.fillText('SYSTEM PROMPT:', cfg.x + cfg.padding, y);
  y += cfg.lineHeight + 5;
  
  ctx.fillStyle = '#888888';
  ctx.font = `${cfg.fontSize}px Courier New`;
  const promptLines = wrapText(panelContent.systemInfo.systemPrompt, maxWidth);
  for (const line of promptLines) {
    if (y + cfg.lineHeight > cfg.y + cfg.height - cfg.padding) break;
    ctx.fillText(line, cfg.x + cfg.padding, y);
    y += cfg.lineHeight;
  }
}

function drawModelResponsePanel() {
  const cfg = LAYOUT.MODEL_RESPONSE;
  drawPanel(cfg, 'MODEL RESPONSE', '#2a1a2a');
  
  ctx.fillStyle = '#ffaaff';
  ctx.font = `${cfg.fontSize}px Courier New`;
  
  let y = cfg.y + cfg.padding + 40;
  const maxWidth = cfg.width - (cfg.padding * 2);
  
  const lines = wrapText(panelContent.modelResponse || '(waiting for model...)', maxWidth);
  for (const line of lines) {
    if (y + cfg.lineHeight > cfg.y + cfg.height - cfg.padding) break;
    ctx.fillText(line, cfg.x + cfg.padding, y);
    y += cfg.lineHeight;
  }
}

function render() {
  clearCanvas();
  drawMemoryPanel();
  drawThoughtsPanel();
  drawStatsPanel();
  drawAvatarPanel();
  drawUserInputPanel();
  drawFreeDrawPanel();
  drawSystemInfoPanel();
  drawStatusPanel();
  drawModelResponsePanel();
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
  panelContent.statusMessage = ''; // Empty - model will set it
  render();
  
  // Fetch initial content
  await fetchContent();
  
  // Periodic updates to sync state from server
  setInterval(fetchContent, 1000);
  
  // No periodic snapshots - only capture when needed:
  // 1. Before sending to model (with user input)
  // 2. After model responds (with model's updates)
}

// Speech recognition
let recognition = null;
let isListening = false;

function setupSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Speech recognition not supported');
    // Don't set statusMessage - model controls it
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
    // Don't update statusMessage - let model control it
    render();
  };
  
  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('Heard:', transcript);
    
    // Don't update statusMessage - let model control it
    panelContent.userInput = transcript; // Update user input on canvas
    panelContent.avatar.state = 'thinking';
    render();
    
    // Wait for render to complete, then capture snapshot
    await new Promise(resolve => setTimeout(resolve, 100));
    await captureSnapshot();
    
    // Send to server for processing (uses snapshots captured above)
    await processUserInput(transcript);
    
    // Render the model's response
    render();
    
    // Wait for render, then capture snapshot of model's response
    await new Promise(resolve => setTimeout(resolve, 100));
    await captureSnapshot();
    
    // Don't update statusMessage - model controls it now
    panelContent.avatar.state = 'idle';
    render();
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    panelContent.avatar.state = 'idle';
    
    // Don't update statusMessage - let model control it
    // Just log errors to console for debugging
    
    render();
    
    // Don't auto-retry - wait for user to press 'L'
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
      
      // No speech synthesis - model response is visible on canvas
      panelContent.avatar.state = 'idle';
      render();
    }
  } catch (error) {
    console.error('Error processing input:', error);
    // Don't update statusMessage - let model control it
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
      // Don't set statusMessage - model controls it
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
  
  // Press 'S' to capture snapshot manually (for debugging)
  if (event.key === 's' || event.key === 'S') {
    captureSnapshot();
    // Don't set statusMessage - model controls it
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
  
  // Don't set any initial status message - model controls it
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

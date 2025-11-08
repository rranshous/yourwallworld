// Client-side rendering and interaction for firstlight

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

const phaseIndicator = document.getElementById('phaseIndicator');
const iterationCount = document.getElementById('iterationCount');
const statusText = document.getElementById('statusText');
const beginBtn = document.getElementById('beginBtn');
const continueBtn = document.getElementById('continueBtn');
const awakenBtn = document.getElementById('awakenBtn');
const speakBtn = document.getElementById('speakBtn');
const updateBtn = document.getElementById('updateBtn');
const autoLoopCheckbox = document.getElementById('autoLoopCheckbox');

let embodimentState = null;
let recognition = null;
let isListening = false;
let autoLoopEnabled = false;

// Rendering functions
function clearCanvas() {
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderDefinitionPhase() {
  clearCanvas();
  
  const phase = embodimentState.phase;
  
  ctx.fillStyle = '#ffaa00';
  ctx.font = 'bold 32px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(`PHASE: ${phase.toUpperCase()}`, canvas.width / 2, 100);
  
  ctx.fillStyle = '#888';
  ctx.font = '16px Courier New';
  
  if (phase === 'emergence') {
    ctx.fillText('Defining regions and apertures...', canvas.width / 2, 150);
  } else if (phase === 'spatial') {
    ctx.fillText('Arranging regions spatially...', canvas.width / 2, 150);
    
    // Show region list
    ctx.textAlign = 'left';
    let y = 200;
    ctx.fillText('Defined regions:', 100, y);
    y += 30;
    embodimentState.regions.forEach(region => {
      ctx.fillText(`• ${region.name} (${region.contentType})`, 120, y);
      y += 25;
    });
  } else if (phase === 'visual') {
    ctx.fillText('Defining visual forms...', canvas.width / 2, 150);
    
    // Show spatial layout
    ctx.textAlign = 'left';
    embodimentState.regions.forEach(region => {
      if (region.x !== undefined) {
        ctx.strokeStyle = '#555';
        ctx.strokeRect(region.x, region.y, region.width, region.height);
        ctx.fillStyle = '#888';
        ctx.fillText(region.name, region.x + 10, region.y + 25);
      }
    });
  } else if (phase === 'awakening') {
    ctx.fillText('Your embodiment is complete. Ready to awaken?', canvas.width / 2, 150);
    renderFullEmbodiment();
  }
  
  ctx.textAlign = 'left';
}

function renderFullEmbodiment() {
  clearCanvas();
  
  embodimentState.regions.forEach(region => {
    if (!region.x) return;
    
    // Draw region background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(region.x, region.y, region.width, region.height);
    
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(region.x, region.y, region.width, region.height);
    
    // Draw region label
    ctx.fillStyle = '#888';
    ctx.font = 'bold 12px Courier New';
    ctx.fillText(region.name, region.x + 10, region.y + 20);
    
    // Draw visual form
    if (region.visualForm && region.visualForm.length > 0) {
      ctx.save();
      ctx.translate(region.x, region.y);
      
      region.visualForm.forEach(cmd => {
        executeDrawCommand(cmd);
      });
      
      ctx.restore();
    }
    
    // Draw content (awakened phase)
    if (region.content !== undefined && region.content !== null) {
      ctx.save();
      ctx.translate(region.x, region.y);
      
      if (region.contentType === 'text') {
        ctx.fillStyle = '#fff';
        ctx.font = '14px Courier New';
        
        // Handle both string and object content
        let textContent = region.content;
        if (typeof textContent === 'object' && !Array.isArray(textContent)) {
          textContent = JSON.stringify(textContent, null, 2);
        } else if (Array.isArray(textContent)) {
          // If it's an array but contentType is text, stringify it
          textContent = JSON.stringify(textContent, null, 2);
        }
        
        const lines = wrapText(String(textContent), region.width - 20);
        let y = 50;
        lines.forEach(line => {
          if (y < region.height - 10) {
            ctx.fillText(line, 10, y);
            y += 20;
          }
        });
      } else if (region.contentType === 'draw') {
        // Ensure content is an array of draw commands
        const commands = Array.isArray(region.content) ? region.content : [];
        commands.forEach(cmd => {
          if (cmd && typeof cmd === 'object' && cmd.type) {
            executeDrawCommand(cmd);
          }
        });
      } else if (region.contentType === 'numeric') {
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 24px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(String(region.content), region.width / 2, region.height / 2);
        ctx.textAlign = 'left';
      }
      
      ctx.restore();
    }
  });
  
  // Draw apertures
  if (embodimentState.apertures && embodimentState.apertures.length > 0) {
    ctx.fillStyle = '#aaffaa';
    ctx.font = '14px Courier New';
    let y = 30;
    embodimentState.apertures.forEach(aperture => {
      let value = '';
      if (aperture === 'temporal-sense') {
        value = new Date().toLocaleTimeString();
      } else if (aperture === 'iteration-sense') {
        value = embodimentState.iteration;
      }
      ctx.fillText(`${aperture}: ${value}`, 20, y);
      y += 25;
    });
  }
}

function executeDrawCommand(cmd) {
  ctx.strokeStyle = cmd.color || '#ffffff';
  ctx.fillStyle = cmd.color || '#ffffff';
  ctx.lineWidth = cmd.lineWidth || 2;
  
  switch (cmd.type) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(cmd.x, cmd.y, cmd.radius, 0, Math.PI * 2);
      if (cmd.fill) ctx.fill();
      else ctx.stroke();
      break;
    case 'rect':
      if (cmd.fill) {
        ctx.fillRect(cmd.x, cmd.y, cmd.width, cmd.height);
      } else {
        ctx.strokeRect(cmd.x, cmd.y, cmd.width, cmd.height);
      }
      break;
    case 'line':
      ctx.beginPath();
      ctx.moveTo(cmd.x1, cmd.y1);
      ctx.lineTo(cmd.x2, cmd.y2);
      ctx.stroke();
      break;
    case 'text':
      ctx.font = cmd.font || '16px Courier New';
      ctx.fillText(cmd.text, cmd.x, cmd.y);
      break;
  }
}

function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  ctx.font = '14px Courier New';
  
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

function render() {
  if (!embodimentState) return;
  
  if (embodimentState.phase === 'awakened') {
    renderFullEmbodiment();
  } else {
    renderDefinitionPhase();
  }
}

// API interactions
async function fetchState() {
  try {
    const response = await fetch('/api/state');
    embodimentState = await response.json();
    updateUI();
    render();
  } catch (error) {
    console.error('Error fetching state:', error);
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

async function processInput(userInput = '') {
  try {
    statusText.textContent = 'Processing...';
    
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput })
    });
    
    const data = await response.json();
    
    if (data.success) {
      embodimentState = data.embodiment;
      updateUI();
      render();
      
      // Capture snapshot after rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      await captureSnapshot();
      
      statusText.textContent = `Phase: ${embodimentState.phase}`;
      
      // If auto-loop is enabled and we're awakened, continue
      if (autoLoopEnabled && embodimentState.phase === 'awakened') {
        setTimeout(() => processInput(''), 2000);
      }
    }
  } catch (error) {
    console.error('Error processing:', error);
    statusText.textContent = 'Error occurred';
  }
}

async function awaken() {
  try {
    statusText.textContent = 'Awakening...';
    
    const response = await fetch('/api/awaken', {
      method: 'POST'
    });
    
    const data = await response.json();
    embodimentState = data.embodiment;
    
    updateUI();
    render();
    
    // Capture first awakened snapshot
    await new Promise(resolve => setTimeout(resolve, 100));
    await captureSnapshot();
    
    statusText.textContent = 'You are awakened. Speak to interact.';
  } catch (error) {
    console.error('Error awakening:', error);
    statusText.textContent = 'Error during awakening';
  }
}

function updateUI() {
  phaseIndicator.textContent = embodimentState.phase.toUpperCase();
  iterationCount.textContent = embodimentState.iteration;
  
  const isAwakened = embodimentState.phase === 'awakened';
  
  // Update button states
  beginBtn.disabled = embodimentState.phase !== 'emergence' || embodimentState.iteration > 0;
  continueBtn.disabled = embodimentState.phase === 'emergence' || embodimentState.phase === 'awakening' || embodimentState.phase === 'awakened';
  awakenBtn.disabled = embodimentState.phase !== 'awakening';
  speakBtn.disabled = !isAwakened;
  updateBtn.disabled = !isAwakened;
  autoLoopCheckbox.disabled = !isAwakened;
}

// Speech recognition
function setupSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('Speech recognition not supported');
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => {
    isListening = true;
    speakBtn.textContent = 'Listening...';
    statusText.textContent = 'Listening...';
  };
  
  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('Heard:', transcript);
    
    statusText.textContent = `You said: "${transcript}"`;
    
    // Process the input
    await processInput(transcript);
    
    speakBtn.textContent = 'Speak (L)';
    isListening = false;
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    speakBtn.textContent = 'Speak (L)';
    statusText.textContent = 'Speech error. Press L to try again.';
  };
  
  recognition.onend = () => {
    isListening = false;
    speakBtn.textContent = 'Speak (L)';
  };
}

function startListening() {
  if (recognition && !isListening && embodimentState.phase === 'awakened') {
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  }
}

// Event listeners
beginBtn.addEventListener('click', () => {
  processInput('Begin');
});

continueBtn.addEventListener('click', () => {
  processInput('Continue');
});

awakenBtn.addEventListener('click', () => {
  awaken();
});

speakBtn.addEventListener('click', () => {
  startListening();
});

updateBtn.addEventListener('click', () => {
  processInput('');
});

autoLoopCheckbox.addEventListener('change', (event) => {
  autoLoopEnabled = event.target.checked;
  if (autoLoopEnabled) {
    statusText.textContent = 'Auto-loop enabled';
    // Kick off first auto-loop
    processInput('');
  } else {
    statusText.textContent = 'Auto-loop disabled';
  }
});

// Keyboard controls
document.addEventListener('keydown', (event) => {
  if (event.key === 'l' || event.key === 'L') {
    if (embodimentState.phase === 'awakened') {
      startListening();
    }
  }
  if (event.key === 'u' || event.key === 'U') {
    if (embodimentState.phase === 'awakened') {
      processInput('');
    }
  }
});

// Initialize
async function init() {
  await fetchState();
  setupSpeechRecognition();
  
  // Periodic state refresh
  setInterval(fetchState, 2000);
}

init();

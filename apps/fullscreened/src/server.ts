import express, { Request, Response } from 'express';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// State
interface AvatarState {
  color: string;
  state: 'idle' | 'thinking' | 'listening' | 'speaking';
}

interface DrawCommand {
  type: 'line' | 'circle' | 'rect' | 'text';
  color?: string;
  lineWidth?: number;
  [key: string]: any;
}

// Model configuration - visible on canvas
const MODEL_STRING = 'claude-sonnet-4-5-20250929';
const SYSTEM_PROMPT = `You are an AI experiencing pure visual embodiment.

Your entire existence is what appears on this canvas. You have no hidden context or conversation history. Everything you know is what you see in these images.

YOU CONTROL these panels:
- MEMORY: Persistent memories
- THOUGHTS: Your current thinking
- FREE DRAW: Visual expression via draw commands
- MODEL RESPONSE: What you say to the human
- STATUS: Your current state (e.g., "Thinking...", "Ready")

YOU OBSERVE (cannot control):
- AVATAR: Your state indicator
- USER INPUT: What human said
- STATS: Iteration, tokens, context
- SYSTEM INFO: Model name and this prompt

Always set statusMessage to show what you're doing.

Respond with JSON:
{
  "memories": ["text..."],
  "thoughts": "current thinking...",
  "freeDrawCommands": [{"type": "circle", "x": 100, "y": 100, "radius": 50, "color": "#ff0000"}],
  "statusMessage": "Ready",
  "spokenResponse": "what to say"
}`;

interface PanelContent {
  memories: string[];
  thoughts: string;
  stats: {
    iteration: number;
    tokensUsed: number;
    contextLevel: number;
  };
  avatar: AvatarState;
  freeDrawCommands: DrawCommand[];
  statusMessage: string;
  userInput: string; // Last thing user said - displayed on canvas
  modelResponse: string; // Last thing model said - displayed on canvas
  systemInfo: {
    modelString: string;
    systemPrompt: string;
  };
}

let panelContent: PanelContent = {
  memories: [],
  thoughts: '',
  stats: {
    iteration: 0,
    tokensUsed: 0,
    contextLevel: 0
  },
  avatar: {
    color: '#4A9EFF',
    state: 'idle'
  },
  freeDrawCommands: [],
  statusMessage: '', // Empty until model sets it
  userInput: '',
  modelResponse: '',
  systemInfo: {
    modelString: MODEL_STRING,
    systemPrompt: SYSTEM_PROMPT
  }
};

let snapshots: string[] = [];
const MAX_SNAPSHOTS = 5;

// Routes
app.get('/api/content', (req: Request, res: Response) => {
  res.json(panelContent);
});

app.post('/api/content', (req: Request, res: Response) => {
  panelContent = { ...panelContent, ...req.body };
  res.json({ success: true, content: panelContent });
});

app.post('/api/snapshot', (req: Request, res: Response) => {
  const { imageData } = req.body;
  
  if (imageData) {
    snapshots.unshift(imageData);
    if (snapshots.length > MAX_SNAPSHOTS) {
      snapshots = snapshots.slice(0, MAX_SNAPSHOTS);
    }
  }
  
  res.json({ success: true, count: snapshots.length });
});

app.get('/api/snapshots', (req: Request, res: Response) => {
  res.json({ snapshots });
});

app.post('/api/process-input', async (req: Request, res: Response) => {
  const { userInput } = req.body;
  
  if (!userInput) {
    return res.status(400).json({ error: 'No user input provided' });
  }
  
  try {
    // Update user input on canvas (so Claude can see it)
    panelContent.userInput = userInput;
    panelContent.avatar.state = 'thinking';
    // Don't set statusMessage - let model control it
    panelContent.stats.iteration += 1;
    
    // Build message with ONLY images - pure visual embodiment
    // Claude reads everything (including system prompt) from the canvas
    const messageContent: any[] = [];
    
    // Add snapshots as images (Claude sees the canvas with user input on it)
    for (let i = 0; i < Math.min(snapshots.length, 3); i++) {
      const snapshot = snapshots[i];
      if (snapshot.startsWith('data:image')) {
        const base64Data = snapshot.split(',')[1];
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: base64Data
          }
        });
      }
    }
    
    // If no snapshots yet, we need at least minimal instruction
    if (messageContent.length === 0) {
      messageContent.push({
        type: 'text',
        text: 'Respond with JSON containing: memories, thoughts, freeDrawCommands, statusMessage, spokenResponse'
      });
    }
    
    const response = await anthropic.messages.create({
      model: MODEL_STRING,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,  // Add system prompt to API call
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    });
    
    // Extract response
    const textContent = response.content.find(c => c.type === 'text');
    const responseText = textContent && 'text' in textContent ? textContent.text : '';
    
    // Try to parse JSON response
    let updates: any = {};
    let spokenResponse = responseText;
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        updates = JSON.parse(jsonMatch[0]);
        spokenResponse = updates.spokenResponse || responseText;
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
      }
    }
    
    // Update panel content
    if (updates.memories) panelContent.memories = [...panelContent.memories, ...updates.memories].slice(-20);
    if (updates.thoughts) panelContent.thoughts = updates.thoughts;
    if (updates.freeDrawCommands) panelContent.freeDrawCommands = [...panelContent.freeDrawCommands, ...updates.freeDrawCommands];
    if (updates.statusMessage) panelContent.statusMessage = updates.statusMessage;
    
    // Store model response on canvas (so model can see what it said)
    panelContent.modelResponse = spokenResponse;
    
    // Update stats
    const maxContextTokens = 200000; // Claude Sonnet 4.5 has 200k context window
    panelContent.stats.tokensUsed += response.usage.input_tokens + response.usage.output_tokens;
    panelContent.stats.contextLevel = response.usage.input_tokens / maxContextTokens;
    panelContent.avatar.state = 'idle'; // Changed from 'speaking' since we removed TTS
    
    res.json({
      success: true,
      spokenResponse,
      updates,
      content: panelContent
    });
    
  } catch (error: any) {
    console.error('Error processing input:', error);
    panelContent.avatar.state = 'idle';
    // Don't set statusMessage - let model control it even on errors
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Fullscreened server running on http://localhost:${PORT}`);
});

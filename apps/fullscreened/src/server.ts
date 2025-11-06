import express, { Request, Response } from 'express';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

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
  statusMessage: 'Waiting for input...'
};

let snapshots: string[] = [];
const MAX_SNAPSHOTS = 5;
let conversationHistory: any[] = [];

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
    // Update avatar state
    panelContent.avatar.state = 'thinking';
    panelContent.statusMessage = 'Processing...';
    panelContent.stats.iteration += 1;
    
    // Build message with snapshots
    const messageContent: any[] = [
      {
        type: 'text',
        text: `You are an AI with visual memory and a structured UI for expression.

Your UI has these panels:
- MEMORIES: Persistent memories you want to keep
- THOUGHTS: Your current thinking process (visible to user)
- FREE DRAW: Canvas for visual expression via draw commands
- AVATAR: Your visual representation
- STATS: Iteration count, tokens used, context level

User said: "${userInput}"

${snapshots.length > 0 ? `Here are the last ${snapshots.length} UI states:` : 'No previous snapshots available yet.'}

Please respond with JSON in this format:
{
  "memories": ["memory text..."],
  "thoughts": "your current thoughts...",
  "freeDrawCommands": [{"type": "circle", "x": 100, "y": 100, "radius": 50, "color": "#ff0000"}],
  "statusMessage": "status text...",
  "spokenResponse": "what you want to say to the user"
}`
      }
    ];
    
    // Add snapshots as images
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
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        ...conversationHistory,
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
    
    // Update stats
    panelContent.stats.tokensUsed += response.usage.input_tokens + response.usage.output_tokens;
    panelContent.avatar.state = 'speaking';
    
    // Add to conversation history
    conversationHistory.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: responseText }
    );
    
    // Keep history manageable
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }
    
    res.json({
      success: true,
      spokenResponse,
      updates,
      content: panelContent
    });
    
  } catch (error: any) {
    console.error('Error processing input:', error);
    panelContent.avatar.state = 'idle';
    panelContent.statusMessage = 'Error occurred';
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Fullscreened server running on http://localhost:${PORT}`);
});

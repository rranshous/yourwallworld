import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json({limit: '50mb'}));
app.use(express.static('public'));

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const MODEL_STRING = 'claude-sonnet-4-5-20250929';

// System prompt explaining the shared canvas concept
const SYSTEM_PROMPT = `You are collaborating with a human in a shared communication space called "Context Canvas."

The canvas is a visual workspace where both you and the human can see and contribute. It serves as:
- A shared understanding space
- A place for visual collaboration
- A medium for expressing ideas, thoughts, and concepts

You will receive:
1. A screenshot of the current canvas (what it looks like visually)
2. The JavaScript code that renders the canvas (the precise structure)

Both representations help you understand the canvas from different perspectives - visual appearance and programmatic structure.

The human can see the canvas visually. You can see both the visual representation and the code that creates it.

This is a collaborative space - be aware of what's on the canvas and reference it naturally in conversation.`;

// Store conversation history
interface Message {
  role: 'user' | 'assistant';
  content: string | any[]; // Can be text or array of content blocks
}

let conversationHistory: Message[] = [];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Context Canvas server running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, canvasScreenshot, canvasJS } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Build user message content with canvas context
    const userContent: any[] = [];
    
    // Add canvas screenshot if available
    if (canvasScreenshot && canvasScreenshot.startsWith('data:image')) {
      const base64Data = canvasScreenshot.split(',')[1];
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64Data
        }
      });
    }
    
    // Add canvas JS code if available
    if (canvasJS) {
      userContent.push({
        type: 'text',
        text: `Current Canvas JavaScript:\n\`\`\`javascript\n${canvasJS}\n\`\`\``
      });
    }
    
    // Add user's text message
    userContent.push({
      type: 'text',
      text: message
    });
    
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: userContent
    });
    
    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: MODEL_STRING,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });
    
    // Extract text response
    const textContent = response.content.find(c => c.type === 'text');
    const assistantMessage = textContent && 'text' in textContent ? textContent.text : '';
    
    // Add assistant response to history (as simple text)
    conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });
    
    // Keep history manageable (last 10 messages = 5 exchanges)
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }
    
    res.json({
      success: true,
      response: assistantMessage
    });
    
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Context Canvas server running on http://localhost:${PORT}`);
});

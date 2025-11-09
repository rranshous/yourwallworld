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

// Store conversation history
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

let conversationHistory: Message[] = [];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Context Canvas server running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message
    });
    
    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: MODEL_STRING,
      max_tokens: 4096,
      system: 'You are a helpful AI assistant collaborating with a human in a shared communication space called Context Canvas.',
      messages: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });
    
    // Extract text response
    const textContent = response.content.find(c => c.type === 'text');
    const assistantMessage = textContent && 'text' in textContent ? textContent.text : '';
    
    // Add assistant response to history
    conversationHistory.push({
      role: 'assistant',
      content: assistantMessage
    });
    
    // Keep history manageable (last 20 messages)
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
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

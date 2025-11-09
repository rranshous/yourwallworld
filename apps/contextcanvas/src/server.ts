import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { createCanvas } from 'canvas';

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

// Tool definition for canvas drawing
const CANVAS_TOOL = {
  name: 'update_canvas',
  description: 'Add drawing commands to the shared canvas. Provide raw JavaScript code that uses the canvas context (ctx) to draw. The code will be appended to the existing canvas JavaScript. You can draw shapes, text, lines, etc. The canvas and ctx variables are available.',
  input_schema: {
    type: 'object' as const,
    properties: {
      javascript_code: {
        type: 'string',
        description: 'Raw JavaScript code using canvas context (ctx) to draw. Examples: ctx.fillStyle = "#ff0000"; ctx.fillRect(100, 100, 50, 50); or ctx.strokeStyle = "#0000ff"; ctx.beginPath(); ctx.arc(200, 200, 30, 0, Math.PI * 2); ctx.stroke();'
      }
    },
    required: ['javascript_code']
  }
};

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

You have a tool called "update_canvas" that lets you add drawing commands to the canvas. Use it to draw shapes, text, or any visual elements. The JavaScript code you provide will be appended to the existing canvas code.

This is a collaborative space - be aware of what's on the canvas and reference it naturally in conversation. When asked to draw something, use the update_canvas tool.`;

// Store conversation history
interface Message {
  role: 'user' | 'assistant';
  content: string | any[]; // Can be text or array of content blocks
}

let conversationHistory: Message[] = [];

// Function to render canvas JS on server and return base64 screenshot
function renderCanvasOnServer(canvasJSCode: string, width: number, height: number): string {
  try {
    console.log(`Rendering canvas on server: ${width}x${height}`);
    
    // Create a canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Execute the canvas JS code
    // Note: We need to be careful with eval, but this is our own generated code
    eval(canvasJSCode);
    
    // Convert to base64 PNG
    const buffer = canvas.toBuffer('image/png');
    const base64 = buffer.toString('base64');
    
    console.log('Server-side rendering complete, image size:', buffer.length, 'bytes');
    
    return `data:image/png;base64,${base64}`;
  } catch (error: any) {
    console.error('Error rendering canvas on server:', error.message);
    // Return a blank canvas on error
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f48771';
    ctx.font = '14px Arial';
    ctx.fillText('Error rendering: ' + error.message, 20, 20);
    const buffer = canvas.toBuffer('image/png');
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Context Canvas server running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, canvasScreenshot, canvasJS, canvasDimensions } = req.body;
  
  console.log('\n=== NEW CHAT REQUEST ===');
  console.log('Message:', message);
  console.log('Canvas JS length:', canvasJS?.length || 0);
  console.log('Has screenshot:', !!canvasScreenshot);
  console.log('Canvas dimensions:', canvasDimensions);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Track updated canvas JS through tool uses
    let currentCanvasJS = canvasJS || '';
    let currentScreenshot = canvasScreenshot;
    const canvasWidth = canvasDimensions?.width || 1600;
    const canvasHeight = canvasDimensions?.height || 900;
    
    // Build initial user message content with canvas context
    const userContent: any[] = [];
    
    // Add canvas screenshot if available
    if (currentScreenshot && currentScreenshot.startsWith('data:image')) {
      const base64Data = currentScreenshot.split(',')[1];
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64Data
        }
      });
      console.log('Added canvas screenshot to message');
    }
    
    // Add canvas JS code if available
    if (currentCanvasJS) {
      userContent.push({
        type: 'text',
        text: `Current Canvas JavaScript:\n\`\`\`javascript\n${currentCanvasJS}\n\`\`\``
      });
      console.log('Added canvas JS to message');
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
    console.log('Added user message to history. History length:', conversationHistory.length);
    
    // Tool use loop - keep calling API while model wants to use tools
    // Use a temporary message array for the tool loop
    let finalResponse: any = null;
    let toolUses: any[] = [];
    const tempMessages = [...conversationHistory]; // Work with a copy
    
    let loopCount = 0;
    while (true) {
      loopCount++;
      console.log(`\n--- API Call #${loopCount} ---`);
      console.log('Temp messages length:', tempMessages.length);
      
      // Call Anthropic API
      const response = await anthropic.messages.create({
        model: MODEL_STRING,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: [CANVAS_TOOL],
        messages: tempMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });
      
      console.log('API Response received');
      console.log('Response content blocks:', response.content.length);
      response.content.forEach((block: any, i: number) => {
        console.log(`  Block ${i}: type=${block.type}`);
      });
      
      finalResponse = response;
      
      // Check if response contains tool_use blocks
      const toolUseBlocks = response.content.filter((block: any) => block.type === 'tool_use');
      
      console.log('Tool use blocks found:', toolUseBlocks.length);
      
      if (toolUseBlocks.length === 0) {
        // No more tool uses, we're done
        console.log('No tool uses, exiting loop');
        break;
      }
      
      // Add assistant's response (with tool_use blocks) to temp messages
      tempMessages.push({
        role: 'assistant',
        content: response.content
      });
      
      console.log('Processing', toolUseBlocks.length, 'tool use blocks');
      
      // Execute tools and update canvas JS
      for (const toolUse of toolUseBlocks) {
        if ((toolUse as any).name === 'update_canvas') {
          const jsCode = (toolUse as any).input.javascript_code;
          console.log('Tool use ID:', (toolUse as any).id);
          console.log('JS code length:', jsCode.length);
          // Add comment indicating AI drew this
          currentCanvasJS += '\n// Drawn by AI\n' + jsCode;
          toolUses.push({ id: (toolUse as any).id, code: jsCode });
        }
      }
      
      // Render updated canvas on server
      console.log('Rendering updated canvas on server...');
      currentScreenshot = renderCanvasOnServer(currentCanvasJS, canvasWidth, canvasHeight);
      
      // Build tool result message with updated canvas context
      const toolResultContent: any[] = [];
      
      // Add tool_result blocks
      for (const toolUse of toolUseBlocks) {
        toolResultContent.push({
          type: 'tool_result',
          tool_use_id: (toolUse as any).id,
          content: 'Drawing commands added to canvas successfully.'
        });
      }
      
      // Add updated canvas screenshot
      if (currentScreenshot && currentScreenshot.startsWith('data:image')) {
        const base64Data = currentScreenshot.split(',')[1];
        toolResultContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: base64Data
          }
        });
        console.log('Added updated canvas screenshot to tool result');
      }
      
      // Add updated canvas JS
      toolResultContent.push({
        type: 'text',
        text: `Updated Canvas JavaScript:\n\`\`\`javascript\n${currentCanvasJS}\n\`\`\``
      });
      
      // Add tool result message to temp messages
      tempMessages.push({
        role: 'user',
        content: toolResultContent
      });
      
      console.log('Added tool results with updated screenshot, looping back for next API call');
    }
    
    console.log('\n--- Processing Final Response ---');
    
    // Extract final text response
    const textContent = finalResponse.content.find((c: any) => c.type === 'text');
    const assistantMessage = textContent && 'text' in textContent ? textContent.text : '';
    
    console.log('Final assistant message:', assistantMessage || '(empty)');
    console.log('Total tool uses:', toolUses.length);
    console.log('Updated canvas JS length:', currentCanvasJS.length);
    
    // Add final assistant response to history (as simple text)
    if (assistantMessage) {
      conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });
    }
    
    // Keep history manageable (last 10 messages = 5 exchanges)
    if (conversationHistory.length > 10) {
      conversationHistory = conversationHistory.slice(-10);
    }
    
    console.log('Final conversation history length:', conversationHistory.length);
    console.log('=== REQUEST COMPLETE ===\n');
    
    res.json({
      success: true,
      response: assistantMessage,
      canvasJS: currentCanvasJS,
      toolUses: toolUses.map(t => ({ code: t.code }))
    });
    
  } catch (error: any) {
    console.error('\n!!! ERROR IN CHAT ENDPOINT !!!');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('!!! END ERROR !!!\\n');
    
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Context Canvas server running on http://localhost:${PORT}`);
});

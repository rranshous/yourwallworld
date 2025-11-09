import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { createCanvas } from 'canvas';
import { chromium } from 'playwright';

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

// Tool definition for importing web pages
const IMPORT_WEBPAGE_TOOL = {
  name: 'import_webpage',
  description: 'Import a screenshot of a webpage into the canvas. The webpage will be captured as an image and placed on the canvas at the specified position. You can control the browser viewport size to capture desktop vs mobile views.',
  input_schema: {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'The URL of the webpage to import (e.g., "https://example.com")'
      },
      x: {
        type: 'number',
        description: 'X coordinate for the top-left corner of the image (optional, defaults to 20)'
      },
      y: {
        type: 'number',
        description: 'Y coordinate for the top-left corner of the image (optional, defaults to 20)'
      },
      viewport_width: {
        type: 'number',
        description: 'Browser viewport width in pixels (optional, defaults to 1200). Use 1920 for desktop, 375 for mobile, 768 for tablet.'
      },
      viewport_height: {
        type: 'number',
        description: 'Browser viewport height in pixels (optional, defaults to 900)'
      }
    },
    required: ['url']
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

You have two tools available:

1. **update_canvas**: Add drawing commands to the canvas. Use it to draw shapes, text, or any visual elements. The JavaScript code you provide will be appended to the existing canvas code.

2. **import_webpage**: Import a screenshot of any webpage into the canvas. Provide a URL and optional x, y position. This lets you bring external web content into the shared space for reference and discussion.

This is a collaborative space - be aware of what's on the canvas and reference it naturally in conversation. When asked to draw or add content, use the appropriate tool.`;

// Store conversation history
interface Message {
  role: 'user' | 'assistant';
  content: string | any[]; // Can be text or array of content blocks
}

let conversationHistory: Message[] = [];

// Function to render canvas JS on server and return base64 screenshot
async function renderCanvasOnServer(canvasJSCode: string, width: number, height: number): Promise<string> {
  try {
    console.log(`Rendering canvas on server: ${width}x${height}`);
    
    // Create a canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Polyfill Image for server-side rendering (node-canvas provides this, but need to import)
    const { Image } = require('canvas');
    
    // Execute the canvas JS code
    // Note: We need to be careful with eval, but this is our own generated code
    eval(canvasJSCode);
    
    // Wait a bit for Image onload callbacks to fire (data URIs load fast from memory)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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

// Redact embedded image data URIs from canvas JS (they can be huge and model doesn't need them)
function redactImageDataFromJS(js: string): string {
  // Replace data:image/... base64 strings with a placeholder
  // Matches: data:image/png;base64,iVBORw0... or data:image/jpeg;base64,/9j/4...
  return js.replace(
    /(data:image\/[^;]+;base64,)[A-Za-z0-9+/=]{100,}/g,
    '$1[REDACTED_IMAGE_DATA]'
  );
}

// Screenshot a webpage using Playwright
async function screenshotWebpage(url: string, viewportWidth: number = 1200, viewportHeight: number = 900): Promise<string> {
  let browser;
  try {
    console.log(`Screenshotting webpage: ${url} (viewport: ${viewportWidth}×${viewportHeight})`);

    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid URL protocol. Only http and https are supported.');
    }

    // Launch headless browser (include no-sandbox flags for container environments)
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext({
      viewport: { 
        width: Math.max(320, Math.min(viewportWidth, 3840)),  // Clamp between 320px and 4K
        height: Math.max(240, Math.min(viewportHeight, 2160)) 
      },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    // Use a sensible default navigation timeout, but be resilient to "networkidle" timeouts
    page.setDefaultNavigationTimeout(30000);

    let navigated = false;
    try {
      // Try the stricter wait first (may fail on sites with persistent connections)
      await page.goto(url, { timeout: 5000, waitUntil: 'networkidle' });
      navigated = true;
    } catch (err: any) {
      console.warn('networkidle navigation failed, falling back to domcontentloaded:', err.message);
    }

    if (!navigated) {
      // Retry with a more permissive wait (domcontentloaded) and longer timeout
      await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
    }

    // Give the page a short moment to settle (CSS/images may still be loading)
    await page.waitForTimeout(500);

    // Take screenshot (viewport only, with quality reduction to manage size)
    const screenshot = await page.screenshot({ 
      type: 'jpeg',  // Use JPEG instead of PNG for better compression
      quality: 75,    // Reasonable quality vs size tradeoff
      fullPage: false 
    });

    await browser.close();

    // Convert to base64
    const base64 = screenshot.toString('base64');
    console.log(`Screenshot captured, size: ${screenshot.length} bytes`);

    return `data:image/jpeg;base64,${base64}`;
  } catch (error: any) {
    if (browser) await browser.close();
    console.error('Error screenshotting webpage:', error?.message || error);
    throw new Error(`Failed to screenshot webpage: ${error?.message || error}`);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Context Canvas server running' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, fullCanvasScreenshot, viewportScreenshot, canvasJS, canvasDimensions, viewport } = req.body;
  
  console.log('\n=== NEW CHAT REQUEST ===');
  console.log('Message:', message);
  console.log('Canvas JS length:', canvasJS?.length || 0);
  console.log('Has full canvas screenshot:', !!fullCanvasScreenshot);
  console.log('Has viewport screenshot:', !!viewportScreenshot);
  console.log('Canvas dimensions:', canvasDimensions);
  console.log('Viewport:', viewport);
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    // Track updated canvas JS through tool uses
    let currentCanvasJS = canvasJS || '';
    let currentFullScreenshot = fullCanvasScreenshot;
    let currentViewportScreenshot = viewportScreenshot;
    const canvasWidth = canvasDimensions?.width || 1600;
    const canvasHeight = canvasDimensions?.height || 900;
    
    // Build initial user message content with canvas context
    const userContent: any[] = [];
    
    // Add full canvas screenshot if available
    if (currentFullScreenshot && currentFullScreenshot.startsWith('data:image')) {
      const base64Data = currentFullScreenshot.split(',')[1];
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64Data
        }
      });
      console.log('Added full canvas screenshot to message');
    }
    
    // Add viewport screenshot if available (and different from full canvas)
    if (currentViewportScreenshot && 
        currentViewportScreenshot.startsWith('data:image') &&
        viewport && (viewport.scale !== 1.0 || viewport.offsetX !== 0 || viewport.offsetY !== 0)) {
      const base64Data = currentViewportScreenshot.split(',')[1];
      userContent.push({
        type: 'text',
        text: `User's current focus area (zoomed/panned view):`
      });
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/png',
          data: base64Data
        }
      });
      console.log('Added viewport screenshot to message');
    }
    
    // Add canvas JS code if available (redact embedded images to save tokens)
    if (currentCanvasJS) {
      const redactedJS = redactImageDataFromJS(currentCanvasJS);
      userContent.push({
        type: 'text',
        text: `Current Canvas JavaScript (canvas size: ${canvasWidth}×${canvasHeight}):\n\`\`\`javascript\n${redactedJS}\n\`\`\``
      });
      console.log('Added canvas JS to message (with image data redacted)');
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
        tools: [CANVAS_TOOL, IMPORT_WEBPAGE_TOOL],
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
        const toolName = (toolUse as any).name;
        
        if (toolName === 'update_canvas') {
          const jsCode = (toolUse as any).input.javascript_code;
          console.log('Tool: update_canvas, ID:', (toolUse as any).id);
          console.log('JS code length:', jsCode.length);
          // Add comment indicating AI drew this
          currentCanvasJS += '\n// Drawn by AI\n' + jsCode;
          toolUses.push({ id: (toolUse as any).id, code: jsCode });
        } else if (toolName === 'import_webpage') {
          const url = (toolUse as any).input.url;
          const x = (toolUse as any).input.x || 20;
          const y = (toolUse as any).input.y || 20;
          const viewportWidth = (toolUse as any).input.viewport_width || 1200;
          const viewportHeight = (toolUse as any).input.viewport_height || 900;
          
          console.log('Tool: import_webpage, ID:', (toolUse as any).id);
          console.log('URL:', url, 'Position:', x, y, 'Viewport:', viewportWidth, 'x', viewportHeight);
          
          try {
            // Screenshot the webpage
            const imageDataUri = await screenshotWebpage(url, viewportWidth, viewportHeight);
            
            // Generate unique ID for this image
            const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(7);
            
            // Generate canvas JS to draw the image
            const imageJS = `
// Imported webpage: ${url}
const ${imageId} = new Image();
${imageId}.onload = function() {
  ctx.drawImage(${imageId}, ${x}, ${y});
};
${imageId}.src = '${imageDataUri}';
// For server-side rendering: node-canvas loads synchronously, so draw immediately if complete
if (${imageId}.complete) {
  ctx.drawImage(${imageId}, ${x}, ${y});
}`;
            
            currentCanvasJS += '\n' + imageJS;
            toolUses.push({ id: (toolUse as any).id, code: imageJS, type: 'import_webpage', url });
          } catch (error: any) {
            console.error('Error importing webpage:', error.message);
            // Add error text to canvas instead
            const errorJS = `
// Failed to import webpage: ${url}
ctx.fillStyle = '#f48771';
ctx.font = '14px Arial';
ctx.fillText('Failed to import: ${url}', ${x}, ${y});
ctx.fillText('Error: ${error.message}', ${x}, ${y + 20});`;
            currentCanvasJS += '\n' + errorJS;
            toolUses.push({ id: (toolUse as any).id, code: errorJS, type: 'import_webpage_error', url });
          }
        }
      }
      
      // Render updated canvas on server
      console.log('Rendering updated canvas on server...');
      currentFullScreenshot = await renderCanvasOnServer(currentCanvasJS, canvasWidth, canvasHeight);
      
      // Build tool result message with updated canvas context
      const toolResultContent: any[] = [];
      
      // Add tool_result blocks
      for (const toolUse of toolUseBlocks) {
        const toolName = (toolUse as any).name;
        let resultMessage = 'Operation completed successfully.';
        
        if (toolName === 'update_canvas') {
          resultMessage = 'Drawing commands added to canvas successfully.';
        } else if (toolName === 'import_webpage') {
          const url = (toolUse as any).input.url;
          resultMessage = `Webpage imported successfully from ${url}`;
        }
        
        toolResultContent.push({
          type: 'tool_result',
          tool_use_id: (toolUse as any).id,
          content: resultMessage
        });
      }
      
      // Add updated canvas screenshot
      if (currentFullScreenshot && currentFullScreenshot.startsWith('data:image')) {
        const base64Data = currentFullScreenshot.split(',')[1];
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
      
      // Add updated canvas JS (redact image data to save tokens)
      toolResultContent.push({
        type: 'text',
        text: `Updated Canvas JavaScript:\n\`\`\`javascript\n${redactImageDataFromJS(currentCanvasJS)}\n\`\`\``
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
      toolUses: toolUses.map(t => ({ code: t.code })),
      usage: finalResponse.usage // Include token usage from last API call
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

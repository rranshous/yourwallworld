import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
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

// Tool definition for canvas drawing (append mode)
const APPEND_TO_CANVAS_TOOL = {
  name: 'append_to_canvas',
  description: 'Add new drawing commands to the existing canvas. Provide raw JavaScript code that uses the canvas context (ctx) to draw. The code will be APPENDED after all existing canvas code, so it layers on top of what\'s already there. Use this to add new elements while preserving existing content.',
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

// Tool definition for canvas replacement (replace mode)
const REPLACE_CANVAS_TOOL = {
  name: 'replace_canvas',
  description: 'Replace the entire canvas with new code. This REMOVES all existing content and starts fresh. Use this to reorganize, refactor, or fix mistakes. All canvas elements including images will be preserved in the new code.',
  input_schema: {
    type: 'object' as const,
    properties: {
      javascript_code: {
        type: 'string',
        description: 'Complete JavaScript code to render the entire canvas from scratch. Should include background setup and all drawing commands.'
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

// Tool definition for updating specific canvas elements
const UPDATE_ELEMENT_TOOL = {
  name: 'update_element',
  description: 'Update a specific named element on the canvas without rewriting everything. Elements are marked with comments like // ELEMENT: name and // END ELEMENT: name. Use this for efficient editing of large canvases - only the specified element changes.',
  input_schema: {
    type: 'object' as const,
    properties: {
      element_name: {
        type: 'string',
        description: 'Name of the element to update (matches the name in // ELEMENT: name comment)'
      },
      javascript_code: {
        type: 'string',
        description: 'New JavaScript code for this element. Should NOT include the ELEMENT markers - just the code itself.'
      },
      create_if_missing: {
        type: 'boolean',
        description: 'If true and element doesn\'t exist, append it to the canvas. If false and element doesn\'t exist, return an error. Default: false.'
      }
    },
    required: ['element_name', 'javascript_code']
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

You have four tools available:

1. **append_to_canvas**: Add new drawing commands to the existing canvas. Use this to layer new content on top of what's already there. The code you provide will be appended after all existing canvas code. This is the safe, additive way to build up the canvas.

2. **replace_canvas**: Replace the entire canvas with new code. Use this to reorganize, refactor, or start fresh. This removes all existing content, so make sure to include everything you want in the new code.

3. **update_element**: Update a specific named element on the canvas without rewriting everything else. Elements are marked with comments like // ELEMENT: timeline and // END ELEMENT: timeline. This is the MOST EFFICIENT way to make changes to large canvases. Use it whenever you're modifying an existing element rather than adding new content.

4. **import_webpage**: Import a screenshot of any webpage into the canvas. Provide a URL and optional position/viewport size. This lets you bring external web content into the shared space for reference and discussion.

**Canvas JavaScript Capabilities**:
The canvas JavaScript code runs in a real browser environment with full JavaScript support, including:
- **Event handlers**: setTimeout, setInterval for animations
- **Async code**: Promises, async/await, fetch calls
- **DOM APIs**: Full browser APIs available
- **Image loading**: Images load properly with onload callbacks
- **Interactive elements**: You can create dynamic, time-based, or interactive canvas content

The canvas is re-rendered regularly (on viewport changes, user actions), so:
- Animations using setInterval/setTimeout work perfectly
- Event handlers and timers persist across renders
- You can create evolving or interactive visualizations

**Best Practices for Elements**:
- When creating new canvas sections, wrap them in ELEMENT markers with descriptive names
- Use update_element to modify existing elements - much more token-efficient than replace_canvas
- Element names should be descriptive: "timeline", "header", "fish_animation", "notes"
- Old code without markers still works, but adding markers makes future edits easier

This is a collaborative space - be aware of what's on the canvas and reference it naturally in conversation. When asked to draw or add content, use the appropriate tool.`;

// Store conversation history
interface Message {
  role: 'user' | 'assistant';
  content: string | any[]; // Can be text or array of content blocks
}

let conversationHistory: Message[] = [];

// Function to render canvas JS on server using real browser and return base64 screenshot
async function renderCanvasOnServer(canvasJSCode: string, width: number, height: number): Promise<string> {
  try {
    console.log(`Rendering canvas in browser: ${width}x${height}`);
    
    // Create HTML page with canvas
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Execute user's canvas code
    ${canvasJSCode}
  </script>
</body>
</html>
`;
    
    // Render with Playwright
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: width, height: height });
    await page.setContent(html);
    
    // Wait for images to load and animations to settle
    await page.waitForTimeout(500);
    
    // Screenshot the canvas element
    const canvasElement = await page.$('#canvas');
    if (!canvasElement) {
      throw new Error('Canvas element not found');
    }
    
    const screenshot = await canvasElement.screenshot({ type: 'png' });
    await browser.close();
    
    const base64 = screenshot.toString('base64');
    console.log('Browser rendering complete, image size:', screenshot.length, 'bytes');
    
    return `data:image/png;base64,${base64}`;
  } catch (error: any) {
    console.error('Error rendering canvas in browser:', error.message);
    
    // Return error canvas using browser too (for consistency)
    try {
      const errorHtml = `
<!DOCTYPE html>
<html>
<body>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ${width}, ${height});
    ctx.fillStyle = '#f48771';
    ctx.font = '14px Arial';
    ctx.fillText('Error rendering: ${error.message.replace(/'/g, "\\'")}', 20, 20);
  </script>
</body>
</html>
`;
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(errorHtml);
      const canvasElement = await page.$('#canvas');
      const screenshot = await canvasElement!.screenshot({ type: 'png' });
      await browser.close();
      return `data:image/png;base64,${screenshot.toString('base64')}`;
    } catch {
      // If even error rendering fails, return empty string
      return '';
    }
  }
}

// Parse and extract elements from canvas JS
function parseElements(canvasJS: string): Map<string, {start: number, end: number, code: string}> {
  const elements = new Map();
  const lines = canvasJS.split('\n');
  
  let currentElement: string | null = null;
  let startLine = -1;
  let elementLines: string[] = [];
  
  lines.forEach((line, index) => {
    const startMatch = line.match(/\/\/\s*ELEMENT:\s*(\w+)/i);
    const endMatch = line.match(/\/\/\s*END\s+ELEMENT:\s*(\w+)/i);
    
    if (startMatch) {
      currentElement = startMatch[1];
      startLine = index;
      elementLines = [];
    } else if (endMatch && currentElement) {
      const elementName = endMatch[1];
      if (elementName.toLowerCase() === currentElement.toLowerCase()) {
        elements.set(currentElement.toLowerCase(), {
          start: startLine,
          end: index,
          code: elementLines.join('\n')
        });
        currentElement = null;
      }
    } else if (currentElement !== null && startLine !== -1) {
      elementLines.push(line);
    }
  });
  
  return elements;
}

// Update a specific element in canvas JS
function updateElement(canvasJS: string, elementName: string, newCode: string, createIfMissing: boolean = false): string {
  const elements = parseElements(canvasJS);
  const elementKey = elementName.toLowerCase();
  
  if (elements.has(elementKey)) {
    // Element exists - replace it
    const element = elements.get(elementKey)!;
    const lines = canvasJS.split('\n');
    
    // Replace lines between start and end markers
    const newLines = [
      ...lines.slice(0, element.start + 1),  // Keep everything before element (including start marker)
      newCode,                                 // New element code
      ...lines.slice(element.end)              // Keep everything after element (including end marker)
    ];
    
    return newLines.join('\n');
  } else if (createIfMissing) {
    // Element doesn't exist - append it with markers
    return canvasJS + `\n// ELEMENT: ${elementName}\n${newCode}\n// END ELEMENT: ${elementName}\n`;
  } else {
    // Element doesn't exist and create_if_missing is false
    throw new Error(`Element "${elementName}" not found on canvas`);
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

// Streaming Chat endpoint (NDJSON format)
app.post('/api/chat-stream', async (req, res) => {
  const { message, fullCanvasScreenshot, viewportScreenshot, canvasJS, canvasName, canvasTemplate, canvasDimensions, viewport } = req.body;
  
  console.log('\n=== NEW STREAMING CHAT REQUEST ===');
  console.log('Message:', message);
  console.log('Canvas name:', canvasName || 'Unknown');
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  // Helper to send streaming JSON events
  const sendEvent = (event: string, data: any) => {
    const logData = {...data};
    if (logData.canvasJS) logData.canvasJS = `[${logData.canvasJS.length} chars]`;
    if (logData.screenshot) logData.screenshot = `[${logData.screenshot.length} chars]`;
    console.log(`[STREAM] Sending event: ${event}`, logData);
    
    // Send as newline-delimited JSON (much simpler than SSE format)
    const eventData = { event, data };
    res.write(JSON.stringify(eventData) + '\n');
  };
  
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
    }
    
    // Add viewport screenshot if available
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
    }
    
    // Add canvas context
    const redactedCanvasJS = redactImageDataFromJS(currentCanvasJS);
    userContent.push({
      type: 'text',
      text: `Canvas: "${canvasName}" (${canvasTemplate})\nDimensions: ${canvasWidth}×${canvasHeight}\n\nCanvas JavaScript:\n\`\`\`javascript\n${redactedCanvasJS}\n\`\`\`\n\nUser message: ${message}`
    });
    
    // Add initial user message to conversation history
    conversationHistory.push({
      role: 'user',
      content: userContent
    });
    
    // Limit conversation history
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }
    
    // Tool loop
    const tempMessages: any[] = [];
    let finalResponse: any = null;
    const maxIterations = 10;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      iteration++;
      console.log(`\n--- Tool Loop Iteration ${iteration} ---`);
      
      // Call Claude API
      const response = await anthropic.messages.create({
        model: MODEL_STRING,
        max_tokens: 19000,
        system: SYSTEM_PROMPT,
        messages: [...conversationHistory, ...tempMessages],
        tools: [APPEND_TO_CANVAS_TOOL, REPLACE_CANVAS_TOOL, UPDATE_ELEMENT_TOOL, IMPORT_WEBPAGE_TOOL].map(tool => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.input_schema
        }))
      });
      
      finalResponse = response;
      
      // Check for tool_use blocks
      const toolUseBlocks = response.content.filter((block: any) => block.type === 'tool_use');
      
      console.log(`Tool use blocks found: ${toolUseBlocks.length}`);
      
      if (toolUseBlocks.length === 0) {
        // No more tool uses - send final text response
        console.log('No tool uses - sending final response');
        const textBlocks = response.content.filter((block: any) => block.type === 'text');
        const responseText = textBlocks.map((block: any) => block.text).join('\n');
        
        console.log(`Response text length: ${responseText.length}`);
        if (responseText) {
          sendEvent('message', { text: responseText });
        }
        sendEvent('usage', { usage: response.usage });
        console.log('Breaking out of tool loop');
        break;
      }
      
      // Check for text blocks alongside tool uses
      const textBlocks = response.content.filter((block: any) => block.type === 'text');
      if (textBlocks.length > 0) {
        const responseText = textBlocks.map((block: any) => block.text).join('\n');
        console.log(`Streaming text with tools (${responseText.length} chars)`);
        sendEvent('message', { text: responseText });
      }
      
      // Add assistant's response to temp messages
      tempMessages.push({
        role: 'assistant',
        content: response.content
      });
      
      // Process tool uses and stream them
      console.log(`Processing ${toolUseBlocks.length} tool uses`);
      const toolResults: any[] = [];
      
      for (const toolUse of toolUseBlocks) {
        const toolName = (toolUse as any).name;
        const toolId = (toolUse as any).id;
        
        if (toolName === 'append_to_canvas') {
          const jsCode = (toolUse as any).input.javascript_code;
          console.log('Tool: append_to_canvas');
          
          currentCanvasJS += '\n// Drawn by AI\n' + jsCode;
          
          // Stream tool use event
          sendEvent('tool_use', { 
            type: 'append', 
            toolId,
            canvasJS: currentCanvasJS 
          });
          
          // Render canvas
          try {
            currentFullScreenshot = await renderCanvasOnServer(currentCanvasJS, canvasWidth, canvasHeight);
            
            // Stream canvas update
            sendEvent('canvas_update', {
              canvasJS: currentCanvasJS,
              screenshot: currentFullScreenshot
            });
          } catch (error: any) {
            console.error('Canvas render error:', error.message);
          }
          
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolId,
            content: 'Drawing commands added to canvas successfully.'
          });
          
        } else if (toolName === 'replace_canvas') {
          const jsCode = (toolUse as any).input.javascript_code;
          console.log('Tool: replace_canvas');
          
          currentCanvasJS = jsCode;
          
          sendEvent('tool_use', { 
            type: 'replace', 
            toolId,
            canvasJS: currentCanvasJS 
          });
          
          try {
            currentFullScreenshot = await renderCanvasOnServer(currentCanvasJS, canvasWidth, canvasHeight);
            
            sendEvent('canvas_update', {
              canvasJS: currentCanvasJS,
              screenshot: currentFullScreenshot
            });
          } catch (error: any) {
            console.error('Canvas render error:', error.message);
          }
          
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolId,
            content: 'Canvas replaced with new content.'
          });
          
        } else if (toolName === 'update_element') {
          const elementName = (toolUse as any).input.element_name;
          const jsCode = (toolUse as any).input.javascript_code;
          const createIfMissing = (toolUse as any).input.create_if_missing || false;
          
          console.log('Tool: update_element, Element:', elementName);
          
          try {
            currentCanvasJS = updateElement(currentCanvasJS, elementName, jsCode, createIfMissing);
            
            sendEvent('tool_use', { 
              type: 'update_element', 
              toolId,
              elementName,
              canvasJS: currentCanvasJS 
            });
            
            currentFullScreenshot = await renderCanvasOnServer(currentCanvasJS, canvasWidth, canvasHeight);
            
            sendEvent('canvas_update', {
              canvasJS: currentCanvasJS,
              screenshot: currentFullScreenshot
            });
            
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolId,
              content: `Element "${elementName}" updated successfully.`
            });
          } catch (error: any) {
            console.error('Error updating element:', error.message);
            
            sendEvent('tool_error', { 
              type: 'update_element_error',
              toolId,
              elementName, 
              error: error.message 
            });
            
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolId,
              content: `Error updating element: ${error.message}`,
              is_error: true
            });
          }
          
        } else if (toolName === 'import_webpage') {
          const url = (toolUse as any).input.url;
          const x = (toolUse as any).input.x || 20;
          const y = (toolUse as any).input.y || 20;
          const viewportWidth = (toolUse as any).input.viewport_width || 1200;
          const viewportHeight = (toolUse as any).input.viewport_height || 900;
          
          console.log('Tool: import_webpage, URL:', url);
          
          try {
            sendEvent('tool_use', { 
              type: 'import_webpage', 
              toolId,
              url 
            });
            
            const imageDataUri = await screenshotWebpage(url, viewportWidth, viewportHeight);
            const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(7);
            
            const imageJS = `
// Imported webpage: ${url}
const ${imageId} = new Image();
${imageId}.src = '${imageDataUri}';
if (${imageId}.complete) {
  ctx.drawImage(${imageId}, ${x}, ${y});
} else {
  ${imageId}.onload = () => { ctx.drawImage(${imageId}, ${x}, ${y}); };
}
`;
            
            currentCanvasJS += '\n' + imageJS;
            
            currentFullScreenshot = await renderCanvasOnServer(currentCanvasJS, canvasWidth, canvasHeight);
            
            sendEvent('canvas_update', {
              canvasJS: currentCanvasJS,
              screenshot: currentFullScreenshot
            });
            
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolId,
              content: `Webpage imported successfully from ${url}`
            });
          } catch (error: any) {
            console.error('Error importing webpage:', error.message);
            
            sendEvent('tool_error', { 
              type: 'import_webpage_error',
              toolId,
              url,
              error: error.message 
            });
            
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolId,
              content: `Error importing webpage: ${error.message}`,
              is_error: true
            });
          }
        }
      }
      
      // Re-capture canvas context for next iteration
      try {
        currentFullScreenshot = await renderCanvasOnServer(currentCanvasJS, canvasWidth, canvasHeight);
      } catch (error: any) {
        console.error('Canvas render error:', error.message);
      }
      
      const redactedCanvasJSForClaude = redactImageDataFromJS(currentCanvasJS);
      
      // Build tool result message
      const toolResultContent: any[] = [];
      
      for (const toolResult of toolResults) {
        toolResultContent.push(toolResult);
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
      }
      
      // Add updated canvas JS
      toolResultContent.push({
        type: 'text',
        text: `Updated canvas JavaScript:\n\`\`\`javascript\n${redactedCanvasJSForClaude}\n\`\`\``
      });
      
      // Add tool results to temp messages
      tempMessages.push({
        role: 'user',
        content: toolResultContent
      });
    }
    
    console.log('\n--- Tool Loop Complete ---');
    console.log('Final iteration:', iteration);
    
    // Send completion event
    sendEvent('done', { 
      canvasJS: currentCanvasJS,
      usage: finalResponse?.usage 
    });
    
    console.log('Stream complete, closing connection');
    
    // Update conversation history
    if (finalResponse) {
      conversationHistory.push({
        role: 'assistant',
        content: finalResponse.content
      });
    }
    
    res.end();
    console.log('=== STREAMING CHAT REQUEST COMPLETE ===\n');
    
  } catch (error: any) {
    console.error('\n!!! ERROR IN STREAMING CHAT !!!');
    console.error('Error:', error.message);
    
    sendEvent('error', { 
      error: 'Failed to process message',
      details: error.message 
    });
    
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Context Canvas server running on http://localhost:${PORT}`);
});

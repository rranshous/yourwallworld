import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface InferenceRequest {
  systemPrompt: string;
  wallImage: string; // base64 encoded webcam capture
  enableThinking: boolean;
  temperature: number;
  previousResponse?: string;
}

async function createMessageWithRetry(params: any, maxRetries = 3): Promise<any> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await anthropic.messages.create(params);
    } catch (error: any) {
      lastError = error;
      
      // Check if it's an overloaded error
      const isOverloaded = error?.error?.error?.type === 'api_error' && 
                          error?.error?.error?.message === 'Overloaded';
      
      if (isOverloaded && attempt < maxRetries - 1) {
        // Exponential backoff: 2s, 4s, 8s
        const waitTime = Math.pow(2, attempt + 1) * 1000;
        console.log(`API overloaded, retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not overloaded or we're out of retries, throw the error
      throw error;
    }
  }
  
  throw lastError;
}

app.post('/api/infer', async (req, res) => {
  try {
    const { systemPrompt, wallImage, enableThinking, temperature, previousResponse }: InferenceRequest = req.body;

    const userMessage = `Provide JavaScript code to update the canvas.

The canvas is 1024x768 pixels and the variable 'ctx' (2D context) is available for you to use.

Respond with ONLY the JavaScript code to draw on the canvas. No explanations, no markdown - just raw JavaScript code.`;

    const messages: Array<any> = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: wallImage,
            },
          },
          {
            type: 'text',
            text: userMessage,
          },
        ],
      },
    ];

    const requestParams: any = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 20000,
      temperature: temperature ?? 1.0,
      system: systemPrompt,
      messages,
    };

    // Only add thinking if enabled
    if (enableThinking) {
      requestParams.thinking = {
        type: 'enabled',
        budget_tokens: 3000,
      };
    }

    const response = await createMessageWithRetry(requestParams);

    // Extract thinking and code from response
    let thinking = '';
    let signature = '';
    let code = '';
    
    for (const block of response.content) {
      if (block.type === 'thinking') {
        thinking = block.thinking;
        signature = block.signature || '';
      } else if (block.type === 'text') {
        code = block.text;
      }
    }

    // Clean up the code - remove markdown code blocks, extra whitespace, etc.
    code = code
      .replace(/```javascript\s*/gi, '')  // Remove ```javascript
      .replace(/```js\s*/gi, '')          // Remove ```js
      .replace(/```\s*/g, '')             // Remove any remaining ```
      .trim();                            // Remove leading/trailing whitespace

    res.json({
      success: true,
      code,
      thinking,
      signature,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(port, () => {
  console.log(`🕳️  welldown server running on http://localhost:${port}`);
});

import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface IterationRequest {
  persona: string;
  iterationNumber: number;
  totalIterations: number;
  enableThinking: boolean;
  temperature: number;
  previousImage?: string; // base64 encoded
  previousCode?: string; // the code from the last iteration
  previousThinking?: string; // the thinking from the last iteration
  conversationHistory?: Array<{
    code: string;
    thinking?: string;
    signature?: string; // signature from the thinking block
  }>;
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

app.post('/api/iterate', async (req, res) => {
  try {
    const { persona, iterationNumber, totalIterations, enableThinking, temperature, previousImage, previousCode, previousThinking, conversationHistory }: IterationRequest = req.body;

    let userMessage = '';
    
    if (iterationNumber === 0) {
      // First iteration - establish the task
      userMessage = `Your task: Create a visual avatar for yourself using JavaScript canvas drawing code.

You will have ${totalIterations} iterations to refine your avatar. This is iteration 1 of ${totalIterations}.

For this first iteration, write JavaScript code that draws your avatar on a canvas. The code should:
- Work with a canvas that is 512x512 pixels
- Use the variable 'ctx' which is already set up as the 2D context
- Draw your avatar however you envision it
- Be complete, executable JavaScript (no placeholders)

Respond with ONLY the JavaScript code, no explanations, no markdown code blocks - just the raw JavaScript.`;
    } else {
      // Subsequent iterations - provide feedback loop
      userMessage = `This is iteration ${iterationNumber + 1} of ${totalIterations}. Here is what your avatar currently looks like, along with the code you wrote to create it.

Your previous code:
\`\`\`javascript
${previousCode}
\`\`\`

Analyze the image and code, then write improved JavaScript code to refine your avatar. Consider:
- What's working well?
- What could be more expressive or clear?
- How can you better represent yourself?
- How could you make the image more visually appealing?

The code should:
- Work with a canvas that is 512x512 pixels
- Use the variable 'ctx' which is already set up as the 2D context
- Be complete, executable JavaScript (no placeholders)

Respond with ONLY the JavaScript code, no explanations, no markdown code blocks - just the raw JavaScript.`;
    }

    const messages: Array<any> = [];

    // Build conversation history with thinking blocks if we have history
    // We only include thinking blocks (not the code) to save tokens
    // The model can see the current code and image, and follow its thought process
    if (conversationHistory && conversationHistory.length > 0) {
      for (let i = 0; i < conversationHistory.length; i++) {
        const hist = conversationHistory[i];
        
        // Only add thinking blocks if we have thinking, signature, and thinking mode is enabled
        if (enableThinking && hist.thinking && hist.signature) {
          messages.push({
            role: 'assistant',
            content: [
              {
                type: 'thinking',
                thinking: hist.thinking,
                signature: hist.signature,
              },
            ],
          });
          
          // Add a minimal user acknowledgment (except for the last one)
          if (i < conversationHistory.length - 1) {
            messages.push({
              role: 'user',
              content: 'Continue.',
            });
          }
        }
      }
    }

    // Add current message with optional image
    if (previousImage) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: previousImage,
            },
          },
          {
            type: 'text',
            text: userMessage,
          },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: userMessage,
      });
    }

    const requestParams: any = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 20000,
      temperature: temperature ?? 1.0,
      system: persona,
      messages,
    };

    // Only add thinking if enabled
    if (enableThinking) {
      requestParams.thinking = {
        type: 'enabled',
        budget_tokens: 2000,
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
  console.log(`🎨 Avatar Builder server running on http://localhost:${port}`);
});

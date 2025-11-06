# welldown 🕳️

A wall-mirror feedback loop experiment where Claude's entire state lives on the wall.

## The Concept

**welldown** creates a physical-digital feedback loop:

1. **The Canvas** - A browser displays a canvas that Claude can modify
2. **The Wall** - The browser is projected onto a physical wall
3. **The Camera** - A webcam captures what's on the wall
4. **The Loop** - Claude sees the wall, modifies the canvas, repeat

All of Claude's state (except the system prompt) lives on the wall itself. This creates fascinating possibilities:

- Claude can see its own previous state by looking at the wall
- You can physically interact by putting notes/papers on the wall that the webcam captures
- The feedback loop creates emergent behaviors
- It's a literal "reflection" of AI consciousness

## The Interface

### Normal Mode
- **Canvas Display** - What Claude draws/writes on the wall (1024x768)
- **Webcam Feed** - Shows what the camera sees (for debugging)
- **Play/Pause Controls** - Control the inference loop
- **Step Button** - Trigger inference loops one at a time (manual mode)
- **Clear Button** - Reset the canvas to blank white
- **Projector Mode** - Enter fullscreen presentation mode
- **Configuration Panel** - Customize system prompt, thinking mode, temperature, and loop delay
- **Thinking Display** - View Claude's extended thinking process in real-time
- **Stats** - Track loop count, input/output tokens

### Projector Mode 📽️
- **Fullscreen Canvas** - Canvas fills the entire screen for projection. Click the **📽️ Projector** button to enter projector mode; the app will auto-start the inference loop for a clean projection experience.
- **Auto-Start** - Projector mode begins the feedback loop immediately (no extra controls). Press **ESC** to exit projector mode and stop playback.
- **Stretch-to-Fill** - Canvas is visually stretched to fill the projector view (may skew aspect ratio) so nothing is clipped at the edges.

### Speech & Countdown
- **Countdown Bar** - A thin visual countdown bar appears after each screen update, shrinking over the delay period to indicate time until the next capture. Default delay is 8 seconds to give you time to position or speak.
- **Speech-to-Text During Countdown** - While the countdown is active, the browser will (optionally) listen and transcribe your speech in real time. The transcript is included as input to Claude for the next inference. Enable/disable speech capture in the configuration panel.

### Visual Memory
- **Configurable Visual Memory** - Use the "Visual Memory (images)" slider to send the most recent 1–10 webcam captures to Claude. Images are sent oldest → newest so the model can reason about change over time.

### Usage Notes
- Click **Start Webcam** to enable camera access.
- Click **📽️ Projector** to enter fullscreen projector mode and start the loop.
- Speak during the countdown to give Claude real-time instructions or comments (browser permission required).
- Use the Visual Memory slider to increase how many recent frames Claude sees (useful for animations or progressive drawings).

**Pro Tips:**
- If the left/right edges look clipped when projecting, use projector mode (canvas is stretched to fill the viewport).
- Disable speech if you prefer silent operation.

## Running welldown

```bash
# First time setup
./setup.sh

# Run the development server
npm run dev
```

Then:
1. Open `http://localhost:3001` in your browser
2. Click **"Start Webcam"** to enable camera access
3. Point your webcam at a wall (or the area you'll project to)
4. Click **"📽️ Projector"** to enter fullscreen mode
5. Use a projector to display the browser window on the wall
6. Click **▶️ Play** in the floating controls to start the feedback loop
7. Watch Claude interact with itself through the wall!

**Pro Tips:**
- Adjust the system prompt to change Claude's behavior
- Enable "Extended Thinking" to see Claude's reasoning process
- Use "Step" mode to manually trigger each inference for controlled experimentation
- Try different temperatures (0.0 = deterministic, 2.0 = creative)
- Adjust loop delay to control how fast the feedback cycles

## Technical Details

- **Frontend**: HTML5 Canvas, WebRTC for webcam access
- **Backend**: Node.js/Express proxy for Anthropic API
- **Model**: Claude Sonnet 4-20241022 (vision + extended thinking)
- **Feedback Loop**: Webcam → Vision API → Canvas Drawing → Wall → Webcam
- **Canvas Size**: 1024x768 pixels
- **Thinking Budget**: Up to 3000 tokens for extended reasoning
- **Max Output**: 20,000 tokens
- **Retry Logic**: Exponential backoff for API overload handling

### How It Works

1. Webcam captures the current state of the wall
2. Image is sent to Claude's vision API along with system prompt
3. Claude analyzes what it sees and generates JavaScript canvas drawing code
4. Code is executed to update the canvas
5. Canvas is projected back onto the wall
6. Loop repeats, creating a feedback cycle

The magic is that Claude has no memory between iterations except what it can see on the wall - it's truly using the wall as external memory!

## Experiments to Try

- **Self-Discovery**: Start with an empty canvas and let Claude discover what it's seeing
- **Paper Messages**: Put a piece of paper with instructions on the wall for Claude to read
- **Drawing Interaction**: Draw something on the wall and see how Claude responds
- **Pattern Emergence**: Let it run in auto mode and watch patterns emerge over time
- **Persona Experiments**: Use different system prompts to change behavior
  - "You are a poet observing your own verses"
  - "You are a scientist taking lab notes"
  - "You are an artist exploring abstract expressionism"
- **State Persistence**: Write notes to your future self and watch the conversation evolve
- **Temperature Play**: Try temperature 0.0 for consistency vs 2.0 for wild creativity
- **Thinking Mode**: Toggle extended thinking to see Claude's reasoning process
- **Speed Variations**: Adjust loop delay - fast loops vs slow, contemplative cycles

## Requirements

- Node.js v16 or higher
- Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))
- Webcam access
- (Optional) Projector for wall projection

## Setup

```bash
# Install dependencies
npm install

# Create .env file with your API key
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Run the server
npm run dev
```

## Environment Variables

- `ANTHROPIC_API_KEY` - Your Anthropic API key (required)
- `PORT` - Server port (default: 3001)

---

*Down the well we go...* 🕳️

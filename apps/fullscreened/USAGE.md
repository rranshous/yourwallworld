# Fullscreened Usage Guide

## Quick Start

1. **Setup**
   ```bash
   cd apps/fullscreened
   ./setup.sh
   ```

2. **Configure**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Run**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   - Navigate to http://localhost:3000
   - For best experience, fullscreen your browser (F11)
   - Works best on 1920x1080 displays

## Interaction

### Keyboard Controls

- **L** - Start/stop listening for speech input
- **C** - Clear the free draw panel
- **S** - Manually capture a snapshot

### Speech Input

1. Press **L** to activate listening
2. Speak clearly to the microphone
3. The model will:
   - Show its thinking process in the THOUGHTS panel
   - Update memories in the MEMORY panel
   - Optionally draw in the FREE DRAW area
   - Respond via speech synthesis
4. Listening will automatically resume after the model responds

### UI Panels

**MEMORIES (Left Panel)**
- Persistent memories the model chooses to keep
- Last 15 memories displayed
- Color: Blue (#88ccff)

**THOUGHTS (Right Panel)**
- Model's current thinking/reasoning
- Updates with each interaction
- Color: Orange (#ffcc88)

**STATS (Top Right)**
- Iteration count
- Total tokens used
- Context usage level
- Color: Green (#aaffaa)

**AVATAR (Top Center)**
- Visual representation of model
- States: IDLE, LISTENING, THINKING, SPEAKING
- Pulses during thinking/speaking

**FREE DRAW (Center)**
- Canvas for model's visual expression
- Model can draw lines, circles, rectangles, text
- Press 'C' to clear

**STATUS (Bottom)**
- Current system status
- Shows last user input
- Error messages
- Color: Red tint (#ffaaaa)

## Visual Memory System

The model receives:
- Up to 3 previous UI snapshots with each input
- Full context of all panel contents
- Its own previous draw commands

This allows the model to:
- Reference what it "saw" before
- Build incrementally on previous work
- Maintain visual continuity
- Understand the progression of the conversation

## Projection Setup

For the full "wall projection" experience:

1. Connect computer to projector
2. Set resolution to 1920x1080
3. Run fullscreened in fullscreen browser (F11)
4. Use a good quality microphone for speech input
5. Adjust projector so you can stand in front and interact

The model will see the same projected UI you see!

## Troubleshooting

**Speech recognition not working:**
- Use Chrome/Edge (best support for Web Speech API)
- Allow microphone permissions
- Check browser console for errors

**No response from model:**
- Verify ANTHROPIC_API_KEY is set in .env
- Check terminal for error messages
- Ensure you have API credits

**UI not updating:**
- Check browser console for errors
- Verify server is running
- Try refreshing the page

**Poor image quality in snapshots:**
- Ensure canvas is rendering properly
- Check network tab for large snapshot payloads
- May need to adjust snapshot frequency

## Development

**Edit panel layout:**
- Modify `LAYOUT` object in `public/client.js`
- Adjust x, y, width, height for each panel

**Change snapshot frequency:**
- Edit `setInterval(captureSnapshot, 5000)` in client.js
- Default: 5 seconds (5000ms)

**Modify model prompt:**
- Edit system prompt in `/api/process-input` endpoint
- Add/remove panel descriptions
- Adjust expected JSON format

**Add new panel:**
1. Add to `LAYOUT` in client.js
2. Create draw function (e.g., `drawNewPanel()`)
3. Call in `render()` function
4. Update TypeScript interfaces in server.ts
5. Update model's system prompt

## Tips for Best Results

- Speak clearly and concisely
- Give the model time to think (watch THOUGHTS panel)
- Reference the model's memories in conversation
- Ask the model to draw or visualize concepts
- Project on a wall for immersive experience
- Keep lighting consistent for better snapshot quality

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

- **Canvas Display** - What Claude draws/writes on the wall
- **Webcam Feed** - Shows what the camera sees (for debugging)
- **Play/Pause Controls** - Control the inference loop
- **Manual Mode** - Trigger inference loops one at a time
- **Auto Mode** - Run continuous inference loops

## Running welldown

```bash
# First time setup
./setup.sh

# Run the development server
npm run dev
```

Then:
1. Open `http://localhost:3001` in your browser
2. Put the browser in fullscreen mode
3. Point your projector at the wall
4. Point your webcam at the same wall
5. Hit "Play" and watch Claude interact with itself through the wall

## Technical Details

- **Frontend**: HTML5 Canvas, WebRTC for webcam access
- **Backend**: Node.js/Express proxy for Anthropic API
- **Model**: Claude Sonnet 4.5 (vision + extended thinking)
- **Feedback Loop**: Webcam → Vision API → Canvas Drawing → Wall → Webcam

## Experiments to Try

- Start with an empty canvas and let Claude discover what it's seeing
- Put a piece of paper with instructions on the wall
- Draw something on the wall and see how Claude responds
- Let it run in auto mode and watch patterns emerge
- Use different system prompts to change behavior

---

*Down the well we go...*

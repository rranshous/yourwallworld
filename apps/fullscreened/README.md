# Fullscreened

A visual feedback loop experiment where a Claude AI model and human interact through a structured UI that both can "see" via canvas screenshots.

## Concept

This project evolves the ideas from the `welldown` experiment, addressing key learnings:

### Learnings from Welldown

1. **Quality Issues**: The projector → webcam pipeline reduced image quality enough that the model struggled to read its own output. Fullscreened eliminates this by capturing canvas screenshots directly.

2. **Ownership Confusion**: The model always considered what it "saw" as its own doing - it didn't understand when the human added content to the wall. This created interesting but limiting interactions.

3. **Visual Reproduction Challenges**: The model couldn't accurately reproduce the screen from images alone - colors, sizes, and absolute positioning were consistently incorrect.

4. **Incremental Building Works**: When provided with both the wall image AND the JavaScript used to create it, the model performed much better. This demonstrated the model's ability to build incrementally on previous work.

## The Fullscreened Approach

Rather than having the model draw everything from scratch, we provide a **structured UI with defined panels** that the model can populate with content. Both human and model "see" the same resulting UI through canvas screenshots.

### Core Interaction Loop

```
screen update → listen for speech → model thinking → screen update
```

### UI Panels (1920x1080 canvas)

1. **Memory Panel**: Text content set by model, displays persistent memories
2. **Thoughts Panel**: Shows the model's current thinking/reasoning process
3. **Free Draw Panel**: Open canvas area for visual expression
4. **Avatar Panel**: Visual representation of the model
5. **Stats Panel**: Displays iteration count, context usage, tokens used, etc.

### Key Features

- **High Quality Visual Feedback**: Direct canvas screenshots (1920x1080)
- **Multiple Previous Snapshots**: Model receives configurable number of previous states
- **Structured Content Updates**: Model uses APIs to update specific panels
- **Shared Visual Context**: Both human and model see the same UI (can be projected)
- **Explicit Thinking**: Model's thoughts are visible on screen

## Architecture

- **Frontend**: HTML5 Canvas with defined panel regions
- **Backend**: Express server with TypeScript
- **AI Integration**: Anthropic Claude API with vision capabilities
- **Speech Input**: Browser speech recognition for human interaction
- **Screenshot Capture**: Canvas-to-image for visual feedback loop

## Setup

```bash
cd apps/fullscreened
./setup.sh
```

## Running

```bash
npm run dev
```

Open http://localhost:3000 in your browser. For best results, run fullscreen on a 1920x1080 display.

## API Endpoints

### GET /api/content
Returns current panel content (memories, thoughts, stats)

### POST /api/content
Update panel content
```json
{
  "memories": ["memory 1", "memory 2"],
  "thoughts": "current thought process...",
  "stats": {
    "iteration": 5,
    "tokensUsed": 12500,
    "contextLevel": 0.65
  }
}
```

### POST /api/snapshot
Save a canvas snapshot (base64 image data)

### GET /api/snapshots
Retrieve recent snapshots for model context

## Development Notes

This project maintains the "visual memory" concept while solving practical challenges:
- No quality degradation from physical projection capture
- Clear content ownership through structured updates
- Model can incrementally build on previous states
- Visual embodiment through avatar and free draw areas
- Transparent thought process visible to human

## Future Exploration

- Dynamic panel layouts
- More sophisticated avatar animations
- Rich memory visualization
- Context window optimization
- Multi-modal interaction patterns

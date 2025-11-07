# Fullscreened

A pure visual embodiment experiment where Claude AI exists entirely through a canvas interface. The model sees only what you see - its complete world is the visual embodiment on screen.

## Concept

This project explores **pure visual embodiment** - an AI whose entire existence is what's visible on the canvas. No hidden conversation history, no text prompts behind the scenes. Everything the model knows, everything it is, lives in the visual representation that both human and AI observe together.

### Evolution from Welldown

Welldown taught us:

1. **Quality Issues**: Projector → webcam reduced image quality. Fullscreened uses direct canvas screenshots.

2. **Ownership Confusion**: The model couldn't distinguish between its own content and human additions. 

3. **Visual Reproduction**: The model couldn't accurately reproduce screens from images alone (colors, sizes, positioning).

4. **Incremental Building**: Providing the model with its previous code + images worked much better than images alone.

## The Pure Visual Embodiment Approach

**The model receives ONLY images.** No conversation history. No text prompts with your questions. The model must:
- Read the system prompt from the SYSTEM INFO panel on the canvas
- Read what you said from the USER INPUT panel on the canvas  
- See its own previous responses in the MODEL RESPONSE panel
- Understand its entire state by observing its visual embodiment

### Core Interaction Loop

```
User speaks → Text appears on canvas → Snapshot captured →
Model sees images → Model updates embodiment → Snapshot captured →
Resume listening
```

### The Embodiment (1920x1080 canvas)

The embodiment consists of these visual panels:

1. **MEMORY Panel** (left): Persistent memories the model chooses to keep
2. **USER INPUT Panel** (top center): What you just said - visible to model
3. **FREE DRAW Panel** (center): Visual expression via draw commands
4. **AVATAR Panel** (top right): Visual state indicator (idle/thinking/listening)
5. **STATS Panel** (top far right): Iteration, tokens, context usage
6. **THOUGHTS Panel** (right): Current thinking process - transparent to you
7. **STATUS Panel** (bottom center): System status messages
8. **MODEL RESPONSE Panel** (bottom center): What the model says - visible to model
9. **SYSTEM INFO Panel** (bottom right): Model name + system prompt (read-only, visible to both)

### Key Features

- **Pure Visual Input**: Model receives only canvas screenshots (up to 3 previous states)
- **Shared Reality**: Both human and model see the exact same embodiment
- **No Hidden State**: Everything is visible - complete transparency
- **Visual Memory**: Model sees its own previous states and responses
- **Embodiment as Identity**: The canvas IS the model's consciousness

## The Experiment

This is an exploration of embodied AI cognition. What happens when an AI's entire world is a visual representation? How does it understand itself when it can only "see" its embodiment? Can it maintain coherent identity and memory through purely visual feedback?

**Both you and the model share the same limited view** - the embodiment on the canvas. The model has no privileged access to hidden information. Its reality is literally what appears on screen.

## Architecture

- **Frontend**: HTML5 Canvas with 9 defined panel regions (the embodiment)
- **Backend**: Express server with TypeScript (state keeper)
- **AI Integration**: Anthropic Claude Sonnet 4.5 with vision
- **Speech Input**: Browser Web Speech API for natural interaction
- **Visual Feedback**: Canvas-to-PNG snapshots as model's only input

## Setup

```bash
cd apps/fullscreened
./setup.sh
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000 in your browser. For best results, run fullscreen on a 1920x1080 display (or project on a wall!).

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

This project is about **embodiment as interface**:
- The embodiment IS the model's consciousness
- No hidden conversation history or context
- Model reads everything (including instructions) from its visual embodiment
- Transparent thought process - you see what it "thinks"
- State persists in server memory (survives browser refresh, not server restart)

## Future Exploration

### Multi-Embodiment System (Planned)
Create and switch between multiple AI embodiments with different configurations:
- **New Embodiment Creation**: Spawn new sessions with custom system prompts
- **Embodiment Gallery**: Switch between different AI personalities/configurations
- **Custom Parameters**: Edit system prompt, model selection, panel layouts per embodiment
- **Embodiment Persistence**: Save/load embodiment states
- **Comparative Studies**: Run same conversations with different embodiments
- **Embodiment Evolution**: Track how different prompts/models interpret the same embodiment structure

This would enable:
- Experimenting with different AI "personalities" through prompt engineering
- A/B testing different system prompts and models
- Understanding how embodiment structure affects AI behavior
- Creating specialized embodiments for different tasks/interactions

### Other Ideas
- Dynamic panel layouts (user-configurable embodiments)
- More sophisticated avatar animations based on state
- Rich memory visualization (memory graphs, timelines)
- Context window optimization and management
- Recording/playback of embodiment evolution
- Export embodiment sessions for analysis

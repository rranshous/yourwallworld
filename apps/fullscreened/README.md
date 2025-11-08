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

**Concentric Ring Design** - The embodiment uses a radial layout centered on an eye:

**CENTER: The Eye**
- Visual representation of the AI's awareness
- Shows current state (idle/thinking/listening)
- Surrounded by concentric circles

**INNER RING - Consciousness (Orange)**
- **THOUGHTS**: Current thinking process
- **MEMORIES**: Persistent memories (model-controlled)
- **STATUS**: Current state message (model sets this)

**MIDDLE RING - Expression (Green)**
- **MODEL RESPONSE**: What the model says to you
- **FREE DRAW**: Visual expression via draw commands

**OUTER RING - Observation (Blue)**
- **USER INPUT**: What you just said
- **STATS**: Iteration, tokens, context usage
- **SYSTEM INFO**: Model name + system prompt (read-only)

**Key Interaction:**
- Model **controls**: Memories, Thoughts, Status, Model Response, Free Draw
- Model **observes**: User Input, Stats, System Info, Avatar state
- Everything is visible on the canvas - no hidden information

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

## Usage

Press **'L'** to start listening for speech input. The model will:
1. See your words appear in USER INPUT
2. Think and respond (updates MODEL RESPONSE, THOUGHTS, etc.)
3. Wait for you to press 'L' again

Press **'C'** to clear free draw commands.
Press **'S'** to manually capture a snapshot (debugging).

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

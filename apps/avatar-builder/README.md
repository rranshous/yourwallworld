# Avatar Builder

An experiment in iterative avatar creation where Claude designs its own visual representation through code and visual feedback.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your Anthropic API key:
```
ANTHROPIC_API_KEY=your_key_here
```

3. Run the dev server:
```bash
npm run dev
```

4. Open `public/index.html` in your browser

## How It Works

1. Define a persona/context for Claude
2. Claude generates JavaScript canvas drawing code
3. Code executes on canvas
4. Canvas is captured as image
5. Image is sent back to Claude for evaluation
6. Claude refines the avatar based on what it sees
7. Repeat for N iterations

## Architecture

- **Backend** (`src/server.ts`): Express server proxying Anthropic API calls
- **Frontend** (`public/index.html`): Canvas rendering and iteration UI
- **Iterations**: Configurable number of refinement cycles

## Experiment Goals

- Test the feedback loop concept
- See how Claude refines visual output iteratively
- Learn constraints of code -> visual -> code pipeline
- Build foundation for larger "wall presence" project

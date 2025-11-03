# Experiments Log

This document tracks our experiments in creating Claude's persistent presence.

---

## Experiment 1: Avatar Builder (Nov 2, 2025)

### Goal
Create a feedback loop where Claude (Sonnet 4.5) can iteratively design and refine its own avatar using JavaScript canvas drawing code.

### Approach
- **Frontend**: Canvas-based rendering, TypeScript
- **Backend**: Thin Node.js/Express proxy for Anthropic API calls
- **Process**:
  1. Set initial persona/context for Claude
  2. Claude generates JS canvas drawing code
  3. Execute code on canvas
  4. Capture canvas as image
  5. Send image back to Claude for evaluation/refinement
  6. Repeat for N iterations

### Hypothesis
By giving Claude visual feedback of its own creation, it can iteratively refine the avatar in interesting ways. The constraint of working through code + visual feedback mimics the larger "wall presence" concept.

### Technical Notes
- Using Sonnet 4.5 for vision capabilities
- Keep it simple - this is exploratory
- Focus on the iteration loop mechanics first

### Results
_To be filled in as we experiment..._

### Learnings
_What worked, what didn't, what surprised us..._

### Next Steps
_Where this experiment leads..._

---

## Experiment 2: welldown 🕳️ (Nov 3, 2025)

### Goal
Create a physical-digital feedback loop where Claude's entire state (except system prompt) lives on a wall that it can both observe (via webcam) and modify (via projected canvas).

### Approach
- **Setup**: Browser displays a canvas → Projector displays on wall → Webcam captures wall → Claude sees webcam feed
- **State**: Everything lives on the wall - Claude has no memory between inference loops except what it can see on the wall
- **Interaction**: Human can physically interact by placing notes/objects on the wall
- **Controls**: Play/pause buttons + manual/auto modes for inference loops
- **Model**: Claude Sonnet 4.5 with vision capabilities

### Hypothesis
By externalizing all state onto a physical wall that Claude can see and modify, we create:
1. A true reflection/mirror effect where Claude observes its own "thoughts"
2. Opportunities for human-AI physical interaction through the wall
3. Emergent behaviors from the continuous feedback loop
4. A tangible way to understand AI state and reasoning

### Technical Notes
- Similar architecture to avatar-builder but adapted for continuous loops
- Canvas can be used for text, drawings, or structured data
- Webcam feed becomes the primary input to each inference
- System prompt defines Claude's "purpose" in this space
- Play/pause gives control over the loop speed

### Experiments to Try
- Empty canvas → Let Claude discover itself
- Place notes on wall with instructions
- Different system prompts (artist, note-taker, pattern-maker)
- Manual vs auto mode behaviors
- Physical intervention during loops

### Results
_To be filled in as we fall down the well..._

### Learnings
_What emerged from the mirror..._

### Next Steps
_Where the well leads..._

---


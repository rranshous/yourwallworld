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

import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// State
interface PanelContent {
  memories: string[];
  thoughts: string;
  stats: {
    iteration: number;
    tokensUsed: number;
    contextLevel: number;
  };
}

let panelContent: PanelContent = {
  memories: [],
  thoughts: '',
  stats: {
    iteration: 0,
    tokensUsed: 0,
    contextLevel: 0
  }
};

let snapshots: string[] = [];
const MAX_SNAPSHOTS = 5;

// Routes
app.get('/api/content', (req, res) => {
  res.json(panelContent);
});

app.post('/api/content', (req, res) => {
  panelContent = { ...panelContent, ...req.body };
  res.json({ success: true, content: panelContent });
});

app.post('/api/snapshot', (req, res) => {
  const { imageData } = req.body;
  
  snapshots.unshift(imageData);
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots = snapshots.slice(0, MAX_SNAPSHOTS);
  }
  
  res.json({ success: true, count: snapshots.length });
});

app.get('/api/snapshots', (req, res) => {
  res.json({ snapshots });
});

app.listen(PORT, () => {
  console.log(`Fullscreened server running on http://localhost:${PORT}`);
});

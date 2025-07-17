import express from 'express';
import cors from 'cors';
import startDiscordDMListener from './bot.js';

const app = express();
const PORT = 3001;

let botRunning = false;
let bot = null;

// Track DM counts
let dmReceivedCount = 0;
let dmRepliedCount = 0;

app.use(cors());
app.use(express.json());

// Middleware to block /startbot if bot already running
app.use('/startbot', (req, res, next) => {
  if (botRunning) {
    return res.status(403).json({ error: 'Bot is already running — cannot start again' });
  }
  next();
});

// Middleware to block all routes except /stopbot when bot is running
app.use((req, res, next) => {
  if (botRunning && req.path !== '/stopbot' && req.path !== '/stats') {
    return res.status(403).json({ error: 'Bot is running, API calls are blocked except /stopbot and /stats' });
  }
  next();
});

app.post('/startbot', (req, res) => {
  const { token, replyMessage } = req.body;

  if (!token || !replyMessage) {
    return res.status(400).json({ error: 'token and replyMessage are required' });
  }

  // Reset counts before start
  dmReceivedCount = 0;
  dmRepliedCount = 0;

  bot = startDiscordDMListener(token, replyMessage);

  // Listen for custom events emitted by the bot
  bot.on('dmReceived', () => {
    dmReceivedCount++;
  });

  bot.on('dmReplied', () => {
    dmRepliedCount++;
  });

  botRunning = true;

  res.json({ message: 'Bot started' });
});

app.post('/stopbot', (req, res) => {
  if (!botRunning) {
    return res.status(400).json({ error: 'Bot is not running' });
  }

  try {
    if (bot && bot.ws) {
      bot.ws.close(); // Gracefully close WebSocket connection
    }
  } catch {
    // ignore errors on close
  }

  bot = null;
  botRunning = false;

  res.json({ message: 'Bot stopped' });
});

app.get('/stats', (req, res) => {
  if (!botRunning) {
    return res.status(400).json({ error: 'Bot not running' });
  }

  res.json({
    dmsReceived: dmReceivedCount,
    dmsReplied: dmRepliedCount,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

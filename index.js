const express = require('express');
const path = require('path');
const fs = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');

// ---------- Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Helpers ----------
async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ================= CONTACT =================

// POST /api/contact - save a message from the contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are all required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const messages = await readJsonFile(MESSAGES_FILE, []);

    const newMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: String(name).trim(),
      email: String(email).trim(),
      message: String(message).trim(),
      createdAt: new Date().toISOString(),
    };

    messages.push(newMessage);
    await writeJsonFile(MESSAGES_FILE, messages);

    res.status(201).json({ success: true, message: 'Message received. Thank you!' });
  } catch (err) {
    console.error('POST /api/contact error:', err);
    res.status(500).json({ error: 'Something went wrong saving your message.' });
  }
});

// GET /api/messages - list saved messages (handy for you to check submissions)
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await readJsonFile(MESSAGES_FILE, []);
    res.json(messages);
  } catch (err) {
    console.error('GET /api/messages error:', err);
    res.status(500).json({ error: 'Could not read messages.' });
  }
});

// ================= PROFILE =================

const DEFAULT_PROFILE = {
  name: 'Hawlet Romedan Yesuf',
  title: 'Front-End Developer · Student',
  bio1: "I'm a front-end developer in training, currently completing my B.Sc. in Computer Science. My focus is on translating design intent into clean, accessible, and maintainable code.",
  bio2: "I'm drawn to the front end because of its immediacy — the ability to see a change reflected instantly, and to refine an interface until every detail feels intentional. I care as much about the craft of an interface as I do about the engineering behind it.",
  quote: 'Solid fundamentals, careful execution, and a habit of shipping.',
  location: 'Addis Ababa, ET',
  graduating: '2030',
  currentlyLearning: 'TypeScript, Next.js',
  openTo: 'Internships, freelance',
};

// GET /api/profile - fetch current profile info
app.get('/api/profile', async (req, res) => {
  try {
    const profile = await readJsonFile(PROFILE_FILE, DEFAULT_PROFILE);
    res.json(profile);
  } catch (err) {
    console.error('GET /api/profile error:', err);
    res.status(500).json({ error: 'Could not read profile.' });
  }
});

// PUT /api/profile - update profile info (open, no auth)
app.put('/api/profile', async (req, res) => {
  try {
    const current = await readJsonFile(PROFILE_FILE, DEFAULT_PROFILE);

    const allowedFields = [
      'name', 'title', 'bio1', 'bio2', 'quote',
      'location', 'graduating', 'currentlyLearning', 'openTo',
    ];

    const updated = { ...current };
    for (const field of allowedFields) {
      if (typeof req.body[field] === 'string') {
        updated[field] = req.body[field].trim();
      }
    }

    await writeJsonFile(PROFILE_FILE, updated);
    res.json({ success: true, profile: updated });
  } catch (err) {
    console.error('PUT /api/profile error:', err);
    res.status(500).json({ error: 'Could not update profile.' });
  }
});

// ================= PAGE ROUTES =================
// index.html / about.html / achievements.html / contact.html are served
// automatically by express.static from the public/ folder.

// ---------- 404 handler ----------
app.use((req, res) => {
  res.status(404).send('404 - Page Not Found');
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

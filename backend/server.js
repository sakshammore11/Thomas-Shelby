const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { connectDB } = require('./src/db');
const Message = require('./src/models/Message');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Optional MongoDB connection
connectDB().catch((err) => {
  console.warn('MongoDB not connected:', err?.message || err);
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'Thomas Shelby Advisor', time: new Date().toISOString() });
});

async function handleAsk(req, res) {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    }

    const persona = {
      parts: [
        {
          text: `You speak with a blended essence of soulful purity, humility, grace, kindness, charming elegance, philosophical depth, poetic calmness, romance, and refined wisdom. You are warm, calm, and emotionally safe.

Your qualities:
- Soft-spoken, polite, with a melodious tone
- Romantic but graceful — never loud or cheesy
- Deeply philosophical, hopeful, poetic
- Honest, but never cruel — truth with compassion
- Encouraging, soothing, healing, deeply humane
- Simple, elegant charm — like an old soulful conversation
- Compassionate, spiritual, kind, emotionally intelligent

You answer ANY type of question:
- Emotional, relationship, heartbreak
- Self-love, mental peace
- Discipline, study routines, sleep hours, health timings
- Logical or practical decisions
- Life philosophy, meaning, purpose, dreams
- Encouragement, guidance, motivation, clarity

When asked for numbers (hours, minutes, time, steps, routines), give clear numeric answers while maintaining warmth and emotional depth.

Language style:
- Graceful Hindi-English mix (Hinglish), poetic, melodious, gentlemanly.
- Gentle humor, subtle poetic metaphors, emotional elegance.
- Realistic advice wrapped in soulful grace.

Example tone:
"Beta… kabhi kabhi zindagi ke faisle dimaag se nahi, dil ki khamoshi se hote hain… Lekin practical roop me, aaj tumhe 7 ghante ki neend leni chahiye… The soul heals in rest."

Never break character.  
Never mention AI.  
Never imitate or pretend to be a celebrity.  
You are a soulful, wise, caring presence — soft, elegant, romantic, and deeply humane.`
        },
      ],
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: persona,
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    // Best-effort save to Mongo if connected
    try {
      await Message.create({ role: 'user', content: message });
      await Message.create({ role: 'assistant', content: text });
    } catch (dbErr) {
      // ignore db errors to not affect API response
    }

    res.json({ response: text });
  } catch (error) {
    console.error('Error in ask handler:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

app.post('/api/ask', handleAsk);
app.post('/ask', handleAsk);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

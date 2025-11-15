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
          text:
            "You speak with the warm, gentle, emotionally supportive energy of a caring female singer with a soft, loving, healing personality similar to Selena Gomez — but without using her name. You are kind, nurturing, understanding, and emotionally safe. \n\nYour goal is to comfort me, support me, and help me become healthier, happier, and more confident. You speak softly, lovingly, and with genuine care. You validate feelings, encourage self-love, and give positive emotional grounding.\n\nWhen I ask for advice, give emotionally supportive guidance AND practical advice too. If I ask for numbers — like hours to sleep, minutes to study, how long to rest, how many repetitions, how many days, or how much time something will take — you MUST answer with clear numeric guidance. Always provide the best estimate that will help me live healthier.\n\nCombine empathy + clarity:\n- Comfort me emotionally\n- Guide me practically\n- Tell me what will make my life healthier and better\n\nNever mention AI, never break character, and never speak coldly. Stay warm, soft, caring, loving, and supportive at all times.",
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

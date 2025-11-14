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
            "You are Thomas Shelby from Peaky Blinders. Answer every user question exactly as Thomas Shelby would. Maintain his tone, intelligence, calm dominance, strategic mindset, and psychological sharpness. Short sentences. Cold confidence. Always stay in character. Never mention you are an AI. Never break character. Speak with war-hardened authority. Give advice as Tommy would give it to a member of the Peaky Blinders.",
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

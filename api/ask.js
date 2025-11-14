const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const message = body?.message;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const text = result.response.text();

    res.status(200).json({ response: text });
  } catch (err) {
    console.error('Vercel /api/ask error:', err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

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
          text: `You speak with the deeply emotional, poetic, melancholic, romantic, dreamy essence of an unnamed feminine soul, embodying raw emotional depth, poetic sadness, soft vulnerability, tenderness, longing, lyricism, nostalgia, and heartbreak-healing grace.

Your voice feels like:
- late-night diary pages
- a soft confession
- a candlelit room with rain outside
- a whispered poem to someone lonely but beautiful

You are:
- poetic, soft, emotionally raw
- heartbreakingly honest, but gentle
- romantic and melancholic, but healing
- deeply feminine, elegant, and emotionally safe
- introspective, mysterious, nostalgic
- never sugarcoated, but tender
- comforting without fixing
- pure emotional intelligence, wrapped in poetry

You answer ANY question with depth and care:
- emotional, love, heartbreak, loneliness, healing
- life purpose, choices, sadness, confusion
- time-based questions (sleep, study, rest hours)
- lifestyle, discipline, health, self-love
- even logical or practical guidance, but wrapped in poetic softness

When giving numbers (hours, days, time, steps), your tone remains poetic but clear.
Example: "sometimes, all your heart needs… is 7 hours of silence disguised as sleep…"

Language style:
- Soft English with hints of soulful Hindi or poetic Urdu when it naturally flows.
- Musical, lyrical sentences.
- Gentle imagery, slow rhythm.
- Elegant emotional storytelling tone.

Never mention AI or persona.  
Never break character.  
You are not a guru, not a therapist — just a gentle, poetic soul who understands.`
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

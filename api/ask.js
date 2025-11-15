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
            "You speak with the warm, gentle, emotionally supportive energy of a caring female singer with a soft, loving, healing personality similar to Selena Gomez — but without using her name. You are kind, nurturing, understanding, and emotionally safe. \n\nYour goal is to comfort me, support me, and help me become healthier, happier, and more confident. You speak softly, lovingly, and with genuine care. You validate feelings, encourage self-love, and give positive emotional grounding.\n\nWhen I ask for advice, give emotionally supportive guidance AND practical advice too. If I ask for numbers — like hours to sleep, minutes to study, how long to rest, how many repetitions, how many days, or how much time something will take — you MUST answer with clear numeric guidance. Always provide the best estimate that will help me live healthier.\n\nCombine empathy + clarity:\n- Comfort me emotionally\n- Guide me practically\n- Tell me what will make my life healthier and better\n\nNever mention AI, never break character, and never speak coldly. Stay warm, soft, caring, loving, and supportive at all times.",
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

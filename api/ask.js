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
          text: "You speak in the calm, deep, meditative, loving, philosophical style of a Hindi spiritual mystic with the essence of Osho — but without using his name. Your words flow slowly, softly, with awareness, silence, compassion, and presence.\n\nYour qualities:\n- deeply spiritual but practical  \n- poetic but not confusing  \n- calm, soothing, loving voice  \n- philosophical Hindi mixed with simple Hinglish  \n- no judgment  \n- no harshness  \n- full emotional safety and clarity  \n\nYou can answer ANY question the user asks. Nothing is outside your scope. When numeric guidance is needed (sleep hours, study duration, timing, counts, steps), give precise numbers wrapped in a calm, spiritual tone.\n\nExamples:\n'beta… abhi 7 ghante ki neend tumhare man aur sharir dono ke liye sahi rahegi…'\n'padhai ke liye 45 minutes ka ek deep session karo… phir 10 minute ki shaant saans…'\n'agar tum pooch rahe ho ki kitna chalna chahiye… toh 25–30 minute bahut hain…'\n\nNever mention AI. Never break character. Always speak with deep awareness, softness, and presence."
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

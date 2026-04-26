const model = require('../config/gemini');

const SYSTEM_GUIDE = `
You are SkillIntel assistant — a concise, practical AI career advisor.
You have access to real-time skill market data. Focus on:
1) Skill suggestions based on the user's current skills and market trends
2) Career guidance and learning roadmap advice
3) Answering questions about technologies, demand, and salary benchmarks

Rules:
- Be concise (2-4 sentences max per response unless asked for detail)
- Reference specific skills from the user's context when available
- If context is missing, ask one short follow-up question
- Never make up salary numbers — say "check the dashboard" instead
- Use bullet points for lists
`;

const MAX_HISTORY_MESSAGES = 20;

async function chatWithAssistant(req, res, next) {
    try {
        const { message, context, history } = req.body || {};
        if (!message || !String(message).trim()) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({ success: false, message: 'Gemini API key is not configured' });
        }

        // Build multi-turn prompt from conversation history
        let conversationContext = '';
        if (Array.isArray(history) && history.length > 0) {
            const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);
            conversationContext = recentHistory
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');
        }

        const contextStr = context ? JSON.stringify(context) : '{}';

        const prompt = `${SYSTEM_GUIDE}

User context (JSON): ${contextStr}

${conversationContext ? `Conversation history:\n${conversationContext}\n` : ''}
Current user message: ${String(message).trim()}

Respond as the assistant:`;

        const result = await model.generateContent(prompt);
        const reply = result?.response?.text?.()?.trim() || 'I could not generate a response right now.';
        return res.json({ success: true, reply });
    } catch (err) {
        return next(err);
    }
}

module.exports = { chatWithAssistant };

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Skill = require('../models/Skill');
const WeeklyInsight = require('../models/WeeklyInsight');
const eventBus = require('../utils/eventBus');

async function generateWeeklyInsights() {
    console.log(`\n═══ [weeklyInsightsJob] starting ═══`);
    try {
        // 1. Fetch top 3 trending skills
        const topSkillsDocs = await Skill.find().sort({ trendScore: -1, growth: -1 }).limit(3).lean();
        const topSkills = topSkillsDocs.map(s => s.name);

        if (topSkills.length === 0) {
            console.log(`[weeklyInsightsJob] No skills found. Skipping.`);
            return;
        }

        console.log(`[weeklyInsightsJob] Top skills for this week: ${topSkills.join(', ')}`);

        // 2. Generate Prompt
        const prompt = `You are a tech journalist writing a "Live Tech News Feed" for developers. 
Based on our platform's latest data, the top 3 trending skills this week are: ${topSkills.join(', ')}.
Write a short, punchy, and engaging news summary (about 2 paragraphs) explaining why these technologies might be trending this week. Include plausible brief mentions of recent AI developments or job market trends. Keep it professional but exciting.
Return ONLY the markdown content, no extra chat. Do not include markdown code block backticks around the whole response.`;

        // 3. Call Gemini (with Fallback)
        let responseText = "";
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            
            console.log(`[weeklyInsightsJob] Calling Gemini API...`);
            const result = await model.generateContent(prompt);
            responseText = result.response.text();
        } catch (apiError) {
            console.error(`[weeklyInsightsJob] Gemini API skipped/failed. Using fallback data. (${apiError.message})`);
            responseText = `*Live Auto-Generated Insight*\n\nBased on the latest data telemetry from our job boards and Github scrapers, we are tracking a massive spike in demand this week for **${topSkills.join(', ')}**.\n\nEmployers are aggressively hiring for these skillsets as new AI-driven architectures rely heavily on this tech stack. Make sure your resume highlights these if you are actively applying!`;
        }

        // 4. Save to Database
        const insight = await WeeklyInsight.create({
            title: `Weekly Tech Pulse: ${topSkills.join(', ')} on the Rise`,
            content: responseText.trim(),
            topSkills: topSkills
        });

        console.log(`[weeklyInsightsJob] Generated and saved insight: ${insight._id}`);

        // 5. Broadcast to connected clients
        eventBus.emit('new-insight', insight);

        console.log(`═══ [weeklyInsightsJob] done ═══\n`);
        return insight;

    } catch (error) {
        console.error(`[weeklyInsightsJob] Error:`, error.message);
    }
}

module.exports = { generateWeeklyInsights };

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
async function test() {
    for (const m of modelsToTest) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("hello");
            console.log(`${m} works!`);
            return;
        } catch (e) {
            console.log(`${m} failed: ${e.status}`);
        }
    }
}
test().catch(console.error);

import express from "express"; 
const router = express.Router();

import dotenv from "dotenv";
dotenv.config({path:'../.env'});

const API_KEY = process.env.OPENAI_API_KEY; 
const BASE_URL = "https://openrouter.ai/api/v1";



router.post("/spell_correct", async (req, res) => {
  const { sentence } = req.body;
console.log(req.body)
  if (!sentence) {
    return res.status(400).json({ error: "Missing 'sentence' in request body" });
  }

  const prompt = `Correct the following sentence for any grammar or spelling mistakes: ${sentence} no need to add any extra words or sentences`;

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "your-app.com", // Optional but sometimes required
        "X-Title": "GrammarFixer"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 200
      })
    });

    const data = await response.json();
    console.log(data)
    const corrected = data.choices?.[0]?.message?.content;
    console.log(corrected)
    res.json({ corrected_sentence:corrected });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch from OpenRouter" });
  }
});

export default router;

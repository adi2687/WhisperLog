import express from "express"; 
const router = express.Router();

import dotenv from "dotenv";
dotenv.config();
router.use(express.json());

const API_KEY = "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"; 
const BASE_URL = "https://openrouter.ai/api/v1";

router.post("/spell_correct", async (req, res) => {
  const { sentence } = req.body;
  console.log(sentence)
  if (!sentence) {
    return res.status(400).json({ error: "Missing 'sentence' in request body" });
  }

  const prompt = `Correct the following sentence for any grammar or spelling mistakes: ${sentence} dont add any extra words or sentences just give the correct sentence.`;

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

    const corrected = data.choices?.[0]?.message?.content;
    console.log(corrected)
    res.json({ corrected_sentence:corrected });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch from OpenRouter" });
  }
});

export default router;

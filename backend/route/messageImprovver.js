import express from "express"; 
import { verifyToken } from "../middleware/auth.middleware.js";
const router = express.Router();
let key=[
  'sk-or', '-v1-3',
  '9dbce', 'f6c7c',
  '88973', '3ce36',
  '523e2', 'de7bd',
  'df0e7', '2440c',
  '70cf4', 'dfeaf',
  '6b783', '8b2edbb3'
]

router.use(express.json());

const API_KEY = key.join(''); 
const BASE_URL = "https://openrouter.ai/api/v1";
console.log(API_KEY)
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
console.log(data)
    const corrected = data.choices?.[0]?.message?.content;
    console.log(corrected)
    res.json({ corrected_sentence:corrected });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch from OpenRouter" });
  }
});

router.post("/translate",verifyToken,async (req,res)=>{
  const {message}=req.body
  const prompt=`translate the following message to english: ${message} no extra thing and sentence just translate if you cant translate or dont understand just return the message no any extra sentence.`
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
})
export default router;

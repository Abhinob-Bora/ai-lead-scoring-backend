const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Analyzes a lead's buying intent using the Groq API.
 * @param {object} offer - The product/offer details.
 * @param {object} lead - The lead's information.
 * @returns {Promise<{intent: string, reasoning: string}>} - The AI's analysis.
 */
async function analyzeIntent(offer, lead) {
  const prompt = `
    You are a B2B lead qualification expert. Analyze this prospect's fit for our product/offer.

    Product/Offer: ${offer.name}
    Value Propositions: ${(offer.value_props || []).join(", ")}
    Ideal Use Cases: ${(offer.ideal_use_cases || []).join(", ")}

    Prospect:
    - Name: ${lead.name}
    - Role: ${lead.role}
    - Company: ${lead.company}
    - Industry: ${lead.industry}
    - Location: ${lead.location}
    - LinkedIn Bio: ${lead.linkedin_bio}

    Based on the prospect's role, industry, and background, classify their buying intent as High, Medium, or Low. Provide a 1-2 sentence explanation for your reasoning.

    Respond in this exact JSON format:
    {
      "intent": "High|Medium|Low",
      "reasoning": "Your 1-2 sentence explanation"
    }
  `;

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.1-8b-instant", // Or 'mixtral-8x7b-32768'
    response_format: { type: "json_object" },
  });

  return JSON.parse(chatCompletion.choices[0].message.content);
}

module.exports = { analyzeIntent };

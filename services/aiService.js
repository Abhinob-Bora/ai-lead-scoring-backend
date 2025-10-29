const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getAIScore(lead, offer) {
  try {
    const prompt = `You are a B2B lead qualification expert. Analyze this prospect's fit for our product/offer.

Product/Offer: ${offer.name}
Value Propositions: ${(offer.value_props || []).join(', ')}
Ideal Use Cases: ${(offer.ideal_use_cases || []).join(', ')}

Prospect:
- Name: ${lead.name}
- Role: ${lead.role || 'Unknown'}
- Company: ${lead.company || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Location: ${lead.location || 'Unknown'}
- LinkedIn Bio: ${lead.linkedin_bio || 'Not provided'}

Based on the prospect's role, industry, and background, classify their buying intent as High, Medium, or Low. Provide a 1-2 sentence explanation.

Respond in this exact JSON format:
{
  "intent": "High|Medium|Low",
  "reasoning": "Your 1-2 sentence explanation"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a lead qualification assistant. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const content = response.choices[0].message.content.trim();
    const parsed = JSON.parse(content);

    const intentMap = {
      'High': 50,
      'Medium': 30,
      'Low': 10
    };

    return {
      score: intentMap[parsed.intent] || 10,
      intent: parsed.intent,
      reasoning: parsed.reasoning
    };
  } catch (error) {
    console.error('AI scoring error:', error.message);
    return {
      score: 25,
      intent: 'Medium',
      reasoning: 'AI scoring unavailable, using default Medium intent.'
    };
  }
}

module.exports = {
  getAIScore
};

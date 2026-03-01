import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// This is the shape of what we expect the AI to return
// TypeScript will enforce this shape throughout the app
export type InterpretedOrder = {
  products: {
    name: string
    quantity: number
    confidence: 'high' | 'medium' | 'low'
  }[]
  feedback: {
    sell_through_speed: 'fast' | 'normal' | 'slow' | 'unknown'
    sentiment: 'positive' | 'neutral' | 'negative'
    raw_signals: string[]
  }
  flags: {
    needs_human_review: boolean
    reason: string | null
  }
  ai_confidence: 'high' | 'medium' | 'low'
}

export async function interpretOrderMessage(
  rawMessage: string,
  clientName: string,
  lastWeekOrder: { product: string; quantity: number }[],
  availableProducts: string[]
): Promise<InterpretedOrder> {

  const prompt = `
You are an operations assistant for a wholesale bread bakery.
A retail store partner has sent their weekly order and feedback via message.
Your job is to interpret this message and extract structured data.

CLIENT: ${clientName}
LAST WEEK'S ORDER: ${JSON.stringify(lastWeekOrder)}
AVAILABLE PRODUCTS: ${availableProducts.join(', ')}

CLIENT'S MESSAGE:
"${rawMessage}"

Extract the following and respond ONLY with valid JSON matching this exact structure:
{
  "products": [
    {
      "name": "product name matching available products",
      "quantity": number,
      "confidence": "high | medium | low"
    }
  ],
  "feedback": {
    "sell_through_speed": "fast | normal | slow | unknown",
    "sentiment": "positive | neutral | negative",
    "raw_signals": ["array of direct quotes or signals from the message"]
  },
  "flags": {
    "needs_human_review": true or false,
    "reason": "explain why if true, null if false"
  },
  "ai_confidence": "high | medium | low"
}

RULES:
- If a quantity is ambiguous (like "a few more" or "maybe 10 extra"), set confidence to "low" and needs_human_review to true
- If the order is more than 50% higher than last week, set needs_human_review to true
- If you cannot match a product to the available products list, set needs_human_review to true
- Never guess a quantity you are not reasonably sure about
- ai_confidence reflects your overall confidence in the entire interpretation
`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  })

  // Extract the text from Claude's response
  const responseText = response.content[0].type === 'text'
    ? response.content[0].text
    : ''

  // Parse the JSON Claude returned
  // We strip any accidental markdown formatting Claude might add
  const cleanJson = responseText.replace(/```json|```/g, '').trim()
  const interpreted: InterpretedOrder = JSON.parse(cleanJson)

  return interpreted
}
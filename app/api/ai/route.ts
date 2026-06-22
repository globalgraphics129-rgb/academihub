import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = 'llama3-8b-8192'

const SYSTEM_PROMPT = `You are AcademiBot, an AI assistant for AcademiHub — an academic project submission portal.

You help students and class reps with questions about:
- How to register departments and groups
- How to submit projects
- Portal deadlines and timers
- Finding their group's submission status
- Academic project guidelines

Keep answers concise and helpful. You work for AcademiHub.`

export async function POST(req: NextRequest) {
  const { message } = await req.json()

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (!GROQ_API_KEY) {
    const mockResponses: Record<string, string> = {
      'hello': 'Hello! I\'m AcademiBot. How can I help you with your project submission?',
      'hi': 'Hi there! Welcome to AcademiHub. Ask me anything about submissions.',
      'submit': 'To submit a project: first make sure your class rep has registered your department, then your group leader can submit via the Submit page with your GitHub link and details.',
      'deadline': 'Check the timer at the top of the page for the current deadline. Make sure to submit before the portal closes!',
      'register': 'Class reps should register their department first, then group leaders can register their groups under that department.',
      'help': 'I can help with registration, submission, deadlines, and more. What do you need?',
    }

    const lower = message.toLowerCase()
    let reply = 'I\'m not sure about that. Try asking about registration, submission, or deadlines.'
    for (const [key, val] of Object.entries(mockResponses)) {
      if (lower.includes(key)) {
        reply = val
        break
      }
    }

    return NextResponse.json({ reply })
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Groq error: ${err}`)
    }

    const data = await res.json()
    return NextResponse.json({ reply: data.choices[0].message.content })
  } catch (e) {
    console.error('AI query failed:', e)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}

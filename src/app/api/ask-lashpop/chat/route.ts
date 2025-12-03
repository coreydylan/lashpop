import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/db'
import { services } from '@/db/schema/services'
import { serviceCategories } from '@/db/schema/service_categories'
import { faqItems } from '@/db/schema/faqs'
import { faqCategories } from '@/db/schema/faqs'
import { eq } from 'drizzle-orm'
import {
  SYSTEM_PROMPT,
  FUNCTION_CONTEXT,
  FAQ_CONTEXT_TEMPLATE,
  SERVICES_CONTEXT_TEMPLATE,
} from '@/lib/ask-lashpop/prompts'
import { GPT_FUNCTIONS, functionCallToAction } from '@/lib/ask-lashpop/functions'
import type { ChatAction } from '@/lib/ask-lashpop/types'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Cache for context data (simple in-memory, refreshes on cold start)
let cachedContext: {
  faqs: Array<{ question: string; answer: string; category: string }>
  services: Array<{
    name: string
    slug: string
    categoryName: string
    durationMinutes: number
    priceStarting: number
    description: string
    vagaroServiceCode: string
  }>
  servicesMap: Map<string, { vagaroServiceCode: string; priceStarting: number; durationMinutes: number; categoryName: string }>
} | null = null

async function getContext() {
  if (cachedContext) return cachedContext

  // Fetch FAQs with categories
  const faqsWithCategories = await db
    .select({
      question: faqItems.question,
      answer: faqItems.answer,
      categoryName: faqCategories.displayName,
    })
    .from(faqItems)
    .leftJoin(faqCategories, eq(faqItems.categoryId, faqCategories.id))
    .where(eq(faqItems.isActive, true))

  // Fetch services with categories
  const servicesWithCategories = await db
    .select({
      name: services.name,
      slug: services.slug,
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceStarting: services.priceStarting,
      vagaroServiceCode: services.vagaroServiceCode,
      categoryName: serviceCategories.name,
    })
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(eq(services.isActive, true))

  // Build services map for quick lookup
  const servicesMap = new Map<string, { vagaroServiceCode: string; priceStarting: number; durationMinutes: number; categoryName: string }>()
  servicesWithCategories.forEach((s) => {
    if (s.slug) {
      servicesMap.set(s.slug, {
        vagaroServiceCode: s.vagaroServiceCode || '',
        priceStarting: s.priceStarting || 0,
        durationMinutes: s.durationMinutes || 60,
        categoryName: s.categoryName || '',
      })
    }
  })

  cachedContext = {
    faqs: faqsWithCategories.map((f) => ({
      question: f.question,
      answer: f.answer.replace(/<[^>]*>/g, ''), // Strip HTML
      category: f.categoryName || 'General',
    })),
    services: servicesWithCategories.map((s) => ({
      name: s.name,
      slug: s.slug,
      categoryName: s.categoryName || '',
      durationMinutes: s.durationMinutes || 60,
      priceStarting: s.priceStarting || 0,
      description: s.description || '',
      vagaroServiceCode: s.vagaroServiceCode || '',
    })),
    servicesMap,
  }

  return cachedContext
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get context data
    const context = await getContext()

    // Build system message with context
    const systemMessage = [
      SYSTEM_PROMPT,
      FUNCTION_CONTEXT,
      FAQ_CONTEXT_TEMPLATE(context.faqs.slice(0, 30)), // Limit FAQs to avoid token limits
      SERVICES_CONTEXT_TEMPLATE(context.services.slice(0, 40)), // Limit services
    ].join('\n\n')

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemMessage },
      ...conversationHistory.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    // Call OpenAI with GPT-5.1 tools API (modern agentic format)
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.1',
      messages,
      tools: GPT_FUNCTIONS.map((f) => ({
        type: 'function' as const,
        function: {
          name: f.name,
          description: f.description,
          parameters: f.parameters,
        },
      })),
      tool_choice: 'auto',
      parallel_tool_calls: true, // GPT-5.1 can call multiple tools in one response
      temperature: 0.7,
      max_tokens: 500,
    })

    const responseMessage = completion.choices[0]?.message
    if (!responseMessage) {
      throw new Error('No response from OpenAI')
    }

    // Process response
    let responseText = responseMessage.content || ''
    let actions: ChatAction[] = []
    let quickReplies: string[] = []

    // Handle tool calls (GPT-5.1 modern format - supports parallel tool calls)
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type === 'function') {
          const { name, arguments: argsString } = toolCall.function
          try {
            const args = JSON.parse(argsString || '{}')
            const action = functionCallToAction(name, args, context.servicesMap)

            if (action) {
              if (Array.isArray(action)) {
                actions.push(...action)
              } else {
                actions.push(action)
              }
            }
          } catch (e) {
            console.error('Failed to parse tool arguments:', e)
          }
        }
      }
    }

    // Generate contextual quick replies if no actions from tools
    if (actions.length === 0 && (!responseMessage.tool_calls || responseMessage.tool_calls.length === 0)) {
      // Add some default quick replies based on context
      quickReplies = generateQuickReplies(message, responseText)
    }

    // Generate conversation ID if this is a new conversation
    const conversationId = body.conversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      message: responseText,
      actions,
      quickReplies,
      conversationId,
    })
  } catch (error) {
    console.error('ASK LASHPOP chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

// Generate contextual quick replies
function generateQuickReplies(userMessage: string, response: string): string[] {
  const lowerMessage = userMessage.toLowerCase()
  const lowerResponse = response.toLowerCase()

  // Based on conversation context, suggest relevant follow-ups
  if (lowerMessage.includes('lash') || lowerResponse.includes('lash')) {
    return ['Book lash appointment', 'Lash aftercare tips', 'Pricing info']
  }
  if (lowerMessage.includes('brow') || lowerResponse.includes('brow')) {
    return ['Book brow service', 'Microblading vs lamination', 'See brow services']
  }
  if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
    return ['Browse all services', 'Where are you located?', 'What are your hours?']
  }
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return ['Book now', 'See all services', 'Talk to someone']
  }

  // Default replies
  return ['Browse services', 'Find us', 'Contact team']
}

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

// Lazy-initialized OpenAI client (avoids build-time initialization error)
let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

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

    // Call OpenAI with GPT-5.1 - Full agentic API compliance
    // Docs: https://platform.openai.com/docs/models/gpt-5
    const client = getOpenAIClient()
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.1',
      messages,

      // GPT-5.1 Tools API (modern agentic format)
      tools: GPT_FUNCTIONS.map((f) => ({
        type: 'function' as const,
        function: {
          name: f.name,
          description: f.description,
          parameters: f.parameters,
        },
      })),
      tool_choice: 'auto',
      parallel_tool_calls: true, // GPT-5.1: Execute multiple tools in single response

      // GPT-5.1 specific parameters
      max_completion_tokens: 1024, // GPT-5 uses max_completion_tokens, not max_tokens
      // Note: reasoning_effort ('low'|'medium'|'high') available for reasoning-intensive tasks
      // We use default for chat which auto-selects based on complexity

      temperature: 0.7, // Balanced creativity for conversational responses
    })

    const responseMessage = completion.choices[0]?.message
    if (!responseMessage) {
      throw new Error('No response from OpenAI')
    }

    // Process response
    let responseText = responseMessage.content || ''
    let actions: ChatAction[] = []
    let quickReplies: string[] = []

    // Debug: Log what we got from OpenAI
    console.log('[ASK LASHPOP] Response from OpenAI:', {
      hasContent: !!responseMessage.content,
      contentLength: responseMessage.content?.length || 0,
      contentPreview: responseMessage.content?.substring(0, 100),
      toolCallsCount: responseMessage.tool_calls?.length || 0,
      toolCallNames: responseMessage.tool_calls?.map(tc => 'function' in tc ? tc.function?.name : 'unknown') || [],
    })

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

    // Always generate quick replies server-side (AI's tool calls unreliable for this)
    quickReplies = generateQuickReplies(message, responseText)

    // CRITICAL: Ensure there's always a message (never empty bubble)
    if (!responseText || responseText.trim() === '') {
      if (actions.length > 0) {
        responseText = generateFallbackMessage(actions)
      } else {
        // Generic fallback when AI returns nothing useful
        responseText = "I'm here to help! What would you like to know about LashPop? 😊"
      }
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

// Generate a fallback message when AI returns actions without text
function generateFallbackMessage(actions: ChatAction[]): string {
  const firstAction = actions[0]
  if (!firstAction) return "Here you go!"

  switch (firstAction.type) {
    case 'scroll_to_section':
      return "Let me show you! ✨"
    case 'open_panel':
      return "Here are your options!"
    case 'load_vagaro_inline':
      return "Let's get you booked! 💫"
    case 'submit_team_message':
      return "Done! I've sent your message to the team. They'll get back to you within a day!"
    case 'show_form':
      return "I'll help you get in touch!"
    case 'call_phone':
      return "Here's how to reach us!"
    case 'open_external':
      return "Here you go!"
    default:
      return "Here you go! ✨"
  }
}

// Generate contextual quick replies (keep them conversational, not action-heavy)
function generateQuickReplies(userMessage: string, response: string): string[] {
  const lowerMessage = userMessage.toLowerCase()
  const lowerResponse = response.toLowerCase()

  // Based on conversation context, suggest natural follow-ups
  if (lowerMessage.includes('lash') || lowerResponse.includes('lash')) {
    return ['How do I prepare?', 'How often do I need fills?', 'Help me book']
  }
  if (lowerMessage.includes('brow') || lowerResponse.includes('brow')) {
    return ['What\'s the difference between services?', 'How long does it last?', 'Help me book']
  }
  if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
    return ['What should I expect?', 'Where are you located?', 'Browse services']
  }
  if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return ['Browse services', 'Help me book', 'Talk to the team']
  }
  if (lowerMessage.includes('team') || lowerMessage.includes('message') || lowerMessage.includes('talk')) {
    return ['I have a question', 'I need help booking', 'Something else']
  }

  // Default - conversational options
  return ['Tell me about services', 'Where are you located?', 'Talk to the team']
}

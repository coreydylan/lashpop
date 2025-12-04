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
  TEAM_CONTEXT_TEMPLATE,
  type TeamMemberForAI,
} from '@/lib/ask-lashpop/prompts'
import { teamMembers } from '@/data/teamComplete'
import { GPT_FUNCTIONS, functionCallToAction } from '@/lib/ask-lashpop/functions'
import type { ChatAction, SmartQuickReply } from '@/lib/ask-lashpop/types'

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

    // Build team context from static data
    const teamForAI: TeamMemberForAI[] = teamMembers.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      type: m.type,
      specialties: m.specialties,
      bio: m.bio || '',
      quote: m.quote,
      funFact: m.funFact,
      businessName: m.businessName,
    }))

    // Build system message with context
    const systemMessage = [
      SYSTEM_PROMPT,
      FUNCTION_CONTEXT,
      FAQ_CONTEXT_TEMPLATE(context.faqs.slice(0, 30)), // Limit FAQs to avoid token limits
      SERVICES_CONTEXT_TEMPLATE(context.services.slice(0, 40)), // Limit services
      TEAM_CONTEXT_TEMPLATE(teamForAI),
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
    let quickReplies: SmartQuickReply[] = []

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

    // Generate smart quick replies only when contextually appropriate
    quickReplies = generateSmartQuickReplies(message, responseText, conversationHistory, actions)

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

// Smart quick reply generation - context-aware, supports actions, knows when NOT to show
function generateSmartQuickReplies(
  userMessage: string,
  response: string,
  conversationHistory: Array<{ role: string; content: string }>,
  actions: ChatAction[]
): SmartQuickReply[] {
  const lowerMessage = userMessage.toLowerCase()
  const lowerResponse = response.toLowerCase()
  const fullContext = [...conversationHistory.map(m => m.content), userMessage, response].join(' ').toLowerCase()

  // ============================================================================
  // SITUATIONS WHERE WE DON'T SHOW QUICK REPLIES
  // ============================================================================

  // 1. Emotional/complaint situations - let the user express themselves freely
  const emotionalKeywords = ['bad experience', 'upset', 'frustrated', 'disappointed', 'angry', 'complaint', 'terrible', 'horrible', 'worst', 'rude', 'unhappy', 'problem', 'issue', 'wrong']
  if (emotionalKeywords.some(k => fullContext.includes(k))) {
    return [] // No quick replies - let them speak freely
  }

  // 2. We're in the middle of collecting info (name, email, phone, details)
  const collectingInfo = lowerResponse.includes('what\'s your name') ||
    lowerResponse.includes('your email') ||
    lowerResponse.includes('your phone') ||
    lowerResponse.includes('can you tell me') ||
    lowerResponse.includes('what happened') ||
    lowerResponse.includes('more about')
  if (collectingInfo) {
    return [] // Don't interrupt info collection with quick replies
  }

  // 3. Message just sent confirmation
  if (lowerResponse.includes('sent!') || lowerResponse.includes('i\'ve sent') || lowerResponse.includes('passed along')) {
    return [
      { type: 'text', label: 'Thanks!' },
      { type: 'text', label: 'I have another question' },
    ]
  }

  // 4. Action-heavy response (already has buttons)
  if (actions.length >= 2) {
    return [] // Don't clutter with more options
  }

  // ============================================================================
  // CONTEXTUAL QUICK REPLIES
  // ============================================================================

  // If response mentions a specific team member, offer to show their card
  const teamMentioned = extractMentionedTeamMember(lowerResponse)
  if (teamMentioned) {
    return [
      { type: 'text', label: `Tell me more about ${teamMentioned}` },
      { type: 'text', label: 'Help me book' },
    ]
  }

  // Discussion about services/pricing
  if (lowerResponse.includes('$') || lowerResponse.includes('start at') || lowerResponse.includes('pricing')) {
    return [
      { type: 'text', label: 'Help me book' },
      {
        type: 'action',
        label: '📋 Browse services',
        action: { type: 'open_panel', panelType: 'category-picker', data: {}, label: 'Browse services' }
      },
    ]
  }

  // Mentioned location/address
  if (lowerResponse.includes('coast hwy') || lowerResponse.includes('oceanside') || lowerResponse.includes('located')) {
    return [
      {
        type: 'action',
        label: '📍 Show on map',
        action: { type: 'scroll_to_section', target: '#find-us', label: 'Show on map' }
      },
      { type: 'text', label: 'What are your hours?' },
    ]
  }

  // Talking about specific lash services
  if ((lowerMessage.includes('lash') || lowerResponse.includes('lash')) &&
      !lowerMessage.includes('book') && !lowerResponse.includes('book')) {
    return [
      { type: 'text', label: 'What\'s the difference between styles?' },
      { type: 'text', label: 'Help me book lashes' },
    ]
  }

  // Talking about brows
  if (lowerMessage.includes('brow') || lowerResponse.includes('brow')) {
    return [
      { type: 'text', label: 'How long does it last?' },
      { type: 'text', label: 'Help me book' },
    ]
  }

  // Talking about facials/skin
  if (lowerMessage.includes('facial') || lowerResponse.includes('facial') ||
      lowerMessage.includes('skin') || lowerResponse.includes('hydrafacial')) {
    return [
      { type: 'text', label: 'What\'s included?' },
      { type: 'text', label: 'Help me book a facial' },
    ]
  }

  // Greeting or very first message
  if (conversationHistory.length === 0 ||
      lowerMessage === 'hi' || lowerMessage === 'hello' || lowerMessage === 'hey') {
    return [
      { type: 'text', label: 'What services do you offer?' },
      { type: 'text', label: 'Help me book' },
      { type: 'text', label: 'I have a question' },
    ]
  }

  // If response asks a question, don't add quick replies
  if (lowerResponse.endsWith('?')) {
    return []
  }

  // Default: minimal or none - don't force quick replies
  return []
}

// Helper: Extract mentioned team member name from response
function extractMentionedTeamMember(text: string): string | null {
  const teamNames = [
    'Emily', 'Rachel', 'Ryann', 'Ashley', 'Ava', 'Savannah',
    'Elena', 'Adrianna', 'Kelly', 'Bethany', 'Grace', 'Renee', 'Evie', 'Haley'
  ]
  for (const name of teamNames) {
    if (text.toLowerCase().includes(name.toLowerCase())) {
      return name
    }
  }
  return null
}

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
// Note: Using structured output instead of function calling
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

    // Call OpenAI with structured output - ensures message is never empty
    const client = getOpenAIClient()
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,

      // Structured output with JSON schema
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'chat_response',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Your conversational response to the user. Required - never empty.',
              },
              quick_replies: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional 2-4 short quick reply suggestions (2-6 words each). Include when helpful for guiding the conversation. Can include action hints like "📍 Show location" or "📅 Book now". Leave empty array if you just asked a question or during sensitive conversations.',
              },
              action: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['scroll_to_section', 'show_services', 'book_service', 'send_message_to_team', 'display_team_card'],
                  },
                  params: {
                    type: 'object',
                    additionalProperties: true,
                  },
                },
                required: ['type', 'params'],
                additionalProperties: false,
                description: 'Optional action to trigger (scroll, show services, book, etc.)',
              },
            },
            required: ['message', 'quick_replies'],
            additionalProperties: false,
          },
        },
      },

      max_tokens: 1024,
      temperature: 0.7,
    })

    const responseMessage = completion.choices[0]?.message
    if (!responseMessage?.content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the structured JSON response
    let parsedResponse: {
      message: string
      quick_replies: string[]
      action?: { type: string; params: Record<string, unknown> }
    }

    try {
      parsedResponse = JSON.parse(responseMessage.content)
    } catch (e) {
      console.error('Failed to parse structured response:', e)
      parsedResponse = {
        message: "I'm here to help! What would you like to know about LashPop? 😊",
        quick_replies: ['What services do you offer?', 'Help me book', 'Talk to the team'],
      }
    }

    // Debug: Log what we got from OpenAI
    console.log('[ASK LASHPOP] Structured response:', {
      message: parsedResponse.message?.substring(0, 100),
      quickRepliesCount: parsedResponse.quick_replies?.length || 0,
      hasAction: !!parsedResponse.action,
    })

    let responseText = parsedResponse.message || "I'm here to help! 😊"
    let actions: ChatAction[] = []
    let quickReplies: SmartQuickReply[] = []

    // Handle action if present
    if (parsedResponse.action) {
      const action = structuredActionToAction(parsedResponse.action, context.servicesMap)
      if (action) {
        if (Array.isArray(action)) {
          actions.push(...action)
        } else {
          actions.push(action)
        }
      }
    }

    // Convert quick replies to SmartQuickReply format
    if (parsedResponse.quick_replies && parsedResponse.quick_replies.length > 0) {
      quickReplies = parsedResponse.quick_replies.map((reply): SmartQuickReply => {
        // Check if it's an action suggestion based on emoji or keywords
        if (reply.includes('📍') || reply.toLowerCase().includes('location') || reply.toLowerCase().includes('map')) {
          return {
            type: 'action',
            label: reply.replace(/^📍\s*/, ''),
            action: { type: 'scroll_to_section', target: '#find-us', label: reply }
          }
        }
        if (reply.includes('📋') || reply.toLowerCase().includes('browse services') || reply.toLowerCase().includes('see services')) {
          return {
            type: 'action',
            label: reply.replace(/^📋\s*/, ''),
            action: { type: 'open_panel', panelType: 'category-picker', data: {}, label: reply }
          }
        }
        if (reply.includes('👋') || reply.toLowerCase().includes('meet the team') || reply.toLowerCase().includes('see the team')) {
          return {
            type: 'action',
            label: reply.replace(/^👋\s*/, ''),
            action: { type: 'scroll_to_section', target: '#team', label: reply }
          }
        }
        if (reply.includes('⭐') || reply.toLowerCase().includes('reviews')) {
          return {
            type: 'action',
            label: reply.replace(/^⭐\s*/, ''),
            action: { type: 'scroll_to_section', target: '#reviews', label: reply }
          }
        }
        if (reply.includes('📅') || reply.toLowerCase().includes('book now') || reply.toLowerCase().includes('help me book')) {
          return {
            type: 'action',
            label: reply.replace(/^📅\s*/, ''),
            action: { type: 'open_panel', panelType: 'category-picker', data: {}, label: reply }
          }
        }
        // Default: text reply
        return { type: 'text', label: reply }
      })
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

// Convert structured action from JSON response to ChatAction
function structuredActionToAction(
  action: { type: string; params: Record<string, unknown> },
  servicesMap?: Map<string, { vagaroServiceCode: string; priceStarting: number; durationMinutes: number; categoryName: string }>
): ChatAction | null {
  const { type, params } = action

  switch (type) {
    case 'scroll_to_section': {
      const sectionMap: Record<string, string> = {
        team: '#team', gallery: '#gallery', reviews: '#reviews',
        faq: '#faq', 'find-us': '#find-us', map: '#find-us',
      }
      const section = params.section as string
      return {
        type: 'scroll_to_section',
        target: sectionMap[section] || `#${section}`,
        thenCollapse: true,
        label: params.button_label as string || 'Show',
        icon: 'map-pin',
      }
    }

    case 'show_services': {
      const category = params.category as string
      return {
        type: 'open_panel',
        panelType: 'category-picker',
        data: { categoryId: category },
        thenCollapse: true,
        label: params.button_label as string || 'Browse Services',
        icon: 'eye',
      }
    }

    case 'book_service': {
      const slug = params.service_slug as string
      const serviceInfo = servicesMap?.get(slug)
      return {
        type: 'load_vagaro_inline',
        service: {
          id: slug,
          name: params.service_name as string || slug,
          vagaroServiceCode: serviceInfo?.vagaroServiceCode || '',
          priceStarting: serviceInfo?.priceStarting || 0,
          durationMinutes: serviceInfo?.durationMinutes || 60,
          categoryName: serviceInfo?.categoryName,
        },
        label: params.button_label as string || 'Book Now',
        icon: 'calendar',
      }
    }

    case 'send_message_to_team': {
      return {
        type: 'submit_team_message',
        data: {
          name: params.name as string,
          email: params.email as string | undefined,
          phone: params.phone as string | undefined,
          message: params.message as string,
          inquiryType: params.inquiry_type as string || 'general',
        },
        label: 'Message sent!',
        icon: 'check',
      }
    }

    case 'display_team_card': {
      const memberName = params.member_name as string
      const memberMap: Record<string, { id: number; name: string }> = {
        emily: { id: 1, name: 'Emily Rogers' },
        rachel: { id: 2, name: 'Rachel Edwards' },
        ryann: { id: 3, name: 'Ryann Alcorn' },
        ashley: { id: 4, name: 'Ashley Petersen' },
        ava: { id: 5, name: 'Ava Mata' },
        savannah: { id: 6, name: 'Savannah Scherer' },
        elena: { id: 7, name: 'Elena Castellanos' },
        adrianna: { id: 8, name: 'Adrianna Arnaud' },
        kelly: { id: 9, name: 'Kelly Katona' },
        bethany: { id: 10, name: 'Bethany Peterson' },
        grace: { id: 11, name: 'Grace Ramos' },
        renee: { id: 12, name: 'Renee Belton' },
        evie: { id: 13, name: 'Evie Ells' },
        haley: { id: 14, name: 'Haley Walker' },
      }
      const member = memberMap[memberName?.toLowerCase()]
      if (!member) return null
      return {
        type: 'display_team_card',
        memberId: member.id,
        memberName: member.name,
        label: params.button_label as string || `Meet ${member.name.split(' ')[0]}`,
        icon: 'user',
      }
    }

    default:
      return null
  }
}

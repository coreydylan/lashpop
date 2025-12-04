import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/db'
import { services } from '@/db/schema/services'
import { serviceCategories } from '@/db/schema/service_categories'
import { assets } from '@/db/schema/assets'
import { assetTags } from '@/db/schema/asset_tags'
import { tags } from '@/db/schema/tags'
import { eq, and, inArray } from 'drizzle-orm'
import { buildDiscoveryPrompt } from '@/lib/discover-look/prompts'
import type {
  DiscoveryPreferences,
  DiscoveryAction,
  DiscoveryQuickReply,
  DiscoveryAsset,
  StyleCard,
  ServiceRecommendation,
} from '@/lib/discover-look/types'

// Lazy-initialized OpenAI client
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

// Cache for context data
let cachedServices: Array<{
  name: string
  slug: string
  categoryName: string
  durationMinutes: number
  priceStarting: number
  description: string
  vagaroServiceCode: string
}> | null = null

let cachedServicesMap: Map<
  string,
  {
    id: string
    name: string
    vagaroServiceCode: string
    priceStarting: number
    durationMinutes: number
    categoryName: string
    description: string
  }
> | null = null

async function getServices() {
  if (cachedServices && cachedServicesMap) {
    return { services: cachedServices, servicesMap: cachedServicesMap }
  }

  const servicesWithCategories = await db
    .select({
      id: services.id,
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

  cachedServices = servicesWithCategories.map((s) => ({
    name: s.name,
    slug: s.slug,
    categoryName: s.categoryName || '',
    durationMinutes: s.durationMinutes || 60,
    priceStarting: s.priceStarting || 0,
    description: s.description || '',
    vagaroServiceCode: s.vagaroServiceCode || '',
  }))

  cachedServicesMap = new Map()
  servicesWithCategories.forEach((s) => {
    if (s.slug) {
      cachedServicesMap!.set(s.slug, {
        id: s.id,
        name: s.name,
        vagaroServiceCode: s.vagaroServiceCode || '',
        priceStarting: s.priceStarting || 0,
        durationMinutes: s.durationMinutes || 60,
        categoryName: s.categoryName || '',
        description: s.description || '',
      })
    }
  })

  return { services: cachedServices, servicesMap: cachedServicesMap }
}

// Get discovery-tagged assets
async function getDiscoveryAssets(
  category?: string,
  style?: string
): Promise<DiscoveryAsset[]> {
  try {
    // Find the 'discover-look' tag
    const discoveryTag = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.name, 'discover-look'))
      .limit(1)

    if (!discoveryTag.length) {
      return []
    }

    // Find assets with this tag
    const taggedAssets = await db
      .select({
        id: assets.id,
        filePath: assets.filePath,
        altText: assets.altText,
        caption: assets.caption,
      })
      .from(assets)
      .innerJoin(assetTags, eq(assets.id, assetTags.assetId))
      .where(eq(assetTags.tagId, discoveryTag[0].id))
      .limit(10)

    return taggedAssets.map((a) => ({
      id: a.id,
      filePath: a.filePath,
      altText: a.altText || undefined,
      caption: a.caption || undefined,
      tags: [],
    }))
  } catch (error) {
    console.error('Error fetching discovery assets:', error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      message,
      conversationHistory = [],
      preferences = {},
      mode = 'standalone',
    } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get services data
    const { services: servicesList, servicesMap } = await getServices()

    // Determine current phase based on preferences
    const phase = determinePhase(preferences)

    // Build system prompt
    const systemPrompt = buildDiscoveryPrompt(servicesList.slice(0, 50), preferences, phase)

    // Build messages array
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-12).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    // Call OpenAI with structured output
    const client = getOpenAIClient()
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages,

      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'discovery_response',
          schema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Your conversational response. Required - never empty.',
              },
              quick_replies: {
                type: 'array',
                items: { type: 'string' },
                description:
                  '2-4 short quick reply suggestions. Include action hints like "📅 Book now" or "📸 Show examples".',
              },
              action: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: [
                      'show_styles',
                      'show_education',
                      'show_before_after',
                      'recommend_service',
                      'book_service',
                      'scroll_to_section',
                      'invoke_ask_lashpop',
                    ],
                  },
                  params: {
                    type: 'object',
                    description: 'Action-specific parameters',
                  },
                },
                description: 'Optional action to trigger',
              },
              update_preferences: {
                type: 'object',
                description:
                  'Preferences discovered from this exchange (desiredLook, lifestyleLevel, interestedCategories, etc)',
              },
              show_images: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  style: { type: 'string' },
                  type: { type: 'string' },
                },
                description: 'Request to show style/service images',
              },
              show_style_cards: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  styles: { type: 'array', items: { type: 'string' } },
                  highlight: { type: 'string' },
                },
                description: 'Request to show style comparison cards',
              },
              recommend_service: {
                type: 'object',
                properties: {
                  service_slug: { type: 'string' },
                  match_reasons: { type: 'array', items: { type: 'string' } },
                },
                description: 'Your service recommendation',
              },
            },
            required: ['message', 'quick_replies'],
          },
        },
      },

      max_completion_tokens: 1024,
      reasoning_effort: 'low',
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse structured response
    let parsedResponse: {
      message: string
      quick_replies: string[]
      action?: { type: string; params: Record<string, unknown> }
      update_preferences?: Partial<DiscoveryPreferences>
      show_images?: { category: string; style: string; type: string }
      show_style_cards?: { category: string; styles: string[]; highlight: string }
      recommend_service?: { service_slug: string; match_reasons: string[] }
    }

    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (e) {
      console.error('Failed to parse discovery response:', e)
      parsedResponse = {
        message: "I'm here to help you find your perfect look! What brings you in today? ✨",
        quick_replies: ['Lashes', 'Brows', 'Facials', 'Help me explore'],
      }
    }

    console.log('[DISCOVER LOOK] Response:', {
      message: parsedResponse.message?.substring(0, 100),
      hasAction: !!parsedResponse.action,
      hasRecommendation: !!parsedResponse.recommend_service,
    })

    // Build response
    let responseText = parsedResponse.message || "Let's find your perfect look! ✨"
    let actions: DiscoveryAction[] = []
    let quickReplies: DiscoveryQuickReply[] = []
    let images: DiscoveryAsset[] = []
    let styleCards: StyleCard[] = []
    let serviceRecommendation: ServiceRecommendation | undefined

    // Handle action
    if (parsedResponse.action) {
      const action = convertAction(parsedResponse.action, servicesMap)
      if (action) {
        actions.push(action)
      }
    }

    // Handle recommendation
    if (parsedResponse.recommend_service) {
      const serviceInfo = servicesMap.get(parsedResponse.recommend_service.service_slug)
      if (serviceInfo) {
        serviceRecommendation = {
          service: {
            id: serviceInfo.id,
            name: serviceInfo.name,
            slug: parsedResponse.recommend_service.service_slug,
            description: serviceInfo.description,
            priceStarting: serviceInfo.priceStarting,
            durationMinutes: serviceInfo.durationMinutes,
            categoryName: serviceInfo.categoryName,
            vagaroServiceCode: serviceInfo.vagaroServiceCode,
          },
          matchScore: 90,
          matchReasons: parsedResponse.recommend_service.match_reasons,
        }

        // Add booking action
        actions.push({
          type: 'book_service',
          service: {
            id: serviceInfo.id,
            name: serviceInfo.name,
            slug: parsedResponse.recommend_service.service_slug,
            vagaroServiceCode: serviceInfo.vagaroServiceCode,
            priceStarting: serviceInfo.priceStarting,
            durationMinutes: serviceInfo.durationMinutes,
            categoryName: serviceInfo.categoryName,
          },
          label: 'Book Now',
          icon: 'calendar',
        })
      }
    }

    // Handle image requests
    if (parsedResponse.show_images) {
      images = await getDiscoveryAssets(
        parsedResponse.show_images.category,
        parsedResponse.show_images.style
      )
    }

    // Handle style cards
    if (parsedResponse.show_style_cards) {
      styleCards = buildStyleCards(
        parsedResponse.show_style_cards.category,
        parsedResponse.show_style_cards.styles,
        parsedResponse.show_style_cards.highlight
      )
    }

    // Convert quick replies
    if (parsedResponse.quick_replies?.length > 0) {
      quickReplies = parsedResponse.quick_replies.map((reply): DiscoveryQuickReply => {
        // Check for action hints
        if (reply.includes('📸') || reply.toLowerCase().includes('show') || reply.toLowerCase().includes('examples')) {
          return {
            type: 'action',
            label: reply.replace(/^📸\s*/, ''),
            action: { type: 'show_styles', category: 'lashes', styles: [], label: reply },
          }
        }
        if (reply.includes('📅') || reply.toLowerCase().includes('book')) {
          return {
            type: 'action',
            label: reply.replace(/^📅\s*/, ''),
            action: {
              type: 'open_panel',
              panelType: 'category-picker',
              data: {},
              label: reply,
            },
          }
        }
        if (reply.includes('📋') || reply.toLowerCase().includes('browse') || reply.toLowerCase().includes('services')) {
          return {
            type: 'action',
            label: reply.replace(/^📋\s*/, ''),
            action: {
              type: 'open_panel',
              panelType: 'category-picker',
              data: {},
              label: reply,
            },
          }
        }
        if (reply.includes('💡') || reply.toLowerCase().includes('learn')) {
          return {
            type: 'action',
            label: reply.replace(/^💡\s*/, ''),
            action: { type: 'show_education', topic: 'overview', category: 'lashes', label: reply },
          }
        }
        // Default text reply
        return { type: 'text', label: reply }
      })
    }

    // Generate conversation ID
    const conversationId =
      body.conversationId || `disc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      message: responseText,
      images: images.length > 0 ? images : undefined,
      styleCards: styleCards.length > 0 ? styleCards : undefined,
      serviceRecommendation,
      actions: actions.length > 0 ? actions : undefined,
      quickReplies,
      updatedPreferences: parsedResponse.update_preferences,
      conversationId,
    })
  } catch (error) {
    console.error('DISCOVER LOOK chat error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

// Determine discovery phase based on preferences
function determinePhase(preferences: DiscoveryPreferences): string {
  if (!preferences || Object.keys(preferences).length === 0) {
    return 'welcome'
  }
  if (preferences.recommendedServices?.length) {
    return 'recommendation'
  }
  if (preferences.selectedStyle) {
    return 'education'
  }
  if (preferences.interestedCategories?.length) {
    return 'style-discovery'
  }
  if (preferences.desiredLook || preferences.lifestyleLevel) {
    return 'exploration'
  }
  return 'welcome'
}

// Convert AI action to typed action
function convertAction(
  action: { type: string; params: Record<string, unknown> },
  servicesMap: Map<string, { id: string; name: string; vagaroServiceCode: string; priceStarting: number; durationMinutes: number; categoryName: string }>
): DiscoveryAction | null {
  const { type, params } = action

  switch (type) {
    case 'show_styles':
      return {
        type: 'show_styles',
        category: (params.category as string) || 'lashes',
        styles: (params.styles as string[]) || [],
        label: (params.button_label as string) || 'See Styles',
      }

    case 'show_education':
      return {
        type: 'show_education',
        topic: (params.topic as string) || 'overview',
        category: (params.category as string) || 'lashes',
        label: (params.button_label as string) || 'Learn More',
      }

    case 'book_service': {
      const slug = params.service_slug as string
      const serviceInfo = servicesMap.get(slug)
      if (!serviceInfo) return null
      return {
        type: 'book_service',
        service: {
          id: serviceInfo.id,
          name: serviceInfo.name,
          slug,
          vagaroServiceCode: serviceInfo.vagaroServiceCode,
          priceStarting: serviceInfo.priceStarting,
          durationMinutes: serviceInfo.durationMinutes,
          categoryName: serviceInfo.categoryName,
        },
        label: (params.button_label as string) || 'Book Now',
        icon: 'calendar',
      }
    }

    case 'scroll_to_section': {
      const sectionMap: Record<string, string> = {
        team: '#team',
        gallery: '#gallery',
        reviews: '#reviews',
        faq: '#faq',
        'find-us': '#find-us',
      }
      const section = params.section as string
      return {
        type: 'scroll_to_section',
        target: sectionMap[section] || `#${section}`,
        thenCollapse: true,
        label: (params.button_label as string) || 'Show',
      }
    }

    case 'invoke_ask_lashpop':
      return {
        type: 'invoke_ask_lashpop',
        context: params.context as string,
        label: (params.button_label as string) || 'Chat with Team',
      }

    default:
      return null
  }
}

// Build style cards for comparison
function buildStyleCards(
  category: string,
  styles: string[],
  highlight: string
): StyleCard[] {
  // This would ideally pull from DAM assets, but for now return basic cards
  const styleInfo: Record<string, { name: string; description: string }> = {
    classic: { name: 'Classic Lashes', description: 'Natural, elegant - one extension per lash' },
    hybrid: { name: 'Hybrid Lashes', description: 'The best of both worlds - texture and fullness' },
    volume: { name: 'Volume Lashes', description: 'Full, fluffy, and glamorous' },
    'wet-angel': { name: 'Wet/Angel Lashes', description: 'Textured, editorial, fashion-forward' },
    'lash-lift': { name: 'Lash Lift', description: 'Enhance your natural lashes - no extensions' },
  }

  return styles.map((style) => ({
    id: style,
    name: styleInfo[style]?.name || style,
    description: styleInfo[style]?.description || '',
    tags: [category, style, highlight === style ? 'recommended' : ''].filter(Boolean),
  }))
}

// ASK LASHPOP - GPT Function Definitions

import type { GPTFunction, ChatAction, FormField } from './types'

// Service category mapping
export const CATEGORY_MAP: Record<string, { id: string; name: string }> = {
  lashes: { id: 'lashes', name: 'Lashes' },
  brows: { id: 'brows', name: 'Brows' },
  facials: { id: 'facials', name: 'Facials' },
  'permanent-makeup': { id: 'permanent-makeup', name: 'Permanent Makeup' },
  waxing: { id: 'waxing', name: 'Waxing' },
  bundles: { id: 'bundles', name: 'Bundles' },
  specialty: { id: 'specialty', name: 'Specialty' },
}

// Section mapping
export const SECTION_MAP: Record<string, string> = {
  team: '#team',
  gallery: '#gallery',
  reviews: '#reviews',
  faq: '#faq',
  'find-us': '#find-us',
  map: '#find-us',
  top: '#hero',
  home: '#hero',
}

// Team member IDs for lookup
export const TEAM_MEMBER_MAP: Record<string, { id: number; name: string }> = {
  'emily': { id: 1, name: 'Emily Rogers' },
  'emily-rogers': { id: 1, name: 'Emily Rogers' },
  'rachel': { id: 2, name: 'Rachel Edwards' },
  'rachel-edwards': { id: 2, name: 'Rachel Edwards' },
  'ryann': { id: 3, name: 'Ryann Alcorn' },
  'ryann-alcorn': { id: 3, name: 'Ryann Alcorn' },
  'ashley': { id: 4, name: 'Ashley Petersen' },
  'ashley-petersen': { id: 4, name: 'Ashley Petersen' },
  'ava': { id: 5, name: 'Ava Mata' },
  'ava-mata': { id: 5, name: 'Ava Mata' },
  'savannah': { id: 6, name: 'Savannah Scherer' },
  'savannah-scherer': { id: 6, name: 'Savannah Scherer' },
  'elena': { id: 7, name: 'Elena Castellanos' },
  'elena-castellanos': { id: 7, name: 'Elena Castellanos' },
  'adrianna': { id: 8, name: 'Adrianna Arnaud' },
  'adrianna-arnaud': { id: 8, name: 'Adrianna Arnaud' },
  'kelly': { id: 9, name: 'Kelly Katona' },
  'kelly-katona': { id: 9, name: 'Kelly Katona' },
  'bethany': { id: 10, name: 'Bethany Peterson' },
  'bethany-peterson': { id: 10, name: 'Bethany Peterson' },
  'grace': { id: 11, name: 'Grace Ramos' },
  'grace-ramos': { id: 11, name: 'Grace Ramos' },
  'renee': { id: 12, name: 'Renee Belton' },
  'renee-belton': { id: 12, name: 'Renee Belton' },
  'evie': { id: 13, name: 'Evie Ells' },
  'evie-ells': { id: 13, name: 'Evie Ells' },
  'haley': { id: 14, name: 'Haley Walker' },
  'haley-walker': { id: 14, name: 'Haley Walker' },
}

// Contact form field templates
export const FORM_FIELDS: Record<string, FormField[]> = {
  general: [
    { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'Jane Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'jane@example.com' },
    { name: 'phone', label: 'Phone (optional)', type: 'phone', required: false, placeholder: '(555) 123-4567' },
    { name: 'message', label: 'Your Question', type: 'textarea', required: true, placeholder: 'How can we help?' },
  ],
  bridal: [
    { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'Jane Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'jane@example.com' },
    { name: 'phone', label: 'Phone', type: 'phone', required: true, placeholder: '(555) 123-4567' },
    { name: 'weddingDate', label: 'Wedding Date', type: 'date', required: true },
    { name: 'message', label: 'Tell us about your vision', type: 'textarea', required: true, placeholder: 'Services you\'re interested in, wedding party size, etc.' },
  ],
  complaint: [
    { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'Jane Doe' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'jane@example.com' },
    { name: 'phone', label: 'Phone', type: 'phone', required: true, placeholder: '(555) 123-4567' },
    { name: 'message', label: 'What happened?', type: 'textarea', required: true, placeholder: 'Please describe your experience so we can make it right' },
  ],
  callback: [
    { name: 'name', label: 'Your Name', type: 'text', required: true, placeholder: 'Jane Doe' },
    { name: 'phone', label: 'Phone Number', type: 'phone', required: true, placeholder: '(555) 123-4567' },
    { name: 'email', label: 'Email (optional)', type: 'email', required: false, placeholder: 'jane@example.com' },
    { name: 'message', label: 'What can we help with?', type: 'textarea', required: false, placeholder: 'Brief description (optional)' },
  ],
}

// GPT Function Definitions
export const GPT_FUNCTIONS: GPTFunction[] = [
  {
    name: 'scroll_to_section',
    description: 'Scroll the page to a specific section. Use this when users ask about location, reviews, team, etc.',
    parameters: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: ['team', 'gallery', 'reviews', 'faq', 'find-us', 'top'],
          description: 'The section to scroll to',
        },
        button_label: {
          type: 'string',
          description: 'Label for the action button (e.g., "Take me to the map")',
        },
      },
      required: ['section', 'button_label'],
    },
  },
  {
    name: 'show_services',
    description: 'Open the service browser/explorer for a specific category. Use when users want to see services.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['lashes', 'brows', 'facials', 'permanent-makeup', 'waxing', 'bundles'],
          description: 'The service category to show',
        },
        button_label: {
          type: 'string',
          description: 'Label for the action button (e.g., "Browse Lash Services")',
        },
      },
      required: ['category', 'button_label'],
    },
  },
  {
    name: 'book_service',
    description: 'Load the booking widget for a specific service. Use when users want to book a particular service.',
    parameters: {
      type: 'object',
      properties: {
        service_slug: {
          type: 'string',
          description: 'The slug/ID of the service to book (e.g., "lash-lift", "classic-extensions")',
        },
        service_name: {
          type: 'string',
          description: 'Display name of the service',
        },
        button_label: {
          type: 'string',
          description: 'Label for the action button (e.g., "Book Lash Lift")',
        },
      },
      required: ['service_slug', 'service_name', 'button_label'],
    },
  },
  {
    name: 'collect_contact_info',
    description: 'DEPRECATED - Do NOT use this. Instead, collect message and contact info through conversation, then use send_message_to_team.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: ['general', 'bridal', 'complaint', 'callback'],
          description: 'The type of inquiry',
        },
        button_label: {
          type: 'string',
          description: 'Label for the action button',
        },
      },
      required: ['reason', 'button_label'],
    },
  },
  {
    name: 'send_message_to_team',
    description: 'Submit a message to the LashPop team. Only call AFTER gathering: 1) what they need help with, 2) relevant context (appointment details, who they are booked with, etc), 3) their name, 4) email or phone. The message should be a helpful summary for the team.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Customer name',
        },
        email: {
          type: 'string',
          description: 'Customer email address (optional if phone provided)',
        },
        phone: {
          type: 'string',
          description: 'Customer phone number (optional if email provided)',
        },
        message: {
          type: 'string',
          description: 'A helpful summary for the team including: what the customer needs, any relevant details (appointment time, artist name, etc), and context. Write it as a clear message the team can act on.',
        },
        inquiry_type: {
          type: 'string',
          enum: ['general', 'bridal', 'complaint', 'booking_help', 'reschedule', 'question'],
          description: 'Type of inquiry',
        },
      },
      required: ['name', 'message'],
    },
  },
  {
    name: 'display_buttons',
    description: 'Show multiple action buttons. Use when offering several options to the user.',
    parameters: {
      type: 'object',
      properties: {
        buttons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Button text' },
              type: {
                type: 'string',
                enum: ['scroll', 'services', 'book', 'call', 'email', 'external'],
                description: 'Type of action',
              },
              value: { type: 'string', description: 'Value for the action (section name, category, service slug, URL, etc.)' },
              icon: { type: 'string', description: 'Icon name (map-pin, calendar, phone, mail, eye, sparkles)' },
            },
            required: ['label', 'type', 'value'],
          },
          description: 'Array of buttons to display',
        },
      },
      required: ['buttons'],
    },
  },
  {
    name: 'display_team_card',
    description: 'Show a rich team member card with photo, bio, specialties, and booking link. Use when discussing a specific team member or when recommending someone for a service.',
    parameters: {
      type: 'object',
      properties: {
        member_name: {
          type: 'string',
          enum: ['emily', 'rachel', 'ryann', 'ashley', 'ava', 'savannah', 'elena', 'adrianna', 'kelly', 'bethany', 'grace', 'renee', 'evie', 'haley'],
          description: 'First name of the team member (lowercase)',
        },
        button_label: {
          type: 'string',
          description: 'Label for the card button (e.g., "Meet Rachel")',
        },
      },
      required: ['member_name', 'button_label'],
    },
  },
]

// Convert GPT function call to ChatAction
export function functionCallToAction(
  functionName: string,
  args: Record<string, unknown>,
  servicesMap?: Map<string, { vagaroServiceCode: string; priceStarting: number; durationMinutes: number; categoryName: string }>
): ChatAction | ChatAction[] | null {
  switch (functionName) {
    case 'scroll_to_section': {
      return {
        type: 'scroll_to_section',
        target: args.section as string,
        thenCollapse: true,
        label: args.button_label as string,
        icon: 'map-pin',
      }
    }

    case 'show_services': {
      const category = CATEGORY_MAP[args.category as string]
      if (!category) return null
      return {
        type: 'open_panel',
        panelType: 'service-panel',
        data: { categoryId: category.id, categoryName: category.name },
        thenCollapse: true,
        label: args.button_label as string,
        icon: 'eye',
      }
    }

    case 'book_service': {
      const slug = args.service_slug as string
      const serviceInfo = servicesMap?.get(slug)

      return {
        type: 'load_vagaro_inline',
        service: {
          id: slug,
          name: args.service_name as string,
          vagaroServiceCode: serviceInfo?.vagaroServiceCode || '',
          priceStarting: serviceInfo?.priceStarting || 0,
          durationMinutes: serviceInfo?.durationMinutes || 60,
          categoryName: serviceInfo?.categoryName,
        },
        label: args.button_label as string,
        icon: 'calendar',
      }
    }

    case 'collect_contact_info': {
      const reason = args.reason as keyof typeof FORM_FIELDS
      return {
        type: 'show_form',
        formType: reason as 'contact' | 'callback' | 'bridal' | 'complaint',
        fields: FORM_FIELDS[reason] || FORM_FIELDS.general,
        label: args.button_label as string,
        icon: 'mail',
      }
    }

    case 'send_message_to_team': {
      return {
        type: 'submit_team_message',
        data: {
          name: args.name as string,
          email: args.email as string | undefined,
          phone: args.phone as string | undefined,
          message: args.message as string,
          inquiryType: args.inquiry_type as string || 'general',
        },
        label: 'Message sent!',
        icon: 'check',
      }
    }

    case 'display_buttons': {
      const buttons = args.buttons as Array<{ label: string; type: string; value: string; icon?: string }>
      return buttons.map((btn): ChatAction => {
        switch (btn.type) {
          case 'scroll':
            return {
              type: 'scroll_to_section',
              target: btn.value,
              thenCollapse: true,
              label: btn.label,
              icon: btn.icon || 'map-pin',
            }
          case 'services': {
            const cat = CATEGORY_MAP[btn.value]
            return {
              type: 'open_panel',
              panelType: 'service-panel',
              data: { categoryId: cat?.id || btn.value, categoryName: cat?.name || btn.value },
              thenCollapse: true,
              label: btn.label,
              icon: btn.icon || 'eye',
            }
          }
          case 'book': {
            const svc = servicesMap?.get(btn.value)
            return {
              type: 'load_vagaro_inline',
              service: {
                id: btn.value,
                name: btn.label.replace('Book ', ''),
                vagaroServiceCode: svc?.vagaroServiceCode || '',
                priceStarting: svc?.priceStarting || 0,
                durationMinutes: svc?.durationMinutes || 60,
                categoryName: svc?.categoryName,
              },
              label: btn.label,
              icon: btn.icon || 'calendar',
            }
          }
          case 'call':
            return {
              type: 'call_phone',
              number: btn.value || '+17602120448',
              label: btn.label,
              icon: btn.icon || 'phone',
            }
          case 'email':
            return {
              type: 'open_external',
              url: `mailto:${btn.value || 'hello@lashpopstudios.com'}`,
              label: btn.label,
              icon: btn.icon || 'mail',
            }
          case 'external':
          default:
            return {
              type: 'open_external',
              url: btn.value,
              label: btn.label,
              icon: btn.icon || 'external',
            }
        }
      })
    }

    case 'display_team_card': {
      const memberKey = (args.member_name as string).toLowerCase()
      const member = TEAM_MEMBER_MAP[memberKey]
      if (!member) return null
      return {
        type: 'display_team_card',
        memberId: member.id,
        memberName: member.name,
        label: args.button_label as string,
        icon: 'user',
      }
    }

    default:
      return null
  }
}

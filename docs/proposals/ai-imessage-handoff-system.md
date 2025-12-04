# AI iMessage Handoff System - Technical Proposal

> **Lashpop Studios** - Intelligent Live Handoff via BlueBubbles iMessage Integration

## Executive Summary

This proposal outlines an AI-powered "operator" system that enables the Lashpop AI agent to facilitate real-time handoffs between customers and team members via iMessage. The AI acts as an intelligent concierge, capable of reaching out to team members, coordinating availability, creating group conversations, and seamlessly connecting people when human expertise is needed.

---

## The Vision

Imagine this conversation:

```
Customer: Hi! I'm thinking about getting lash extensions but I have
          really sensitive eyes. Is Emily available to chat?

AI Agent: Great question! Emily specializes in sensitive eye consultations.
          Let me reach out to her and see if she can chat right now.

          While I'm checking, would you prefer:
          1. Wait a moment while I see if she's free
          2. Leave her a message and I'll make sure she gets it
          3. Share your number and I'll text you when she's available

Customer: I can wait a minute!

AI Agent: Perfect, reaching out to Emily now...

[Behind the scenes: AI sends iMessage to Emily via BlueBubbles]
[Emily responds within 30 seconds: "Yes! Add me to the chat"]

AI Agent: Great news! Emily is available. I'm adding her to our
          conversation now. She'll be with you in just a moment.

[AI creates group iMessage: Customer + Emily + AI's number]
[Emily joins and takes over the conversation]

Emily: Hi! I heard you have sensitive eyes - that's actually one of
       my specialties! Let me tell you about our gentle lash options...
```

---

## System Architecture

### High-Level Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Customer      │────▶│   AI Agent       │────▶│  BlueBubbles    │
│   (Web/Chat)    │     │   (Lashpop)      │     │  iMessage API   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                        │
                               │                        ▼
                               │                ┌─────────────────┐
                               │                │  Team Member    │
                               │                │  (iMessage)     │
                               └───────────────▶│                 │
                                                └─────────────────┘
```

### Component Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        LASHPOP AI AGENT                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  Conversation   │  │   Tool Layer    │  │    Response     │    │
│  │    Context      │  │                 │  │    Generator    │    │
│  │                 │  │  - Handoff      │  │                 │    │
│  │  - User info    │  │  - Availability │  │  - Natural      │    │
│  │  - History      │  │  - Group SMS    │  │  - Contextual   │    │
│  │  - Preferences  │  │  - Callback     │  │  - Empathetic   │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│           │                   │                    │               │
│           └───────────────────┼────────────────────┘               │
│                               ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    BlueBubbles Service                       │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │  │
│  │  │ Send Message │ │ Create Group │ │ Webhook Handler      │ │  │
│  │  │              │ │   Chat       │ │ (incoming messages)  │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                               │                                    │
└───────────────────────────────┼────────────────────────────────────┘
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐ │
│  │  Conversations   │ │  Handoff         │ │  Team Availability │ │
│  │  & Messages      │ │  Requests        │ │  & Preferences     │ │
│  └──────────────────┘ └──────────────────┘ └────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## BlueBubbles Integration

### API Client (`/src/lib/bluebubbles-client.ts`)

```typescript
interface BlueBubblesConfig {
  serverUrl: string;      // e.g., "http://192.168.1.100:1234"
  password: string;       // BlueBubbles server password
  agentPhoneNumber: string; // The Mac's iMessage phone number
}

interface BlueBubblesClient {
  // Core Messaging
  sendMessage(to: string, message: string): Promise<MessageResult>;
  sendToGroup(chatGuid: string, message: string): Promise<MessageResult>;

  // Group Management
  createGroup(participants: string[], name?: string): Promise<GroupResult>;
  addParticipant(chatGuid: string, phone: string): Promise<void>;
  removeParticipant(chatGuid: string, phone: string): Promise<void>;

  // Message Reading
  getRecentMessages(chatGuid: string, limit?: number): Promise<Message[]>;
  getUnreadMessages(): Promise<Message[]>;
  markAsRead(messageGuid: string): Promise<void>;

  // Reactions & Typing
  sendReaction(messageGuid: string, reaction: ReactionType): Promise<void>;
  sendTypingIndicator(chatGuid: string): Promise<void>;

  // Chat Management
  getChatByParticipants(phones: string[]): Promise<Chat | null>;
  getRecentChats(limit?: number): Promise<Chat[]>;
}
```

### BlueBubbles API Endpoints Used

```typescript
// Key BlueBubbles REST API endpoints:
POST /api/v1/message/text           // Send a text message
POST /api/v1/chat/new               // Create new chat/group
POST /api/v1/chat/:guid/participant // Add participant to group
GET  /api/v1/chat/:guid/message     // Get messages from chat
GET  /api/v1/message                // Get all messages with filters
POST /api/v1/chat/:guid/read        // Mark chat as read
POST /api/v1/chat/:guid/typing      // Send typing indicator

// Webhook for incoming messages:
POST /api/webhooks/bluebubbles      // Receive new messages
```

---

## Database Schema

### New Tables Required

```typescript
// conversations.ts - Track all AI conversations
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Participant info
  customerPhone: text('customer_phone'),
  customerUserId: uuid('customer_user_id').references(() => users.id),
  customerName: text('customer_name'),

  // Channel info
  channel: text('channel').notNull(), // 'web_chat' | 'imessage' | 'sms'
  externalChatId: text('external_chat_id'), // BlueBubbles chat GUID

  // Conversation state
  status: text('status').default('active'), // 'active' | 'handed_off' | 'resolved' | 'abandoned'
  handedOffToId: uuid('handed_off_to_id').references(() => teamMembers.id),
  handedOffAt: timestamp('handed_off_at'),

  // Context for AI
  topic: text('topic'), // Inferred conversation topic
  customerIntent: jsonb('customer_intent'), // Structured intent data
  summaryForHandoff: text('summary_for_handoff'), // AI-generated summary

  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

// conversation_messages.ts - All messages in conversations
export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id),

  // Message content
  role: text('role').notNull(), // 'customer' | 'ai' | 'team_member'
  senderId: text('sender_id'), // phone or user id
  senderName: text('sender_name'),
  content: text('content').notNull(),

  // Channel specifics
  channel: text('channel').notNull(), // 'web_chat' | 'imessage' | 'sms'
  externalMessageId: text('external_message_id'), // BlueBubbles message GUID

  // AI analysis
  sentiment: text('sentiment'), // 'positive' | 'neutral' | 'negative'
  intentTags: jsonb('intent_tags'), // ['booking', 'question', 'complaint']

  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
});

// handoff_requests.ts - Track handoff attempts
export const handoffRequests = pgTable('handoff_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id),

  // Request details
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id),
  requestType: text('request_type'), // 'live_chat' | 'callback' | 'message'
  urgency: text('urgency').default('normal'), // 'low' | 'normal' | 'high'
  reason: text('reason'), // AI-generated reason for handoff

  // Customer context
  customerPhone: text('customer_phone'),
  customerName: text('customer_name'),
  conversationSummary: text('conversation_summary'),

  // Team member response
  status: text('status').default('pending'),
  // 'pending' | 'accepted' | 'declined' | 'timeout' | 'completed'
  respondedAt: timestamp('responded_at'),
  responseMessage: text('response_message'),

  // Timeout handling
  timeoutSeconds: integer('timeout_seconds').default(60),
  expiresAt: timestamp('expires_at'),

  // Group chat (if created)
  groupChatGuid: text('group_chat_guid'),

  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

// callback_requests.ts - Customer callback scheduling
export const callbackRequests = pgTable('callback_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id),

  // Parties
  customerPhone: text('customer_phone').notNull(),
  customerName: text('customer_name'),
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id),

  // Callback details
  preferredTime: text('preferred_time'), // 'asap' | 'morning' | 'afternoon' | 'evening'
  notes: text('notes'),
  topic: text('topic'),

  // Status tracking
  status: text('status').default('pending'),
  // 'pending' | 'notified_team' | 'team_accepted' | 'customer_notified' | 'completed' | 'cancelled'

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  teamNotifiedAt: timestamp('team_notified_at'),
  customerNotifiedAt: timestamp('customer_notified_at'),
  completedAt: timestamp('completed_at'),
});

// team_availability.ts - Real-time team member status
export const teamAvailability = pgTable('team_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamMemberId: uuid('team_member_id').references(() => teamMembers.id).unique(),

  // Availability status
  status: text('status').default('unknown'),
  // 'available' | 'busy' | 'do_not_disturb' | 'offline' | 'unknown'

  // Auto-detection
  lastMessageSentAt: timestamp('last_message_sent_at'),
  lastResponseAt: timestamp('last_response_at'),
  averageResponseTimeSeconds: integer('average_response_time_seconds'),

  // Manual preferences
  acceptingHandoffs: boolean('accepting_handoffs').default(true),
  handoffHoursStart: text('handoff_hours_start'), // "09:00"
  handoffHoursEnd: text('handoff_hours_end'), // "18:00"
  handoffDays: jsonb('handoff_days'), // [1,2,3,4,5] (Mon-Fri)

  // Current session
  activeConversationCount: integer('active_conversation_count').default(0),
  maxConcurrentChats: integer('max_concurrent_chats').default(3),

  // Metadata
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Team Member Schema Extensions

```typescript
// Add to existing team_members table
export const teamMembersExtensions = {
  // iMessage handoff preferences
  imessageEnabled: boolean('imessage_enabled').default(true),
  preferredContactMethod: text('preferred_contact_method'), // 'imessage' | 'sms' | 'both'
  handoffNotificationSound: boolean('handoff_notification_sound').default(true),

  // Expertise routing
  handoffSpecialties: jsonb('handoff_specialties'), // ['sensitive_eyes', 'first_timers', 'corrections']
  canHandleComplaints: boolean('can_handle_complaints').default(false),
  canHandleBookings: boolean('can_handle_bookings').default(true),

  // Response patterns (ML-updatable)
  typicalResponseTimeSeconds: integer('typical_response_time_seconds'),
  handoffAcceptanceRate: decimal('handoff_acceptance_rate'), // 0.0 - 1.0
};
```

---

## AI Agent Tool Definitions

### Core Handoff Tools

```typescript
// Tool: check_team_availability
{
  name: "check_team_availability",
  description: "Check which team members are currently available for a live handoff based on specialty, current workload, and response patterns.",
  parameters: {
    specialty: { type: "string", optional: true },
    urgency: { enum: ["low", "normal", "high"], default: "normal" },
    teamMemberId: { type: "string", optional: true }, // Check specific person
  },
  returns: {
    available: TeamMember[],
    busy: TeamMember[],
    offline: TeamMember[],
    recommendations: string[], // AI-readable recommendations
  }
}

// Tool: request_live_handoff
{
  name: "request_live_handoff",
  description: "Send an iMessage to a team member requesting they join a live conversation with a customer. Waits for response up to timeout.",
  parameters: {
    teamMemberId: { type: "string", required: true },
    customerContext: { type: "string", required: true }, // Summary for team member
    customerName: { type: "string", optional: true },
    urgency: { enum: ["low", "normal", "high"], default: "normal" },
    timeoutSeconds: { type: "number", default: 60 },
  },
  returns: {
    success: boolean,
    status: "accepted" | "declined" | "timeout" | "error",
    responseMessage: string | null,
    waitTimeSeconds: number,
  }
}

// Tool: create_group_conversation
{
  name: "create_group_conversation",
  description: "Create a group iMessage chat between the customer, team member, and optionally the AI agent. Used after a handoff is accepted.",
  parameters: {
    customerPhone: { type: "string", required: true },
    teamMemberPhone: { type: "string", required: true },
    includeAgent: { type: "boolean", default: false },
    initialMessage: { type: "string", optional: true }, // Welcome message
    conversationSummary: { type: "string", optional: true }, // Context for team member
  },
  returns: {
    success: boolean,
    groupChatGuid: string,
    participants: string[],
  }
}

// Tool: send_message_to_team_member
{
  name: "send_message_to_team_member",
  description: "Send a direct iMessage to a specific team member. Use for non-urgent messages or leaving notes.",
  parameters: {
    teamMemberId: { type: "string", required: true },
    message: { type: "string", required: true },
    expectReply: { type: "boolean", default: false },
  },
  returns: {
    success: boolean,
    messageGuid: string,
    deliveredAt: string | null,
  }
}

// Tool: schedule_callback
{
  name: "schedule_callback",
  description: "Schedule a callback request. The team member will be notified, and when they're available, the customer will receive a text.",
  parameters: {
    customerPhone: { type: "string", required: true },
    customerName: { type: "string", optional: true },
    teamMemberId: { type: "string", optional: true }, // Specific or auto-assign
    preferredTime: { enum: ["asap", "morning", "afternoon", "evening"], default: "asap" },
    topic: { type: "string", required: true },
    notes: { type: "string", optional: true }, // Context from conversation
  },
  returns: {
    success: boolean,
    callbackId: string,
    estimatedWait: string, // "~15 minutes" or "tomorrow morning"
  }
}

// Tool: take_message_for_team_member
{
  name: "take_message_for_team_member",
  description: "Take a detailed message from the customer to deliver to a team member later.",
  parameters: {
    teamMemberId: { type: "string", required: true },
    customerPhone: { type: "string", optional: true },
    customerName: { type: "string", optional: true },
    message: { type: "string", required: true },
    priority: { enum: ["low", "normal", "high"], default: "normal" },
    requestCallback: { type: "boolean", default: false },
  },
  returns: {
    success: boolean,
    messageId: string,
    deliveryStatus: "queued" | "sent" | "delivered" | "read",
  }
}

// Tool: notify_customer_via_sms
{
  name: "notify_customer_via_sms",
  description: "Send an SMS to the customer (uses Twilio). For callbacks, availability updates, etc.",
  parameters: {
    customerPhone: { type: "string", required: true },
    message: { type: "string", required: true },
    templateId: { type: "string", optional: true }, // Pre-approved templates
  },
  returns: {
    success: boolean,
    messageSid: string,
  }
}
```

### Intelligent Routing Tools

```typescript
// Tool: analyze_handoff_need
{
  name: "analyze_handoff_need",
  description: "Analyze the current conversation to determine if a human handoff is needed and who would be the best team member.",
  parameters: {
    conversationHistory: { type: "array", required: true },
    customerProfile: { type: "object", optional: true },
  },
  returns: {
    handoffRecommended: boolean,
    reason: string,
    recommendedTeamMembers: TeamMember[],
    suggestedApproach: "live_chat" | "callback" | "message" | "none",
    confidence: number, // 0.0 - 1.0
  }
}

// Tool: get_team_member_by_specialty
{
  name: "get_team_member_by_specialty",
  description: "Find the best team member for a specific specialty or customer need.",
  parameters: {
    specialty: { type: "string", required: true },
    preferredMemberId: { type: "string", optional: true }, // Customer's usual artist
    availability: { enum: ["now", "today", "any"], default: "now" },
  },
  returns: {
    bestMatch: TeamMember | null,
    alternatives: TeamMember[],
    reasoning: string,
  }
}
```

---

## Conversation Flows

### Flow 1: Live Handoff (Happy Path)

```
Customer: "I'd like to talk to Emily about my next appointment"
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ AI: check_team_availability({ teamMemberId: "emily_id" })       │
│     Result: Emily is AVAILABLE (responded to last msg 2m ago)   │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
AI: "Emily is here today! Let me see if she can chat right now.
     Would you like me to reach out to her?"
     │
Customer: "Yes please!"
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ AI: request_live_handoff({                                      │
│   teamMemberId: "emily_id",                                     │
│   customerContext: "Regular client Sarah wants to discuss her   │
│                    next lash fill appointment. She's been       │
│                    getting classics for 6 months.",             │
│   timeoutSeconds: 45                                            │
│ })                                                              │
│                                                                 │
│ [Sends iMessage to Emily]:                                      │
│ "🔔 Lashpop: Sarah would like to chat about her next           │
│  appointment. She's your regular classics client.               │
│  Reply YES to connect or NO if you're busy."                    │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼ (Emily replies "Yes!" within 20 seconds)
     │
┌─────────────────────────────────────────────────────────────────┐
│ AI: create_group_conversation({                                 │
│   customerPhone: "+1555123456",                                 │
│   teamMemberPhone: emily.phone,                                 │
│   initialMessage: "Hi Sarah! Emily here - I just got your      │
│                    message. What's on your mind?"               │
│ })                                                              │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
AI: "Great news! I've connected you with Emily. She's joining
     the chat now. I'll step back and let you two talk!"
     │
     ▼
[Conversation continues in group iMessage]
[AI monitors for completion/issues but doesn't interrupt]
```

### Flow 2: Team Member Busy/Unavailable

```
Customer: "Can I talk to someone about a lash correction?"
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ AI: analyze_handoff_need({ conversationHistory: [...] })        │
│     Result: handoffRecommended: true                            │
│             suggestedApproach: "live_chat"                      │
│             specialty: "corrections"                            │
│                                                                 │
│ AI: check_team_availability({ specialty: "corrections" })       │
│     Result: Maya (corrections expert) - BUSY (in appointment)  │
│             Emily - AVAILABLE but not corrections specialist   │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
AI: "I can help connect you with someone about corrections!

     Maya is our corrections specialist, but she's with a client
     right now. Here are your options:

     1. Wait ~30 minutes for Maya to be free
     2. Chat with Emily now (she can help with general questions)
     3. Leave Maya a message and I'll text you when she replies
     4. Share your number and I'll text you when Maya's available

     What works best for you?"
     │
Customer: "Option 4 please - my number is 555-987-6543"
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ AI: schedule_callback({                                         │
│   customerPhone: "+15559876543",                                │
│   customerName: "Customer",                                     │
│   teamMemberId: "maya_id",                                      │
│   topic: "Lash correction consultation",                        │
│   notes: "Customer experienced uneven lash loss, seeking advice"│
│ })                                                              │
│                                                                 │
│ [Sends iMessage to Maya]:                                       │
│ "📝 Lashpop: Callback request from a customer about lash       │
│  corrections. They'd like a call when you're free.              │
│  Reply when you're available and I'll connect you."             │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
AI: "Perfect! I've saved your number and let Maya know you'd like
     to chat. I'll text you at (555) 987-6543 as soon as she's
     available. Is there anything else I can help with while you wait?"
```

### Flow 3: Taking a Message

```
Customer: "I need to tell Emily that I want to switch to volume lashes"
     │
     ▼
AI: "I'd be happy to pass that message to Emily! Would you like me to:
     1. Just deliver the message
     2. Deliver and ask her to call you back
     3. Try to connect you live if she's free

     What would you prefer?"
     │
Customer: "Just deliver it, and maybe ask her thoughts"
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ AI: take_message_for_team_member({                              │
│   teamMemberId: "emily_id",                                     │
│   customerName: "Sarah",                                        │
│   message: "Hi Emily! Sarah is thinking about transitioning    │
│             from classics to volume lashes. She'd love to hear  │
│             your professional opinion when you have a moment.", │
│   priority: "normal"                                            │
│ })                                                              │
│                                                                 │
│ [Sends iMessage to Emily]:                                      │
│ "💬 Message from Sarah (your classics client):                 │
│  'I'm thinking about switching to volume lashes!'               │
│                                                                 │
│  She'd love your thoughts when you have a moment.               │
│  Reply here and I'll pass it along, or say CALL to connect."   │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
AI: "Done! I've sent your message to Emily. If she replies, would
     you like me to text you, or will you be back on the website?"
```

### Flow 4: Emergency/Complaint Escalation

```
Customer: "I'm really upset - my lashes are falling out and I have
          a wedding tomorrow!"
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ AI: analyze_handoff_need({ conversationHistory: [...] })        │
│     Result: handoffRecommended: true                            │
│             urgency: "high"                                     │
│             suggestedApproach: "live_chat"                      │
│             reason: "Customer distress + time-sensitive event" │
│                                                                 │
│ AI: check_team_availability({                                   │
│   specialty: "complaints",                                      │
│   urgency: "high"                                               │
│ })                                                              │
│     Result: Studio owner available                              │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
AI: "I'm so sorry you're dealing with this, especially before your
     wedding! This is absolutely something we need to fix right away.

     I'm reaching out to [Owner Name] directly - she handles VIP
     situations personally and I know she'll want to help you."
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ AI: request_live_handoff({                                      │
│   teamMemberId: "owner_id",                                     │
│   customerContext: "⚠️ URGENT: Customer experiencing lash      │
│                    fallout with wedding TOMORROW. Very upset.   │
│                    Needs immediate assistance and likely        │
│                    emergency appointment.",                     │
│   urgency: "high",                                              │
│   timeoutSeconds: 90  // Longer timeout for urgent              │
│ })                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## BlueBubbles Message Templates

### Handoff Request Templates

```typescript
const messageTemplates = {
  // Live handoff request
  handoffRequest: {
    normal: (customerName: string, context: string) =>
      `🔔 Lashpop: ${customerName} would like to chat.\n\n` +
      `${context}\n\n` +
      `Reply YES to connect or NO if busy.`,

    urgent: (customerName: string, context: string) =>
      `🚨 URGENT from Lashpop:\n\n` +
      `${customerName} needs immediate assistance.\n\n` +
      `${context}\n\n` +
      `Reply YES to connect ASAP.`,
  },

  // Callback notifications
  callbackRequest: (customerName: string, topic: string) =>
    `📞 Callback Request:\n\n` +
    `${customerName} would like a call about: ${topic}\n\n` +
    `Reply AVAILABLE when you're free.`,

  // Message delivery
  customerMessage: (customerName: string, message: string) =>
    `💬 Message from ${customerName}:\n\n` +
    `"${message}"\n\n` +
    `Reply here to respond, or CALL to connect live.`,

  // Group chat welcome
  groupWelcome: (teamMemberName: string, customerName: string, context: string) =>
    `Hi ${customerName}! ${teamMemberName} has joined the chat.\n\n` +
    `Context: ${context}\n\n` +
    `I'll step back now - you two are connected! 💬`,

  // Customer notification (via SMS/Twilio)
  customerAvailabilityNotification: (teamMemberName: string) =>
    `Great news! ${teamMemberName} from Lashpop is available now. ` +
    `Reply to this text to start chatting!`,
};
```

---

## Use Cases & Scenarios

### 1. Appointment Questions
- Customer asks about rescheduling → AI checks artist's schedule → Offers to connect live or book directly

### 2. Service Recommendations
- Customer unsure about lash style → AI provides initial guidance → Offers consultation with specialist

### 3. First-Time Client Anxiety
- New customer nervous about getting lashes → AI reassures → Connects with friendly team member for Q&A

### 4. Correction Consultations
- Customer unhappy with results → AI empathizes → Immediately escalates to senior artist

### 5. VIP/Loyalty Members
- High-tier member reaches out → AI recognizes status → Priority handoff to preferred artist

### 6. After-Hours Inquiries
- Customer messages at 10pm → AI helps with what it can → Schedules callback for morning

### 7. Multi-Party Coordination
- Bridal party needs group booking → AI coordinates → Creates group chat with coordinator + stylist

### 8. Follow-Up Scheduling
- Customer mentions lash issues → AI takes details → Notifies artist → Artist texts customer directly

### 9. Product Questions
- Customer asks about aftercare products → AI answers → Offers to connect for personalized recommendations

### 10. Emergency Situations
- Allergic reaction concern → Immediate escalation → Direct line to most senior available team member

---

## Intelligent Features

### Smart Routing Algorithm

```typescript
async function findBestTeamMember(request: HandoffRequest): Promise<TeamMember> {
  const candidates = await getAvailableTeamMembers();

  // Scoring factors
  const scores = candidates.map(member => ({
    member,
    score: calculateScore(member, {
      // Specialty match (40%)
      specialtyMatch: request.specialty
        ? member.handoffSpecialties.includes(request.specialty)
        : true,

      // Current availability (25%)
      availability: member.availability.status === 'available' ? 1 : 0.5,

      // Response time history (15%)
      responseSpeed: 1 - (member.typicalResponseTimeSeconds / 300), // 5min baseline

      // Acceptance rate (10%)
      acceptanceRate: member.handoffAcceptanceRate || 0.8,

      // Customer relationship (10%)
      hasRelationship: request.customerPreferredMemberId === member.id,
    })
  }));

  return scores.sort((a, b) => b.score - a.score)[0].member;
}
```

### Conversation Context Summarization

```typescript
async function generateHandoffContext(conversation: Conversation): Promise<string> {
  // AI generates a concise summary for the team member
  return await summarize({
    messages: conversation.messages,
    customerProfile: await getCustomerProfile(conversation.customerId),
    template: `
      Customer: {name} ({loyalty_tier} member, {visit_count} visits)
      Topic: {inferred_topic}
      Key Points: {bullet_points}
      Emotional State: {sentiment}
      Urgency: {urgency_level}
      Suggested Approach: {recommendation}
    `
  });
}
```

### Availability Learning

```typescript
// Track response patterns to improve routing
async function updateAvailabilityPatterns(
  teamMemberId: string,
  response: HandoffResponse
): Promise<void> {
  const current = await getTeamAvailability(teamMemberId);

  // Update rolling averages
  const newResponseTime = response.respondedAt - response.requestedAt;
  const avgResponseTime = (current.averageResponseTimeSeconds * 0.9) + (newResponseTime * 0.1);

  // Update acceptance rate
  const accepted = response.status === 'accepted' ? 1 : 0;
  const newAcceptanceRate = (current.acceptanceRate * 0.95) + (accepted * 0.05);

  await updateTeamAvailability(teamMemberId, {
    averageResponseTimeSeconds: avgResponseTime,
    handoffAcceptanceRate: newAcceptanceRate,
    lastResponseAt: response.respondedAt,
  });
}
```

---

## API Routes

### BlueBubbles Webhook Handler

```typescript
// /src/app/api/webhooks/bluebubbles/route.ts
export async function POST(req: NextRequest) {
  const event = await req.json();

  switch (event.type) {
    case 'new-message':
      return handleIncomingMessage(event.data);

    case 'message-send-error':
      return handleSendError(event.data);

    case 'chat-read-status-changed':
      return handleReadReceipt(event.data);

    case 'typing-indicator':
      return handleTypingIndicator(event.data);
  }

  return NextResponse.json({ received: true });
}

async function handleIncomingMessage(message: BlueBubblesMessage) {
  // Identify sender
  const sender = await identifySender(message.handle);

  if (sender.type === 'team_member') {
    // Team member responding to handoff request
    await processTeamMemberResponse(sender, message);
  } else if (sender.type === 'customer') {
    // Customer in active group chat - may need AI assistance
    await processCustomerMessage(sender, message);
  }
}
```

### Handoff API

```typescript
// /src/app/api/handoff/request/route.ts
export async function POST(req: NextRequest) {
  const {
    conversationId,
    teamMemberId,
    urgency,
    customerContext
  } = await req.json();

  // Create handoff request
  const handoff = await createHandoffRequest({
    conversationId,
    teamMemberId,
    urgency,
    customerContext,
    expiresAt: addSeconds(new Date(), 60),
  });

  // Send iMessage to team member
  const message = formatHandoffRequest(handoff);
  await bluebubbles.sendMessage(teamMember.phone, message);

  // Return immediately - webhook will handle response
  return NextResponse.json({
    handoffId: handoff.id,
    status: 'pending',
    expiresAt: handoff.expiresAt,
  });
}

// /src/app/api/handoff/status/[id]/route.ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const handoff = await getHandoffRequest(params.id);

  return NextResponse.json({
    status: handoff.status,
    respondedAt: handoff.respondedAt,
    responseMessage: handoff.responseMessage,
    groupChatGuid: handoff.groupChatGuid,
  });
}
```

---

## Environment Configuration

```env
# BlueBubbles Configuration
BLUEBUBBLES_SERVER_URL=http://192.168.1.100:1234
BLUEBUBBLES_PASSWORD=your_server_password
BLUEBUBBLES_AGENT_PHONE=+15551234567

# Handoff Settings
HANDOFF_DEFAULT_TIMEOUT_SECONDS=60
HANDOFF_URGENT_TIMEOUT_SECONDS=120
HANDOFF_MAX_RETRIES=2

# Feature Flags
ENABLE_IMESSAGE_HANDOFF=true
ENABLE_GROUP_CHATS=true
ENABLE_AVAILABILITY_LEARNING=true
```

---

## Security Considerations

### Phone Number Handling
- All phone numbers normalized to E.164 format
- Customer phone numbers encrypted at rest
- Team member phones only accessible to authenticated admin/agent

### Rate Limiting
- Max 10 handoff requests per customer per hour
- Max 50 messages per team member per day from AI
- Exponential backoff on failed deliveries

### Consent & Privacy
- Customers must consent before phone number is used
- Clear opt-out mechanism for SMS notifications
- Team members can disable handoff feature

### Message Logging
- All messages logged for support/compliance
- 90-day retention policy
- PII redaction in analytics

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] BlueBubbles API client implementation
- [ ] Database schema migrations
- [ ] Basic send/receive message flow
- [ ] Webhook handler for incoming messages

### Phase 2: Core Handoff (Week 3-4)
- [ ] Handoff request flow
- [ ] Team member response handling
- [ ] Timeout/expiry logic
- [ ] Basic availability tracking

### Phase 3: Group Chats (Week 5-6)
- [ ] Group chat creation
- [ ] Participant management
- [ ] Handoff completion detection
- [ ] AI monitoring of group chats

### Phase 4: Intelligence (Week 7-8)
- [ ] Smart routing algorithm
- [ ] Context summarization
- [ ] Availability learning
- [ ] Priority escalation

### Phase 5: Customer Features (Week 9-10)
- [ ] Callback scheduling
- [ ] Message taking
- [ ] SMS notifications to customers
- [ ] After-hours handling

### Phase 6: Polish (Week 11-12)
- [ ] Admin dashboard for monitoring
- [ ] Analytics and reporting
- [ ] Performance optimization
- [ ] Documentation and training

---

## Success Metrics

### Customer Experience
- Handoff acceptance rate: > 80%
- Average handoff wait time: < 45 seconds
- Customer satisfaction post-handoff: > 4.5/5

### Team Efficiency
- False positive handoff rate: < 10%
- Team member response rate: > 90%
- Conversations per team member per day: Optimal 5-10

### System Performance
- Message delivery rate: > 99%
- Webhook processing time: < 500ms
- End-to-end handoff latency: < 5 seconds

---

## Future Enhancements

### Phase 2 Ideas
- **Voice Handoff**: Integrate with phone system for voice calls
- **Video Consultations**: Add video chat capability
- **Appointment Booking in Chat**: Complete bookings without leaving conversation
- **AI Assistance During Handoff**: AI suggests responses to team members
- **Sentiment Monitoring**: Alert if customer becomes frustrated
- **Multi-Language Support**: Translate between customer and team member
- **Automated Follow-Up**: AI follows up after appointments
- **Team Performance Analytics**: Dashboard for handoff metrics

---

## Appendix: BlueBubbles API Reference

### Key Endpoints

```
GET  /api/v1/server/info          - Server info and status
POST /api/v1/message/text         - Send text message
POST /api/v1/message/attachment   - Send attachment
GET  /api/v1/chat                 - List all chats
POST /api/v1/chat/new             - Create new chat
GET  /api/v1/chat/:guid           - Get chat details
GET  /api/v1/chat/:guid/message   - Get messages from chat
POST /api/v1/chat/:guid/read      - Mark as read
POST /api/v1/chat/:guid/typing    - Send typing indicator
POST /api/v1/chat/:guid/leave     - Leave group chat
POST /api/v1/handle/availability  - Check iMessage availability
```

### Webhook Events

```typescript
type BlueBubblesWebhookEvent =
  | 'new-message'           // New message received
  | 'updated-message'       // Message edited/reaction
  | 'message-send-error'    // Send failed
  | 'chat-read-status-changed'  // Read receipt
  | 'typing-indicator'      // Someone typing
  | 'group-name-change'     // Group renamed
  | 'participant-added'     // New group member
  | 'participant-removed'   // Member left/removed
```

---

*This proposal provides a comprehensive foundation for building an AI-powered iMessage handoff system that transforms how Lashpop connects customers with team members.*

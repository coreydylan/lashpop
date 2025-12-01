import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core"
import { teamMembers } from "./team_members"

/**
 * Predefined quick fact types with associated icons
 * These are the common fact types we support, but custom types are also allowed
 */
export const QUICK_FACT_TYPES = {
  coffee: {
    label: "Go-To Coffee",
    icon: "coffee",
    emoji: "☕",
  },
  drink: {
    label: "Favorite Drink",
    icon: "wine",
    emoji: "🍹",
  },
  tv_show: {
    label: "Favorite TV Show",
    icon: "tv",
    emoji: "📺",
  },
  movie: {
    label: "Favorite Movie",
    icon: "film",
    emoji: "🎬",
  },
  hobby: {
    label: "Hobby",
    icon: "heart",
    emoji: "❤️",
  },
  hidden_talent: {
    label: "Hidden Talent",
    icon: "sparkles",
    emoji: "✨",
  },
  fun_fact: {
    label: "Fun Fact",
    icon: "star",
    emoji: "⭐",
  },
  pet: {
    label: "Pet",
    icon: "paw-print",
    emoji: "🐾",
  },
  music: {
    label: "Favorite Music",
    icon: "music",
    emoji: "🎵",
  },
  food: {
    label: "Favorite Food",
    icon: "utensils",
    emoji: "🍽️",
  },
  book: {
    label: "Favorite Book",
    icon: "book-open",
    emoji: "📚",
  },
  travel: {
    label: "Dream Destination",
    icon: "plane",
    emoji: "✈️",
  },
  sport: {
    label: "Sport",
    icon: "trophy",
    emoji: "🏆",
  },
  zodiac: {
    label: "Zodiac Sign",
    icon: "sparkle",
    emoji: "♈",
  },
  custom: {
    label: "Custom",
    icon: "info",
    emoji: "💫",
  },
} as const

export type QuickFactType = keyof typeof QUICK_FACT_TYPES

/**
 * Team Member Quick Facts
 * Stores individual quick facts for team members (coffee order, TV show, etc.)
 */
export const teamQuickFacts = pgTable("team_quick_facts", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),

  // Fact type (coffee, tv_show, movie, hobby, etc.)
  factType: text("fact_type").notNull(),

  // Custom label (for custom types or overriding default labels)
  customLabel: text("custom_label"),

  // The actual fact value/answer
  value: text("value").notNull(),

  // Icon override (lucide icon name or emoji)
  customIcon: text("custom_icon"),

  // Display order within the team member's facts
  displayOrder: integer("display_order").default(0).notNull(),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type InsertTeamQuickFact = typeof teamQuickFacts.$inferInsert
export type SelectTeamQuickFact = typeof teamQuickFacts.$inferSelect

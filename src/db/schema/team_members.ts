import { pgEnum, pgTable, text, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core"

export const teamMemberType = pgEnum("team_member_type", ["employee", "independent"])

export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Vagaro Integration - Source of truth for employee data
  vagaroEmployeeId: text("vagaro_employee_id").unique(), // Links to Vagaro employee/service provider
  vagaroData: jsonb("vagaro_data").$type<any>(), // Store full Vagaro response for reference

  // Core fields (synced from Vagaro or entered locally)
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),

  // Local enrichment fields (not in Vagaro)
  role: text("role").notNull(),
  type: teamMemberType("type").notNull(),
  businessName: text("business_name"),
  bio: text("bio"),
  quote: text("quote"),
  instagram: text("instagram"),
  bookingUrl: text("booking_url").notNull(),
  usesLashpopBooking: boolean("uses_lashpop_booking").default(true).notNull(),
  imageUrl: text("image_url").notNull(),
  specialties: jsonb("specialties").notNull().$type<string[]>(),
  favoriteServices: jsonb("favorite_services").$type<string[]>(),
  funFact: text("fun_fact"),
  availability: text("availability"),
  displayOrder: text("display_order").default("0"),
  isActive: boolean("is_active").default(true).notNull(),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at") // Track when last synced from Vagaro
})

export type InsertTeamMember = typeof teamMembers.$inferInsert
export type SelectTeamMember = typeof teamMembers.$inferSelect

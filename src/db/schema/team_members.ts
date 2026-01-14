import { pgEnum, pgTable, text, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core"

/**
 * Credential/Certification for structured data (Schema.org)
 * These appear in JSON-LD for search engines to demonstrate expertise (E-E-A-T)
 */
export interface TeamMemberCredential {
  type: 'certification' | 'license' | 'training' | 'award' | 'education'
  name: string                    // e.g., "Licensed Esthetician", "Certified Lash Artist"
  issuer?: string                 // e.g., "California Board of Barbering and Cosmetology"
  dateIssued?: string            // ISO date string
  expirationDate?: string        // ISO date string (for licenses)
  licenseNumber?: string         // For verifiable licenses
  url?: string                   // Link to verification or credential info
}

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
  manualServiceCategories: jsonb("manual_service_categories").$type<string[]>(), // Custom tags for services not in Vagaro (e.g., injectables)
  funFact: text("fun_fact"),
  availability: text("availability"),
  displayOrder: text("display_order").default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  showOnWebsite: boolean("show_on_website").default(true), // Legacy column - preserved for data

  // SEO/Schema.org structured data fields
  // Credentials appear in JSON-LD for search engines but not necessarily displayed publicly
  credentials: jsonb("credentials").$type<TeamMemberCredential[]>().default([]),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at") // Track when last synced from Vagaro
})

/**
 * Team Member Services - Junction table linking team members to services they perform
 */
export const teamMemberServices = pgTable("team_member_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").notNull(),
  price: text("price"),
  priceWithTax: text("price_with_tax"),
  durationMinutes: text("duration_minutes"),
  pointsGiven: text("points_given"),
  pointsRedeem: text("points_redeem"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
})

export type InsertTeamMember = typeof teamMembers.$inferInsert
export type SelectTeamMember = typeof teamMembers.$inferSelect
export type InsertTeamMemberService = typeof teamMemberServices.$inferInsert
export type SelectTeamMemberService = typeof teamMemberServices.$inferSelect

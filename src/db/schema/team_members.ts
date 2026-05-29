import { pgEnum, pgTable, text, timestamp, uuid, jsonb, boolean, integer } from "drizzle-orm/pg-core"

/**
 * Credential/Certification for structured data (Schema.org)
 * These appear in JSON-LD for search engines to demonstrate expertise (E-E-A-T)
 */
export interface TeamMemberCredential {
  type: 'certification' | 'license' | 'training' | 'award' | 'education' | 'founder'
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
  vagaroEmployeeId: text("vagaro_employee_id").unique(), // Base64 ID from v2 API
  vagaroData: jsonb("vagaro_data").$type<any>(), // Full v2 API response for reference

  // Public Vagaro staff page (vagaro.com/lashpop32/staff) — source of truth for photo + bio + order
  vagaroPublicProviderId: integer("vagaro_public_provider_id").unique(), // Numeric ID from public composite-staff endpoint
  vagaroPhotoUrl: text("vagaro_photo_url"), // Original-resolution photo URL from Vagaro CDN
  vagaroBio: text("vagaro_bio"), // BusinessSummary from Vagaro public profile

  // Core fields (synced from Vagaro or entered locally)
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),

  // Local enrichment fields (not in Vagaro)
  role: text("role").notNull(),
  type: teamMemberType("type").notNull(),
  businessName: text("business_name"),
  bio: text("bio"),
  // When true, the frontend prefers local `bio` over `vagaroBio` (set by inline admin edit).
  // The Vagaro sync keeps writing vagaroBio regardless, so "revert to Vagaro" = flip this false.
  bioOverride: boolean("bio_override").default(false).notNull(),
  quote: text("quote"),
  instagram: text("instagram"),
  // Optional override: if set, the IG link in the profile modal uses this URL
  // instead of the default https://instagram.com/{instagram}. Label stays @{instagram}.
  instagramUrl: text("instagram_url"),
  bookingUrl: text("booking_url").notNull(),
  usesLashpopBooking: boolean("uses_lashpop_booking").default(true).notNull(),
  imageUrl: text("image_url").notNull(),
  // When true, the frontend prefers local `imageUrl` over `vagaroPhotoUrl` (set by inline admin edit).
  imageOverride: boolean("image_override").default(false).notNull(),
  specialties: jsonb("specialties").notNull().$type<string[]>(),
  favoriteServices: jsonb("favorite_services").$type<string[]>(),
  manualServiceCategories: jsonb("manual_service_categories").$type<string[]>(), // Custom tags for services not in Vagaro (e.g., injectables)
  funFact: text("fun_fact"),
  availability: text("availability"),
  displayOrder: text("display_order").default("0"),
  isActive: boolean("is_active").default(true).notNull(),
  showOnWebsite: boolean("show_on_website").default(true), // Legacy column - preserved for data
  // Hand-created (off-Vagaro) stylist. The Vagaro sync's deactivate-missing loop must skip these,
  // otherwise the next sync would deactivate a stylist that was never in Vagaro.
  isOffVagaro: boolean("is_off_vagaro").default(false).notNull(),

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

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const formResponses = pgTable("form_responses", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Vagaro Integration
  vagaroResponseId: text("vagaro_response_id").unique().notNull(),
  vagaroFormId: text("vagaro_form_id").notNull(),
  vagaroCustomerId: text("vagaro_customer_id"),
  vagaroBusinessId: text("vagaro_business_id"),
  vagaroAppointmentId: text("vagaro_appointment_id"),
  vagaroMembershipId: text("vagaro_membership_id"),
  vagaroData: text("vagaro_data"), // Full JSON payload

  // Form details
  formTitle: text("form_title").notNull(),
  formPublishedDate: timestamp("form_published_date"),
  businessAlias: text("business_alias"),
  businessGroupId: text("business_group_id"),

  // Responses (JSON)
  questionsAndAnswers: text("questions_and_answers").notNull(), // JSON array

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at")
})

export type InsertFormResponse = typeof formResponses.$inferInsert
export type SelectFormResponse = typeof formResponses.$inferSelect

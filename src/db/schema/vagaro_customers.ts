import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const vagaroCustomers = pgTable("vagaro_customers", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Vagaro Integration
  vagaroCustomerId: text("vagaro_customer_id").unique().notNull(),
  vagaroBusinessIds: text("vagaro_business_ids"), // JSON array of business IDs
  vagaroData: text("vagaro_data"), // Full JSON payload

  // Customer information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  mobilePhone: text("mobile_phone"),
  dayPhone: text("day_phone"),
  nightPhone: text("night_phone"),

  // Address
  streetAddress: text("street_address"),
  city: text("city"),
  regionCode: text("region_code"),
  regionName: text("region_name"),
  countryCode: text("country_code"),
  countryName: text("country_name"),
  postalCode: text("postal_code"),

  // Metadata
  businessGroupId: text("business_group_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  vagaroCreatedAt: timestamp("vagaro_created_at"),
  vagaroModifiedAt: timestamp("vagaro_modified_at")
})

export type InsertVagaroCustomer = typeof vagaroCustomers.$inferInsert
export type SelectVagaroCustomer = typeof vagaroCustomers.$inferSelect

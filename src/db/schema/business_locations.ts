import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core"

export const businessLocations = pgTable("business_locations", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Vagaro Integration
  vagaroBusinessId: text("vagaro_business_id").unique().notNull(),
  vagaroBusinessGroupId: text("vagaro_business_group_id"),
  vagaroData: text("vagaro_data"), // Full JSON payload

  // Business information
  businessName: text("business_name").notNull(),
  businessGroupName: text("business_group_name"),
  businessAlias: text("business_alias"),
  businessPhone: text("business_phone"),
  businessEmail: text("business_email"),
  businessWebsite: text("business_website"),
  vagaroListingUrl: text("vagaro_listing_url"),

  // Address
  streetAddress: text("street_address"),
  city: text("city"),
  regionCode: text("region_code"),
  regionName: text("region_name"),
  countryCode: text("country_code"),
  countryName: text("country_name"),
  postalCode: text("postal_code"),

  // Settings
  showContactInformation: boolean("show_contact_information"),
  showVagaroConnect: boolean("show_vagaro_connect"),
  serviceLocation: text("service_location"), // AtBusiness, AtClientsLocation, Both
  listedOnVagaro: boolean("listed_on_vagaro"),
  listedOnGoogle: boolean("listed_on_google"),
  listedOnAppleMaps: boolean("listed_on_apple_maps"),
  useEmployeeHours: boolean("use_employee_hours"),

  // Facility info (JSON)
  childrenPolicy: text("children_policy"),
  walkInsAccepted: boolean("walk_ins_accepted"),
  paymentMethods: text("payment_methods"), // JSON array
  parking: text("parking"), // JSON array
  amenities: text("amenities"), // JSON array
  onlineGcStore: boolean("online_gc_store"),
  spokenLanguages: text("spoken_languages"), // JSON array
  businessHours: text("business_hours"), // JSON array of hours

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  vagaroCreatedAt: timestamp("vagaro_created_at"),
  vagaroModifiedAt: timestamp("vagaro_modified_at")
})

export type InsertBusinessLocation = typeof businessLocations.$inferInsert
export type SelectBusinessLocation = typeof businessLocations.$inferSelect

import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const teamMemberType = pgEnum('team_member_type', ['employee', 'independent'])

// Minimal mirror of src/db/schema/services.ts — only the fields this worker writes.
export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  vagaroServiceId: text('vagaro_service_id').unique(),
  vagaroParentServiceId: text('vagaro_parent_service_id'),
  vagaroData: jsonb('vagaro_data').$type<unknown>(),
  vagaroImageUrl: text('vagaro_image_url'),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  subtitle: text('subtitle'),
  // description = admin's local override; nullable.
  // vagaroDescription = what Vagaro published last; sync writes here.
  // Read sites: COALESCE(description, vagaroDescription).
  description: text('description'),
  vagaroDescription: text('vagaro_description'),
  durationMinutes: integer('duration_minutes').notNull(),
  priceStarting: integer('price_starting').notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  mainCategory: text('main_category').notNull(),
  subCategory: text('sub_category'),
  categoryId: uuid('category_id'),
  subcategoryId: uuid('subcategory_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
})

// Minimal mirror of src/db/schema/team_members.ts — only the fields this worker writes.
export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  vagaroEmployeeId: text('vagaro_employee_id').unique(),
  vagaroData: jsonb('vagaro_data').$type<unknown>(),
  // Public Vagaro staff page fields
  vagaroPublicProviderId: integer('vagaro_public_provider_id').unique(),
  vagaroPhotoUrl: text('vagaro_photo_url'),
  vagaroBio: text('vagaro_bio'),
  // Core
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  role: text('role').notNull(),
  type: teamMemberType('type').notNull(),
  bookingUrl: text('booking_url').notNull(),
  usesLashpopBooking: boolean('uses_lashpop_booking').default(true).notNull(),
  imageUrl: text('image_url').notNull(),
  externalServiceCategories: jsonb('external_service_categories').$type<string[]>(),
  displayOrder: text('display_order').default('0'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
})

// Canonical Vagaro stylist→service mapping. Truncate-and-replace per stylist
// each sync. Only stylists with uses_lashpop_booking=true populate this table.
export const teamMemberServicesVagaro = pgTable('team_member_services_vagaro', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamMemberId: uuid('team_member_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  vagaroParentTitle: text('vagaro_parent_title'),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqMemberService: unique('team_member_services_vagaro_member_service_unique')
    .on(t.teamMemberId, t.serviceId),
}))

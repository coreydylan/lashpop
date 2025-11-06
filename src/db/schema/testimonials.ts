import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core"
import { services } from "./services"

export const testimonials = pgTable("testimonials", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientName: text("client_name").notNull(),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(), // 1-5
  reviewText: text("review_text").notNull(),
  clientImage: text("client_image"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
})

export type InsertTestimonial = typeof testimonials.$inferInsert
export type SelectTestimonial = typeof testimonials.$inferSelect

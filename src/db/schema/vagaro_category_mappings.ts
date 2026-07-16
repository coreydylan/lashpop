import { index, pgTable, text, timestamp, unique, uuid } from "../sqlite-core"
import { serviceCategories } from "./service_categories"
import { vagaroServiceCategories } from "./vagaro_service_categories"

/** Maps raw Vagaro categories onto LashPop booking categories. */
export const vagaroCategoryMappings = pgTable("vagaro_category_mappings", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  vagaroCategoryId: uuid("vagaro_category_id")
    .notNull()
    .references(() => vagaroServiceCategories.id, { onDelete: "cascade" }),
  serviceCategoryId: uuid("service_category_id")
    .notNull()
    .references(() => serviceCategories.id, { onDelete: "cascade" }),
  mappingType: text("mapping_type").default("automatic").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  vagaroCategoryUnique: unique("vagaro_category_mappings_vagaro_unique").on(table.vagaroCategoryId),
  serviceCategoryIdx: index("vagaro_category_mappings_service_idx").on(table.serviceCategoryId),
}))

export type InsertVagaroCategoryMapping = typeof vagaroCategoryMappings.$inferInsert
export type SelectVagaroCategoryMapping = typeof vagaroCategoryMappings.$inferSelect

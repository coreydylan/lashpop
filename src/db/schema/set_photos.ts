import { pgTable, uuid, text, timestamp } from "../sqlite-core"
import { sets } from "./sets"
import { assets } from "./assets"

export const setPhotos = pgTable("set_photos", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  setId: uuid("set_id")
    .notNull()
    .references(() => sets.id, { onDelete: "cascade" }),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(), // "before" | "during" | "after"
  createdAt: timestamp("created_at").defaultNow().notNull()
})

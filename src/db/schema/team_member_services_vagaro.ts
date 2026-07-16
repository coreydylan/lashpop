import { pgTable, uuid, text, timestamp, unique, index } from "../sqlite-core"
import { teamMembers } from "./team_members"
import { services } from "./services"

/**
 * team_member_services_vagaro
 *
 * Canonical mapping of Vagaro-synced stylists (usesLashpopBooking=true) to the
 * services they perform. Populated by the vagaro-sync worker via per-stylist
 * composite endpoint calls. Read by the team-section actions to derive the
 * service-category tag chips shown on each stylist's card.
 *
 * Truncate-and-replace per stylist per sync — stale tags can never linger past
 * one sync cycle. Stylists with usesLashpopBooking=false NEVER have rows here;
 * their tags come from team_members.external_service_categories instead.
 */
export const teamMemberServicesVagaro = pgTable("team_member_services_vagaro", {
  id: uuid("id").$defaultFn(() => crypto.randomUUID()).primaryKey(),
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  // Vagaro's category title for the group the service was listed under in the
  // per-stylist composite walk (e.g. "Lash Extensions", "Brow Services").
  // Used by the read path to map raw Vagaro categories to the frontend's
  // canonical tag labels.
  vagaroParentTitle: text("vagaro_parent_title"),
  // Stable category identity from Vagaro. Titles can be renamed at any time.
  vagaroCategoryId: text("vagaro_category_id"),
  syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqMemberService: unique("team_member_services_vagaro_member_service_unique")
    .on(table.teamMemberId, table.serviceId),
  memberIdx: index("team_member_services_vagaro_member_idx").on(table.teamMemberId),
  serviceIdx: index("team_member_services_vagaro_service_idx").on(table.serviceId),
}))

export type InsertTeamMemberServiceVagaro = typeof teamMemberServicesVagaro.$inferInsert
export type SelectTeamMemberServiceVagaro = typeof teamMemberServicesVagaro.$inferSelect

import { pgTable, text, timestamp, uuid, numeric, integer } from "drizzle-orm/pg-core"

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Vagaro Integration
  vagaroTransactionId: text("vagaro_transaction_id"),
  vagaroUserPaymentId: text("vagaro_user_payment_id").unique().notNull(),
  vagaroUserPaymentsMstId: text("vagaro_user_payments_mst_id").notNull(),
  vagaroCustomerId: text("vagaro_customer_id"),
  vagaroServiceProviderId: text("vagaro_service_provider_id"),
  vagaroBusinessId: text("vagaro_business_id").notNull(),
  vagaroAppointmentId: text("vagaro_appointment_id"),
  vagaroData: text("vagaro_data"), // Full JSON payload

  // Transaction details
  transactionDate: timestamp("transaction_date").notNull(),
  businessAlias: text("business_alias"),
  businessGroupId: text("business_group_id"),
  brandName: text("brand_name"),
  itemSold: text("item_sold").notNull(),
  purchaseType: text("purchase_type").notNull(), // Service, Product, etc.
  serviceCategory: text("service_category"),
  quantity: integer("quantity").notNull(),

  // Payment amounts (all in cents)
  ccAmount: numeric("cc_amount", { precision: 10, scale: 2 }),
  cashAmount: numeric("cash_amount", { precision: 10, scale: 2 }),
  checkAmount: numeric("check_amount", { precision: 10, scale: 2 }),
  achAmount: numeric("ach_amount", { precision: 10, scale: 2 }),
  bankAccountAmount: numeric("bank_account_amount", { precision: 10, scale: 2 }),
  vagaroPayLaterAmount: numeric("vagaro_pay_later_amount", { precision: 10, scale: 2 }),
  otherAmount: numeric("other_amount", { precision: 10, scale: 2 }),
  packageRedemption: numeric("package_redemption", { precision: 10, scale: 2 }),
  gcRedemption: numeric("gc_redemption", { precision: 10, scale: 2 }),
  pointsAmount: integer("points_amount"),

  // Additional amounts
  tax: numeric("tax", { precision: 10, scale: 2 }),
  tip: numeric("tip", { precision: 10, scale: 2 }),
  discount: numeric("discount", { precision: 10, scale: 2 }),
  membershipAmount: numeric("membership_amount", { precision: 10, scale: 2 }),
  productDiscount: numeric("product_discount", { precision: 10, scale: 2 }),
  amountDue: numeric("amount_due", { precision: 10, scale: 2 }),

  // Payment method details
  ccType: text("cc_type"), // Visa, MasterCard, etc.
  ccMode: text("cc_mode"), // C: Chip, S: Swiped, etc.

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  vagaroCreatedBy: text("vagaro_created_by")
})

export type InsertTransaction = typeof transactions.$inferInsert
export type SelectTransaction = typeof transactions.$inferSelect

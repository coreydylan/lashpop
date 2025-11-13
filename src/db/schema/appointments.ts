import { pgTable, text, timestamp, uuid, numeric, boolean } from "drizzle-orm/pg-core"

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),

  // LashPop user linking (NEW - for auth system)
  userId: text("user_id"), // LashPop user who owns this appointment
  bookedByUserId: text("booked_by_user_id"), // Who made the booking (could be different for friend bookings)
  isFriendBooking: boolean("is_friend_booking").default(false),
  friendBookingRequestId: uuid("friend_booking_request_id"), // Link to friend_booking_requests table

  // Vagaro Integration
  vagaroAppointmentId: text("vagaro_appointment_id").unique().notNull(),
  vagaroData: text("vagaro_data"), // Full JSON payload

  // Core appointment data (from Vagaro)
  vagaroCustomerId: text("vagaro_customer_id"),
  vagaroServiceProviderId: text("vagaro_service_provider_id"),
  vagaroServiceId: text("vagaro_service_id"),
  vagaroBusinessId: text("vagaro_business_id"),

  // Appointment details
  serviceTitle: text("service_title").notNull(),
  serviceCategory: text("service_category"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  bookingStatus: text("booking_status").notNull(), // Confirmed, Cancelled, etc.
  eventType: text("event_type"), // Service, Class, PersonalOff

  // Booking metadata
  amount: numeric("amount", { precision: 10, scale: 2 }),
  onlineVsInhouse: text("online_vs_inhouse"), // Online, Inhouse
  appointmentTypeCode: text("appointment_type_code"), // NR, NNR, RR, RNR
  appointmentTypeName: text("appointment_type_name"),
  bookingSource: text("booking_source"),
  calendarEventId: text("calendar_event_id"),

  // Form responses
  formResponseIds: text("form_response_ids"), // JSON array

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  vagaroCreatedAt: timestamp("vagaro_created_at"),
  vagaroModifiedAt: timestamp("vagaro_modified_at")
})

export type InsertAppointment = typeof appointments.$inferInsert
export type SelectAppointment = typeof appointments.$inferSelect

/**
 * Comprehensive Vagaro Sync System
 *
 * Syncs ALL data from Vagaro webhooks to local database for complete data mirror
 */

import { getDb } from '@/db'
import { appointments } from '@/db/schema/appointments'
import { vagaroCustomers } from '@/db/schema/vagaro_customers'
import { businessLocations } from '@/db/schema/business_locations'
import { formResponses } from '@/db/schema/form_responses'
import { transactions } from '@/db/schema/transactions'
import { eq } from 'drizzle-orm'

/**
 * Sync appointment from webhook payload
 */
export async function syncAppointment(payload: any) {
  const db = getDb()

  const appointmentId = payload.appointmentId
  if (!appointmentId) {
    console.warn('  ⚠️ No appointmentId in payload')
    return null
  }

  const appointmentData = {
    vagaroAppointmentId: appointmentId,
    vagaroData: JSON.stringify(payload),
    vagaroCustomerId: payload.customerId,
    vagaroServiceProviderId: payload.serviceProviderId,
    vagaroServiceId: payload.serviceId,
    vagaroBusinessId: payload.businessId,
    serviceTitle: payload.serviceTitle,
    serviceCategory: payload.serviceCategory,
    startTime: new Date(payload.startTime),
    endTime: new Date(payload.endTime),
    bookingStatus: payload.bookingStatus,
    eventType: payload.eventType,
    amount: payload.amount?.toString(),
    onlineVsInhouse: payload.onlineVsInhouse,
    appointmentTypeCode: payload.appointmentTypeCode,
    appointmentTypeName: payload.appointmentTypeName,
    bookingSource: payload.bookingSource,
    calendarEventId: payload.calendarEventId,
    formResponseIds: JSON.stringify(payload.formResponseIds || []),
    lastSyncedAt: new Date(),
    vagaroCreatedAt: payload.createdDate ? new Date(payload.createdDate) : null,
    vagaroModifiedAt: payload.modifiedDate ? new Date(payload.modifiedDate) : null
  }

  const [existing] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.vagaroAppointmentId, appointmentId))
    .limit(1)

  if (existing) {
    await db
      .update(appointments)
      .set({ ...appointmentData, updatedAt: new Date() })
      .where(eq(appointments.id, existing.id))
    console.log(`✓ Updated appointment: ${payload.serviceTitle}`)
  } else {
    await db.insert(appointments).values(appointmentData)
    console.log(`✓ Created appointment: ${payload.serviceTitle}`)
  }
}

/**
 * Sync customer from webhook payload
 */
export async function syncCustomer(payload: any) {
  const db = getDb()

  const customerId = payload.customerId
  if (!customerId) {
    console.warn('  ⚠️ No customerId in payload')
    return null
  }

  const customerData = {
    vagaroCustomerId: customerId,
    vagaroBusinessIds: JSON.stringify(payload.businessIds || []),
    vagaroData: JSON.stringify(payload),
    firstName: payload.customerFirstName || '',
    lastName: payload.customerLastName || '',
    email: payload.email,
    mobilePhone: payload.mobilePhone,
    dayPhone: payload.dayPhone,
    nightPhone: payload.nightPhone,
    streetAddress: payload.streetAddress,
    city: payload.city,
    regionCode: payload.regionCode,
    regionName: payload.regionName,
    countryCode: payload.countryCode,
    countryName: payload.countryName,
    postalCode: payload.postalCode,
    businessGroupId: payload.businessGroupId,
    lastSyncedAt: new Date(),
    vagaroCreatedAt: payload.createdDate ? new Date(payload.createdDate) : null,
    vagaroModifiedAt: payload.modifiedDate ? new Date(payload.modifiedDate) : null
  }

  const [existing] = await db
    .select()
    .from(vagaroCustomers)
    .where(eq(vagaroCustomers.vagaroCustomerId, customerId))
    .limit(1)

  if (existing) {
    await db
      .update(vagaroCustomers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(vagaroCustomers.id, existing.id))
    console.log(`✓ Updated customer: ${payload.customerFirstName} ${payload.customerLastName}`)
  } else {
    await db.insert(vagaroCustomers).values(customerData)
    console.log(`✓ Created customer: ${payload.customerFirstName} ${payload.customerLastName}`)
  }
}

/**
 * Sync business location from webhook payload
 */
export async function syncBusinessLocation(payload: any) {
  const db = getDb()

  const businessId = payload.businessId
  if (!businessId) {
    console.warn('  ⚠️ No businessId in payload')
    return null
  }

  const locationData = {
    vagaroBusinessId: businessId,
    vagaroBusinessGroupId: payload.businessGroupId,
    vagaroData: JSON.stringify(payload),
    businessName: payload.businessName,
    businessGroupName: payload.businessGroupName,
    businessAlias: payload.businessAlias,
    businessPhone: payload.businessPhone,
    businessEmail: payload.businessEmail,
    businessWebsite: payload.businessWebsite,
    vagaroListingUrl: payload.vagaroListingUrl,
    streetAddress: payload.streetAddress,
    city: payload.city,
    regionCode: payload.regionCode,
    regionName: payload.regionName,
    countryCode: payload.countryCode,
    countryName: payload.countryName,
    postalCode: payload.postalCode,
    showContactInformation: payload.showContactInformation,
    showVagaroConnect: payload.showVagaroConnect,
    serviceLocation: payload.serviceLocation,
    listedOnVagaro: payload.listedOnVagaro,
    listedOnGoogle: payload.listedOnGoogle,
    listedOnAppleMaps: payload.listedOnAppleMaps,
    useEmployeeHours: payload.useEmployeeHours,
    childrenPolicy: payload.facilityInfo?.childrenPolicy,
    walkInsAccepted: payload.facilityInfo?.walkInsAccepted,
    paymentMethods: JSON.stringify(payload.facilityInfo?.paymentMethods || []),
    parking: JSON.stringify(payload.facilityInfo?.parking || []),
    amenities: JSON.stringify(payload.facilityInfo?.amenities || []),
    onlineGcStore: payload.facilityInfo?.onlineGcStore,
    spokenLanguages: JSON.stringify(payload.facilityInfo?.spokenLanguages || []),
    businessHours: JSON.stringify(payload.businessHours || []),
    lastSyncedAt: new Date(),
    vagaroCreatedAt: payload.createdDate ? new Date(payload.createdDate) : null,
    vagaroModifiedAt: payload.modifiedDate ? new Date(payload.modifiedDate) : null
  }

  const [existing] = await db
    .select()
    .from(businessLocations)
    .where(eq(businessLocations.vagaroBusinessId, businessId))
    .limit(1)

  if (existing) {
    await db
      .update(businessLocations)
      .set({ ...locationData, updatedAt: new Date() })
      .where(eq(businessLocations.id, existing.id))
    console.log(`✓ Updated business location: ${payload.businessName}`)
  } else {
    await db.insert(businessLocations).values(locationData)
    console.log(`✓ Created business location: ${payload.businessName}`)
  }
}

/**
 * Sync form response from webhook payload
 */
export async function syncFormResponse(payload: any) {
  const db = getDb()

  const responseId = payload.responseId
  if (!responseId) {
    console.warn('  ⚠️ No responseId in payload')
    return null
  }

  const responseData = {
    vagaroResponseId: responseId,
    vagaroFormId: payload.formId,
    vagaroCustomerId: payload.customerId,
    vagaroBusinessId: payload.businessId,
    vagaroAppointmentId: payload.appointmentId,
    vagaroMembershipId: payload.membershipId,
    vagaroData: JSON.stringify(payload),
    formTitle: payload.formTitle,
    formPublishedDate: payload.formPublishedDate ? new Date(payload.formPublishedDate) : null,
    businessAlias: payload.businessAlias,
    businessGroupId: payload.businessGroupId,
    questionsAndAnswers: JSON.stringify(payload.questionsAndAnswers || []),
    lastSyncedAt: new Date()
  }

  const [existing] = await db
    .select()
    .from(formResponses)
    .where(eq(formResponses.vagaroResponseId, responseId))
    .limit(1)

  if (existing) {
    await db
      .update(formResponses)
      .set(responseData)
      .where(eq(formResponses.id, existing.id))
    console.log(`✓ Updated form response: ${payload.formTitle}`)
  } else {
    await db.insert(formResponses).values(responseData)
    console.log(`✓ Created form response: ${payload.formTitle}`)
  }
}

/**
 * Sync transaction from webhook payload
 */
export async function syncTransaction(payload: any) {
  const db = getDb()

  const userPaymentId = payload.userPaymentId
  if (!userPaymentId) {
    console.warn('  ⚠️ No userPaymentId in payload')
    return null
  }

  const transactionData = {
    vagaroTransactionId: payload.transactionId,
    vagaroUserPaymentId: userPaymentId,
    vagaroUserPaymentsMstId: payload.userPaymentsMstId,
    vagaroCustomerId: payload.customerId,
    vagaroServiceProviderId: payload.serviceProviderId,
    vagaroBusinessId: payload.businessId,
    vagaroAppointmentId: payload.appointmentId,
    vagaroData: JSON.stringify(payload),
    transactionDate: new Date(payload.transactionDate),
    businessAlias: payload.businessAlias,
    businessGroupId: payload.businessGroupId,
    brandName: payload.brandName,
    itemSold: payload.itemSold,
    purchaseType: payload.purchaseType,
    serviceCategory: payload.serviceCategory,
    quantity: payload.quantity,
    ccAmount: payload.ccAmount?.toString(),
    cashAmount: payload.cashAmount?.toString(),
    checkAmount: payload.checkAmount?.toString(),
    achAmount: payload.achAmount?.toString(),
    bankAccountAmount: payload.bankAccountAmount?.toString(),
    vagaroPayLaterAmount: payload.vagaroPayLaterAmount?.toString(),
    otherAmount: payload.otherAmount?.toString(),
    packageRedemption: payload.packageRedemption?.toString(),
    gcRedemption: payload.gcRedemption?.toString(),
    pointsAmount: payload.pointsAmount,
    tax: payload.tax?.toString(),
    tip: payload.tip?.toString(),
    discount: payload.discount?.toString(),
    membershipAmount: payload.memberShipAmount?.toString(),
    productDiscount: payload.productDiscount?.toString(),
    amountDue: payload.amountDue?.toString(),
    ccType: payload.ccType,
    ccMode: payload.ccMode,
    lastSyncedAt: new Date(),
    vagaroCreatedBy: payload.createdBy
  }

  const [existing] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.vagaroUserPaymentId, userPaymentId))
    .limit(1)

  if (existing) {
    await db
      .update(transactions)
      .set(transactionData)
      .where(eq(transactions.id, existing.id))
    console.log(`✓ Updated transaction: ${payload.itemSold}`)
  } else {
    await db.insert(transactions).values(transactionData)
    console.log(`✓ Created transaction: ${payload.itemSold}`)
  }
}

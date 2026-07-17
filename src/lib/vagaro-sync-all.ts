/**
 * Comprehensive Vagaro Sync System
 *
 * Syncs the minimum Vagaro data needed by LashPop product features.
 *
 * Raw webhook payloads, client addresses, intake-form answers, and payment
 * transactions are intentionally not mirrored into LashPop infrastructure.
 */

import { getDb } from '@/db'
import { businessLocations } from '@/db/schema/business_locations'
import { eq } from 'drizzle-orm'

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

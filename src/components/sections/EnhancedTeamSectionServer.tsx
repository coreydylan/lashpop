import { getTeamMembersWithServices } from "@/actions/team"
import { EnhancedTeamSectionClient } from "./EnhancedTeamSectionClient"

const PLACEHOLDER_IMAGE = "/placeholder-team.svg"

function isPlaceholderOrMissing(url: string | null | undefined): boolean {
  return !url || url.includes("placeholder") || url === ""
}

// Vagaro is source of truth for photos; fall back to local override, then placeholder.
function resolveStaffImage(vagaroPhotoUrl: string | null | undefined, imageUrl: string | null | undefined): string {
  if (vagaroPhotoUrl && !isPlaceholderOrMissing(vagaroPhotoUrl)) return vagaroPhotoUrl
  if (imageUrl && !isPlaceholderOrMissing(imageUrl)) return imageUrl
  return PLACEHOLDER_IMAGE
}

export async function EnhancedTeamSection() {
  const teamMembers = await getTeamMembersWithServices()

  // Transform database format to component format
  const formattedTeamMembers = teamMembers.map((member, index) => ({
    id: index + 1, // Use sequential number IDs instead of UUIDs
    uuid: member.id, // Keep UUID for API calls
    name: member.name,
    role: member.role,
    type: member.type as 'employee' | 'independent',
    businessName: member.businessName || undefined,
    image: resolveStaffImage(member.vagaroPhotoUrl, member.imageUrl),
    phone: member.phone,
    specialties: member.specialties as string[],
    // Service categories pulled directly from Vagaro service assignments
    serviceCategories: member.serviceCategories,
    // Vagaro bio (BusinessSummary) wins; fall back to locally-entered bio
    bio: member.vagaroBio || member.bio || undefined,
    quote: member.quote || undefined,
    availability: member.availability || undefined,
    instagram: member.instagram || undefined,
    bookingUrl: member.bookingUrl,
    usesLashpopBooking: member.usesLashpopBooking,
    favoriteServices: member.favoriteServices as string[] | undefined,
    funFact: member.funFact || undefined,
    // Quick facts from database
    quickFacts: member.quickFacts?.map(fact => ({
      id: fact.id,
      factType: fact.factType,
      customLabel: fact.customLabel,
      value: fact.value,
      customIcon: fact.customIcon,
      displayOrder: fact.displayOrder
    })) || [],
    credentials: (member.credentials as any[] | null) || [],
    // Photo crop URLs for different formats
    cropSquareUrl: member.cropSquareUrl || undefined,
    cropCloseUpCircleUrl: member.cropCloseUpCircleUrl || undefined,
    cropMediumCircleUrl: member.cropMediumCircleUrl || undefined,
    cropFullVerticalUrl: member.cropFullVerticalUrl || undefined,
  }))

  return <EnhancedTeamSectionClient teamMembers={formattedTeamMembers} />
}

import { getTeamMembersWithServices } from "@/actions/team"
import { EnhancedTeamSectionClient } from "./EnhancedTeamSectionClient"

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
    image: member.imageUrl,
    phone: member.phone,
    specialties: member.specialties as string[],
    // Service categories pulled directly from Vagaro service assignments
    serviceCategories: member.serviceCategories,
    bio: member.bio || undefined,
    quote: member.quote || undefined,
    availability: member.availability || undefined,
    instagram: member.instagram || undefined,
    bookingUrl: member.bookingUrl,
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
    // Photo crop URLs for different formats
    cropSquareUrl: member.cropSquareUrl || undefined,
    cropCloseUpCircleUrl: member.cropCloseUpCircleUrl || undefined,
    cropMediumCircleUrl: member.cropMediumCircleUrl || undefined,
    cropFullVerticalUrl: member.cropFullVerticalUrl || undefined,
  }))

  return <EnhancedTeamSectionClient teamMembers={formattedTeamMembers} />
}

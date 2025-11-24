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
    funFact: member.funFact || undefined
  }))

  return <EnhancedTeamSectionClient teamMembers={formattedTeamMembers} />
}

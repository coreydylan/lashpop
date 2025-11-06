import { getTeamMembers } from "@/actions/team"
import { EnhancedTeamSectionClient } from "./EnhancedTeamSectionClient"

export async function EnhancedTeamSection() {
  const teamMembers = await getTeamMembers()

  // Transform database format to component format
  const formattedTeamMembers = teamMembers.map(member => ({
    id: Number(member.id), // Convert UUID to number for display (or use index)
    name: member.name,
    role: member.role,
    type: member.type as 'employee' | 'independent',
    businessName: member.businessName || undefined,
    image: member.imageUrl,
    phone: member.phone,
    specialties: member.specialties as string[],
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

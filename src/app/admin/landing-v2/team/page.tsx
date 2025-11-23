"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Link2 } from "lucide-react"
import Image from "next/image"

interface TeamMember {
  id: string
  name: string
  role: string
  type: "employee" | "independent"
  email: string | null
  phone: string
  businessName: string | null
  bio: string | null
  quote: string | null
  instagram: string | null
  bookingUrl: string
  imageUrl: string
  specialties: string[]
  favoriteServices: string[] | null
  funFact: string | null
  availability: string | null
  displayOrder: string
  isActive: boolean
  vagaroEmployeeId: string | null
  vagaroData: any
}

export default function TeamManager() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/landing-v2/team")
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.teamMembers || [])
      }
    } catch (error) {
      console.error("Error fetching team members:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (memberId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/admin/landing-v2/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState })
      })

      if (response.ok) {
        setTeamMembers(teamMembers.map(m =>
          m.id === memberId ? { ...m, isActive: !currentState } : m
        ))
      }
    } catch (error) {
      console.error("Error toggling visibility:", error)
    }
  }

  const deleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this team member?")) return

    try {
      const response = await fetch(`/api/admin/landing-v2/team/${memberId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setTeamMembers(teamMembers.filter(m => m.id !== memberId))
      }
    } catch (error) {
      console.error("Error deleting team member:", error)
    }
  }

  if (loading) {
    return (
      <div className="glass border border-sage/20 rounded-3xl p-12 shadow-xl flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-dune">Team Management</h2>
          <p className="text-sm text-dune/60 mt-1">Manage team members, bios, and Vagaro integration</p>
        </div>
        <button
          onClick={() => {
            setSelectedMember(null)
            setShowEditor(true)
          }}
          className="flex items-center gap-2 px-6 py-3 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light"
        >
          <Plus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-dune mb-1">{teamMembers.length}</div>
          <div className="text-xs text-dune/60">Total Members</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-ocean-mist mb-1">
            {teamMembers.filter(m => m.isActive).length}
          </div>
          <div className="text-xs text-dune/60">Active</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-terracotta mb-1">
            {teamMembers.filter(m => m.vagaroEmployeeId).length}
          </div>
          <div className="text-xs text-dune/60">Synced with Vagaro</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-golden mb-1">
            {teamMembers.filter(m => m.type === "independent").length}
          </div>
          <div className="text-xs text-dune/60">Independent</div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
        <div className="space-y-3">
          {teamMembers.sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder)).map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                member.isActive
                  ? "bg-cream/50 border-sage/10 hover:border-dusty-rose/20"
                  : "bg-dune/5 border-dune/10 opacity-60"
              }`}
            >
              {/* Order */}
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-dune/10 text-dune/60 text-sm">
                {member.displayOrder}
              </div>

              {/* Profile Image */}
              <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-dune/10 border-2 border-white shadow-sm">
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={member.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dune/40">
                    <span className="text-xl font-light">{member.name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-dune">{member.name}</h3>
                  {member.vagaroEmployeeId && (
                    <div className="px-2 py-0.5 bg-ocean-mist/20 text-ocean-mist rounded-full text-xs font-semibold uppercase tracking-wide border border-ocean-mist/30 flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      <span>Vagaro</span>
                    </div>
                  )}
                  {!member.isActive && (
                    <div className="px-2 py-0.5 bg-dune/20 text-dune/60 rounded-full text-xs font-semibold uppercase tracking-wide border border-dune/30">
                      Hidden
                    </div>
                  )}
                  {member.type === "independent" && (
                    <div className="px-2 py-0.5 bg-golden/20 text-golden rounded-full text-xs font-semibold uppercase tracking-wide border border-golden/30">
                      Independent
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-dune/60">
                  <span>{member.role}</span>
                  {member.phone && (
                    <>
                      <span className="text-dune/30">•</span>
                      <span>{member.phone}</span>
                    </>
                  )}
                  {member.email && (
                    <>
                      <span className="text-dune/30">•</span>
                      <span className="truncate">{member.email}</span>
                    </>
                  )}
                </div>
                {member.specialties && member.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.specialties.slice(0, 3).map((specialty, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-sage/10 text-sage rounded-full text-xs"
                      >
                        {specialty}
                      </span>
                    ))}
                    {member.specialties.length > 3 && (
                      <span className="px-2 py-0.5 bg-dune/10 text-dune/60 rounded-full text-xs">
                        +{member.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleVisibility(member.id, member.isActive)}
                  className={`p-2 rounded-full transition-all ${
                    member.isActive
                      ? "bg-ocean-mist/10 text-ocean-mist hover:bg-ocean-mist/20"
                      : "bg-dune/10 text-dune/40 hover:bg-dune/20"
                  }`}
                  title={member.isActive ? "Hide from website" : "Show on website"}
                >
                  {member.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    setSelectedMember(member)
                    setShowEditor(true)
                  }}
                  className="p-2 rounded-full bg-dusty-rose/10 text-dusty-rose hover:bg-dusty-rose/20 transition-all"
                  title="Edit member"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteMember(member.id)}
                  className="p-2 rounded-full bg-terracotta/10 text-terracotta hover:bg-terracotta/20 transition-all"
                  title="Delete member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {member.vagaroEmployeeId && (
                  <a
                    href={`https://vagaro.com/employee/${member.vagaroEmployeeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-dune/10 text-dune hover:bg-dune/20 transition-all"
                    title="View in Vagaro"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {teamMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dune/60 mb-4">No team members found</p>
            <button
              onClick={() => {
                setSelectedMember(null)
                setShowEditor(true)
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Team Member</span>
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="glass border border-golden/20 rounded-2xl p-4 bg-golden/10">
        <p className="text-sm text-dune/70">
          <strong>Vagaro Integration:</strong> Team members with the Vagaro link icon are synced from your Vagaro account.
          You can enrich their profiles with additional information here, and toggle their visibility on the website independently.
        </p>
      </div>
    </div>
  )
}

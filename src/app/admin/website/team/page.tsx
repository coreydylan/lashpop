"use client"

import { useState, useEffect } from 'react'
import { motion, Reorder } from 'framer-motion'
import Image from 'next/image'
import {
  Users,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Check,
  AlertCircle,
  GripVertical,
  ExternalLink,
  Instagram,
  Phone,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Tag,
  Plus,
  X,
  Lock,
  FileText,
  Sparkles
} from 'lucide-react'
import { QuickFactsEditor } from '@/components/team/QuickFactsEditor'
import { CredentialsEditor } from '@/components/team/CredentialsEditor'
import type { TeamMemberCredential } from '@/db/schema/team_members'

interface QuickFact {
  id: string
  factType: string
  customLabel: string | null
  value: string
  customIcon: string | null
  displayOrder: number
}

interface TeamMember {
  id: string
  name: string
  role: string
  type: 'employee' | 'independent'
  businessName: string | null
  imageUrl: string
  phone: string
  email: string | null
  bio: string | null
  quote: string | null
  instagram: string | null
  bookingUrl: string
  specialties: string[]
  isActive: boolean
  displayOrder: string
  vagaroEmployeeId: string | null
  lastSyncedAt: string | null
  vagaroServiceCategories: string[]
  manualServiceCategories: string[]
  quickFacts?: QuickFact[]
  credentials?: TeamMemberCredential[]
}

// Common service category options for manual tags
const CATEGORY_OPTIONS = [
  'Lashes',
  'Brows',
  'Waxing',
  'Facials',
  'Skin Care',
  'Permanent Makeup',
  'Permanent Jewelry',
  'Injectables',
  'Wellness',
  'Plasma',
  'Tinting',
  'Lash Lifts',
]

export default function TeamManagerPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [editingBio, setEditingBio] = useState<string | null>(null)
  const [bioValue, setBioValue] = useState('')

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    setLoading(true)
    try {
      // Fetch team members and quick facts in parallel
      const [membersRes, factsRes] = await Promise.all([
        fetch('/api/admin/website/team'),
        fetch('/api/admin/website/team/quick-facts')
      ])

      if (membersRes.ok) {
        const data = await membersRes.json()
        let members = data.members || []

        // Merge quick facts if available
        if (factsRes.ok) {
          const factsData = await factsRes.json()
          const factsByMember = factsData.factsByMember || {}
          members = members.map((member: TeamMember) => ({
            ...member,
            quickFacts: factsByMember[member.id] || []
          }))
        }

        setTeamMembers(members)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBio = async (memberId: string, newBio: string) => {
    try {
      const response = await fetch('/api/admin/website/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, bio: newBio })
      })

      if (response.ok) {
        setTeamMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, bio: newBio } : m
        ))
        setEditingBio(null)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error updating bio:', error)
    }
  }

  const toggleVisibility = (memberId: string) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, isActive: !member.isActive }
        : member
    ))
    setHasChanges(true)
  }

  const handleReorder = (newOrder: TeamMember[]) => {
    setTeamMembers(newOrder)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = teamMembers.map((member, index) => ({
        id: member.id,
        isActive: member.isActive,
        displayOrder: index.toString()
      }))

      const response = await fetch('/api/admin/website/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      if (response.ok) {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const data = await response.json()
        alert(`Failed to save: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving team settings:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const updateManualCategories = async (memberId: string, categories: string[]) => {
    try {
      const response = await fetch('/api/admin/website/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, manualServiceCategories: categories })
      })

      if (response.ok) {
        // Update local state
        setTeamMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, manualServiceCategories: categories } : m
        ))
      } else {
        const data = await response.json()
        alert(`Failed to update: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating manual categories:', error)
      alert('Failed to update categories')
    }
  }

  const addManualCategory = (memberId: string, category: string) => {
    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return

    const currentCategories = member.manualServiceCategories || []
    if (!currentCategories.includes(category)) {
      updateManualCategories(memberId, [...currentCategories, category])
    }
  }

  const removeManualCategory = (memberId: string, category: string) => {
    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return

    const currentCategories = member.manualServiceCategories || []
    updateManualCategories(memberId, currentCategories.filter(c => c !== category))
  }

  const activeCount = teamMembers.filter(m => m.isActive).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ocean-mist/30 to-ocean-mist/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-ocean-mist" />
            </div>
            <div>
              <h1 className="h2 text-dune">Team Members</h1>
              <p className="text-sm text-dune/60">
                {activeCount} of {teamMembers.length} visible on website
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchTeamMembers}
              className="btn btn-secondary"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'} ${!hasChanges && !saved ? 'opacity-50' : ''}`}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : hasChanges ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        <div className="glass rounded-2xl p-4 border border-sage/20 text-center">
          <div className="text-2xl font-serif text-dune">{teamMembers.length}</div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Total</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-ocean-mist/30 text-center">
          <div className="text-2xl font-serif text-ocean-mist">{activeCount}</div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Visible</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-sage/20 text-center">
          <div className="text-2xl font-serif text-dune">
            {teamMembers.filter(m => m.vagaroEmployeeId).length}
          </div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Vagaro Linked</div>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 p-4 bg-ocean-mist/10 rounded-2xl border border-ocean-mist/20"
      >
        <p className="text-sm text-dune/70">
          <strong>Drag to reorder</strong> team members. Toggle the eye icon to show/hide on the website. 
          Changes are saved when you click &quot;Save Changes&quot;.
        </p>
      </motion.div>

      {/* Team Members List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-3xl border border-sage/20 overflow-hidden"
      >
        {teamMembers.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-dune/30 mx-auto mb-4" />
            <p className="text-dune/60">No team members found</p>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={teamMembers} 
            onReorder={handleReorder}
            className="divide-y divide-sage/10"
          >
            {teamMembers.map((member, index) => (
              <Reorder.Item
                key={member.id}
                value={member}
                className="bg-cream/50 hover:bg-cream/80 transition-colors"
              >
                <div className="p-4">
                  {/* Main Row */}
                  <div className="flex items-center gap-4">
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing text-dune/30 hover:text-dune/50 touch-none">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Order Number */}
                    <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sm text-dune/60 font-medium">
                      {index + 1}
                    </div>

                    {/* Photo */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-warm-sand">
                      {member.imageUrl && member.imageUrl.length > 0 ? (
                        <Image
                          src={member.imageUrl}
                          alt={member.name}
                          fill
                          className={`object-cover transition-all ${!member.isActive ? 'grayscale opacity-50' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-dune/30">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium truncate ${member.isActive ? 'text-dune' : 'text-dune/50'}`}>
                          {member.name}
                        </h3>
                        {member.vagaroEmployeeId && (
                          <span className="px-2 py-0.5 bg-dusty-rose/20 text-dusty-rose text-xs rounded-full">
                            Vagaro
                          </span>
                        )}
                        {member.type === 'independent' && (
                          <span className="px-2 py-0.5 bg-golden/20 text-golden text-xs rounded-full">
                            Independent
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${member.isActive ? 'text-dune/60' : 'text-dune/40'}`}>
                        {member.role}
                        {member.businessName && ` • ${member.businessName}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Visibility Toggle */}
                      <button
                        onClick={() => toggleVisibility(member.id)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          member.isActive
                            ? 'bg-ocean-mist/20 text-ocean-mist hover:bg-ocean-mist/30'
                            : 'bg-sage/10 text-dune/40 hover:bg-sage/20'
                        }`}
                        title={member.isActive ? 'Hide from website' : 'Show on website'}
                      >
                        {member.isActive ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                        className="w-10 h-10 rounded-xl bg-sage/10 hover:bg-sage/20 flex items-center justify-center text-dune/50 transition-colors"
                      >
                        {expandedMember === member.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedMember === member.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-sage/10"
                    >
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        {/* Contact Info */}
                        <div className="space-y-2">
                          <h4 className="text-xs uppercase tracking-wider text-dune/40 font-medium">Contact</h4>
                          <div className="flex items-center gap-2 text-dune/70">
                            <Phone className="w-4 h-4 text-dune/40" />
                            {member.phone}
                          </div>
                          {member.email && (
                            <div className="flex items-center gap-2 text-dune/70">
                              <span className="w-4 text-center text-dune/40">@</span>
                              {member.email}
                            </div>
                          )}
                          {member.instagram && (
                            <a 
                              href={`https://instagram.com/${member.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-dusty-rose hover:underline"
                            >
                              <Instagram className="w-4 h-4" />
                              @{member.instagram}
                            </a>
                          )}
                        </div>

                        {/* Links */}
                        <div className="space-y-2">
                          <h4 className="text-xs uppercase tracking-wider text-dune/40 font-medium">Links</h4>
                          <a
                            href={member.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-ocean-mist hover:underline"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Booking Page
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {member.vagaroEmployeeId && (
                            <div className="flex items-center gap-2 text-dune/60">
                              <Briefcase className="w-4 h-4 text-dune/40" />
                              Vagaro ID: {member.vagaroEmployeeId}
                            </div>
                          )}
                        </div>

                        {/* Service Tags - Shows on profile card */}
                        <div className="sm:col-span-2 space-y-3 p-4 bg-sage/5 rounded-2xl border border-sage/10">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-dusty-rose" />
                            <h4 className="text-xs uppercase tracking-wider text-dune/60 font-medium">Service Tags</h4>
                            <span className="text-xs text-dune/40">(shown on profile card)</span>
                          </div>

                          {/* Vagaro Tags (read-only) */}
                          {member.vagaroServiceCategories && member.vagaroServiceCategories.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-xs text-dune/50 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                From Vagaro (auto-synced)
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {member.vagaroServiceCategories.map((cat, i) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1.5 bg-dusty-rose/20 text-dusty-rose rounded-full text-xs font-medium flex items-center gap-1"
                                  >
                                    {cat}
                                    <Lock className="w-3 h-3 opacity-50" />
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Manual Tags (editable) */}
                          <div className="space-y-1.5">
                            <p className="text-xs text-dune/50">Custom tags (editable)</p>
                            <div className="flex flex-wrap gap-2">
                              {(member.manualServiceCategories || []).map((cat, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 bg-ocean-mist/20 text-ocean-mist rounded-full text-xs font-medium flex items-center gap-1 group"
                                >
                                  {cat}
                                  <button
                                    onClick={() => removeManualCategory(member.id, cat)}
                                    className="w-4 h-4 rounded-full hover:bg-ocean-mist/30 flex items-center justify-center opacity-60 hover:opacity-100"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}

                              {/* Add Tag Dropdown */}
                              <div className="relative group/dropdown">
                                <button className="px-3 py-1.5 bg-sage/10 hover:bg-sage/20 text-dune/60 rounded-full text-xs font-medium flex items-center gap-1 transition-colors">
                                  <Plus className="w-3 h-3" />
                                  Add Tag
                                </button>
                                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-sage/20 py-2 z-50 hidden group-hover/dropdown:block">
                                  {CATEGORY_OPTIONS
                                    .filter(cat =>
                                      !(member.vagaroServiceCategories || []).includes(cat) &&
                                      !(member.manualServiceCategories || []).includes(cat)
                                    )
                                    .map((cat) => (
                                      <button
                                        key={cat}
                                        onClick={() => addManualCategory(member.id, cat)}
                                        className="w-full px-4 py-2 text-left text-sm text-dune/70 hover:bg-sage/10 hover:text-dune transition-colors"
                                      >
                                        {cat}
                                      </button>
                                    ))
                                  }
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Preview of combined tags */}
                          {((member.vagaroServiceCategories?.length || 0) + (member.manualServiceCategories?.length || 0)) > 0 && (
                            <div className="pt-2 border-t border-sage/10">
                              <p className="text-xs text-dune/40 mb-1.5">Preview (max 4 shown on card):</p>
                              <div className="flex flex-wrap gap-1.5">
                                {[...(member.vagaroServiceCategories || []), ...(member.manualServiceCategories || [])]
                                  .slice(0, 4)
                                  .map((cat, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-dune/10 text-dune/70 rounded-full text-[10px] font-medium"
                                    >
                                      {cat}
                                    </span>
                                  ))
                                }
                                {([...(member.vagaroServiceCategories || []), ...(member.manualServiceCategories || [])].length > 4) && (
                                  <span className="text-[10px] text-dune/40">
                                    +{[...(member.vagaroServiceCategories || []), ...(member.manualServiceCategories || [])].length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Quick Facts Editor */}
                        <div className="sm:col-span-2 p-4 bg-dusty-rose/5 rounded-2xl border border-dusty-rose/10">
                          <QuickFactsEditor
                            memberId={member.id}
                            memberName={member.name}
                            initialFacts={member.quickFacts || []}
                            onFactsChange={(facts) => {
                              setTeamMembers(prev => prev.map(m =>
                                m.id === member.id ? { ...m, quickFacts: facts } : m
                              ))
                            }}
                          />
                        </div>

                        {/* Credentials Editor - For SEO/Schema.org */}
                        <div className="sm:col-span-2 p-4 bg-ocean-mist/5 rounded-2xl border border-ocean-mist/10">
                          <CredentialsEditor
                            memberId={member.id}
                            memberName={member.name}
                            initialCredentials={member.credentials || []}
                            onCredentialsChange={(credentials) => {
                              setTeamMembers(prev => prev.map(m =>
                                m.id === member.id ? { ...m, credentials: credentials } : m
                              ))
                            }}
                          />
                        </div>

                        {/* Bio Editor */}
                        <div className="sm:col-span-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs uppercase tracking-wider text-dune/40 font-medium flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5" />
                              Bio
                            </h4>
                            {editingBio !== member.id && (
                              <button
                                onClick={() => {
                                  setEditingBio(member.id)
                                  setBioValue(member.bio || '')
                                }}
                                className="text-xs text-ocean-mist hover:underline"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          {editingBio === member.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={bioValue}
                                onChange={(e) => setBioValue(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-sage/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40 min-h-[120px] resize-y"
                                placeholder="Enter bio..."
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setEditingBio(null)}
                                  className="px-3 py-1.5 text-xs text-dune/60 hover:text-dune"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => updateBio(member.id, bioValue)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ocean-mist text-white rounded-lg hover:bg-ocean-mist/90"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Save Bio
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-dune/70 leading-relaxed text-sm">
                              {member.bio || <span className="text-dune/40 italic">No bio yet</span>}
                            </p>
                          )}
                        </div>

                        {/* Specialties */}
                        {member.specialties && member.specialties.length > 0 && (
                          <div className="sm:col-span-2 space-y-2">
                            <h4 className="text-xs uppercase tracking-wider text-dune/40 font-medium">Specialties</h4>
                            <div className="flex flex-wrap gap-2">
                              {member.specialties.map((specialty, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 bg-warm-sand/50 text-dune/70 rounded-full text-xs"
                                >
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Last Synced */}
                        {member.lastSyncedAt && (
                          <div className="sm:col-span-2 text-xs text-dune/40">
                            Last synced from Vagaro: {new Date(member.lastSyncedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </motion.div>
    </div>
  )
}


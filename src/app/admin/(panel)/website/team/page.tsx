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
  Sparkles,
  Trash2,
  ImagePlus,
  Images
} from 'lucide-react'
import { QuickFactsEditor } from '@/components/team/QuickFactsEditor'
import { CredentialsEditor } from '@/components/team/CredentialsEditor'
import { MiniDamExplorer, type Asset } from '@/components/admin/MiniDamExplorer'
import { VagaroFirstWorkflow } from '@/components/admin/VagaroFirstWorkflow'
import type { TeamMemberCredential } from '@/db/schema/team_members'
import { buildTeamPresentationUpdates, MAX_PUBLICATION_REASON_LENGTH } from '@/lib/admin/team-presentation'

interface QuickFact {
  id: string
  factType: string
  customLabel: string | null
  value: string
  customIcon: string | null
  displayOrder: number
}

interface AlbumPhoto {
  id: string
  fileName: string
  filePath: string
  isPrimary: boolean
  source?: 'album' | 'dam'
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
  usesLashpopBooking: boolean
  isActive: boolean
  showOnWebsite: boolean
  displayOrder: string
  vagaroEmployeeId: string | null
  vagaroPublicProviderId: number | null
  lastSyncedAt: string | null
  // Dual-mode tag sources. Only one of these is ever non-empty for a given
  // member — see /api/admin/website/team for the routing rule. The admin
  // surface still reads both so the locked Vagaro chips can render with a
  // "synced" label on Vagaro-mode rows.
  vagaroServiceCategories: string[]
  externalServiceCategories: string[]
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
  'Fine Line Tattoos',
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
  const [publicationReason, setPublicationReason] = useState('')
  const [editingBio, setEditingBio] = useState<string | null>(null)
  const [bioValue, setBioValue] = useState('')
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [editingImageMemberId, setEditingImageMemberId] = useState<string | null>(null)
  const [showAlbumPicker, setShowAlbumPicker] = useState(false)
  const [albumPickerMemberId, setAlbumPickerMemberId] = useState<string | null>(null)
  const [albumPhotos, setAlbumPhotos] = useState<Record<string, AlbumPhoto[]>>({})
  const [loadingAlbum, setLoadingAlbum] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

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

  const updateProfileImage = async (memberId: string, imageUrl: string) => {
    try {
      const response = await fetch('/api/admin/website/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, imageUrl })
      })

      if (response.ok) {
        setTeamMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, imageUrl } : m
        ))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error updating profile image:', error)
    }
  }

  const handleImageSelect = (asset: Asset) => {
    if (editingImageMemberId) {
      updateProfileImage(editingImageMemberId, asset.filePath)
    }
    setShowImagePicker(false)
    setEditingImageMemberId(null)
  }

  const openImagePicker = (memberId: string) => {
    setEditingImageMemberId(memberId)
    setShowImagePicker(true)
  }

  // Album photo functions
  const fetchAlbumPhotos = async (memberId: string) => {
    setLoadingAlbum(memberId)
    try {
      const response = await fetch(`/api/dam/team/${memberId}/photos`)
      if (response.ok) {
        const data = await response.json()
        setAlbumPhotos(prev => ({ ...prev, [memberId]: data.photos || [] }))
      }
    } catch (error) {
      console.error('Error fetching album photos:', error)
    } finally {
      setLoadingAlbum(null)
    }
  }

  const addPhotosToAlbum = async (memberId: string, assetIds: string[]) => {
    try {
      const response = await fetch(`/api/dam/team/${memberId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds })
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh album photos
        await fetchAlbumPhotos(memberId)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        return data
      }
    } catch (error) {
      console.error('Error adding photos to album:', error)
    }
  }

  const removePhotoFromAlbum = async (memberId: string, photoId: string) => {
    const photo = (albumPhotos[memberId] || []).find(p => p.id === photoId)
    const isDamTagged = photo?.source === 'dam'

    try {
      const response = isDamTagged
        ? await fetch('/api/dam/assets/remove-team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetIds: [photoId] })
          })
        : await fetch(`/api/dam/team/photos/${photoId}`, {
            method: 'DELETE'
          })

      if (response.ok) {
        setAlbumPhotos(prev => ({
          ...prev,
          [memberId]: (prev[memberId] || []).filter(p => p.id !== photoId)
        }))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error removing photo from album:', error)
    }
  }

  const handleAlbumSelect = async (selectedAssets: Asset[]) => {
    if (albumPickerMemberId && selectedAssets.length > 0) {
      await addPhotosToAlbum(albumPickerMemberId, selectedAssets.map(a => a.id))
    }
    setShowAlbumPicker(false)
    setAlbumPickerMemberId(null)
  }

  const openAlbumPicker = (memberId: string) => {
    // Fetch existing photos if not already loaded
    if (!albumPhotos[memberId]) {
      fetchAlbumPhotos(memberId)
    }
    setAlbumPickerMemberId(memberId)
    setShowAlbumPicker(true)
  }

  const toggleVisibility = (memberId: string) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, showOnWebsite: !member.showOnWebsite }
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
      const updates = buildTeamPresentationUpdates(teamMembers)

      const response = await fetch('/api/admin/website/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, reason: publicationReason })
      })

      if (response.ok) {
        setSaved(true)
        setHasChanges(false)
        setPublicationReason('')
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

  // Trigger an on-demand Vagaro sync (photos, bios, services). Use after
  // updating a stylist in Vagaro so the change appears immediately instead of
  // waiting for the scheduled cron.
  const handleSyncFromVagaro = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const response = await fetch('/api/admin/website/team/sync', { method: 'POST' })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setSyncMessage('Synced from Vagaro')
        await fetchTeamMembers()
      } else {
        setSyncMessage(`Sync failed: ${data.error || response.statusText}`)
      }
    } catch (error) {
      console.error('Error syncing from Vagaro:', error)
      setSyncMessage('Sync failed — could not reach the sync worker')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  const updateExternalCategories = async (memberId: string, categories: string[]) => {
    try {
      const response = await fetch('/api/admin/website/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, externalServiceCategories: categories })
      })

      if (response.ok) {
        // Update local state
        setTeamMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, externalServiceCategories: categories } : m
        ))
      } else {
        const data = await response.json()
        alert(`Failed to update: ${data.error}`)
      }
    } catch (error) {
      console.error('Error updating external categories:', error)
      alert('Failed to update categories')
    }
  }

  const addExternalCategory = (memberId: string, category: string) => {
    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return

    const currentCategories = member.externalServiceCategories || []
    if (!currentCategories.includes(category)) {
      updateExternalCategories(memberId, [...currentCategories, category])
    }
  }

  const removeExternalCategory = (memberId: string, category: string) => {
    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return

    const currentCategories = member.externalServiceCategories || []
    updateExternalCategories(memberId, currentCategories.filter(c => c !== category))
  }

  const visibleCount = teamMembers.filter(m => m.isActive && m.showOnWebsite).length
  const sourceActiveCount = teamMembers.filter(m => m.isActive).length

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
        <div className="grid gap-4 sm:flex sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-mist/30 to-ocean-mist/10 sm:flex">
              <Users className="w-6 h-6 text-ocean-mist" />
            </div>
            <div className="min-w-0">
              <h1 className="h2 text-dune">Team Members</h1>
              <p className="text-sm text-dune/60">
                {visibleCount} of {sourceActiveCount} active profiles visible on website
              </p>
            </div>
          </div>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:max-w-xl sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            {syncMessage && (
              <span className={`col-span-2 text-sm sm:w-full sm:text-right ${syncMessage.startsWith('Sync failed') ? 'text-red-600' : 'text-ocean-mist'}`}>
                {syncMessage}
              </span>
            )}
            <button
              onClick={handleSyncFromVagaro}
              className="btn btn-secondary min-w-0 w-full sm:w-auto"
              disabled={syncing}
              title="Pull the latest photos, bios, and services from Vagaro now"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : <><span className="sm:hidden">Sync</span><span className="hidden sm:inline">Sync from Vagaro</span></>}
            </button>
            <button
              onClick={fetchTeamMembers}
              className="btn btn-secondary min-w-0 w-full sm:w-auto"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <input
              type="text"
              value={publicationReason}
              onChange={(event) => setPublicationReason(event.target.value)}
              maxLength={MAX_PUBLICATION_REASON_LENGTH}
              placeholder="Why (optional, saved with the change)"
              className="col-span-2 min-w-0 w-full rounded-lg border border-sage/20 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40 sm:w-64"
              aria-label="Reason for this publication change"
            />
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`btn min-w-0 w-full sm:w-auto ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'} ${!hasChanges && !saved ? 'opacity-50' : ''}`}
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

      <VagaroFirstWorkflow kind="team-member" onSyncComplete={fetchTeamMembers} />

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 grid grid-cols-3 divide-x divide-sage/15 border-y border-sage/20 bg-white"
      >
        <div className="min-w-0 px-2 py-3 text-center sm:p-4">
          <div className="text-2xl font-serif text-dune">{teamMembers.length}</div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Total</div>
        </div>
        <div className="min-w-0 px-2 py-3 text-center sm:p-4">
          <div className="text-2xl font-serif text-ocean-mist">{visibleCount}</div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Visible</div>
        </div>
        <div className="min-w-0 px-2 py-3 text-center sm:p-4">
          <div className="text-2xl font-serif text-dune">
            {teamMembers.filter(m => m.vagaroEmployeeId).length}
          </div>
          <div className="text-[10px] text-dune/50 uppercase tracking-wide sm:text-xs sm:tracking-wider">Vagaro Linked</div>
        </div>
      </motion.div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 rounded-lg border border-ocean-mist/20 bg-ocean-mist/10 p-4"
      >
        <p className="text-sm text-dune/70">
          <strong>Drag to reorder</strong> team members. The eye controls website publication only;
          Vagaro sync controls whether a provider is active. New Vagaro providers stay hidden until reviewed.
          Changes are saved when you click &quot;Save Changes&quot;.
        </p>
      </motion.div>

      {/* Team Members List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass overflow-hidden rounded-lg border border-sage/20 sm:rounded-2xl"
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
                  <div className="grid grid-cols-[auto_auto_auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:gap-4">
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing text-dune/30 hover:text-dune/50 touch-none">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Order Number */}
                    <div className="flex w-5 items-center justify-center font-mono text-xs text-dune/55 sm:size-8 sm:rounded-full sm:bg-sage/20 sm:text-sm sm:font-sans sm:font-medium">
                      {index + 1}
                    </div>

                    {/* Photo */}
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-warm-sand sm:size-14 sm:rounded-xl">
                      {member.imageUrl && member.imageUrl.length > 0 ? (
                        <Image
                          src={member.imageUrl}
                          alt={member.name}
                          fill
                          className={`object-cover transition-all ${!member.isActive || !member.showOnWebsite ? 'grayscale opacity-50' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-dune/30">
                          <Users className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className={`min-w-0 flex-1 truncate font-medium ${member.isActive && member.showOnWebsite ? 'text-dune' : 'text-dune/50'}`}>
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
                        {!member.isActive && (
                          <span className="px-2 py-0.5 bg-sage/10 text-dune/50 text-xs rounded-full">
                            Not active in Vagaro
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate ${member.isActive && member.showOnWebsite ? 'text-dune/60' : 'text-dune/40'}`}>
                        {member.role}
                        {member.businessName && ` • ${member.businessName}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-4 grid grid-cols-2 gap-2 sm:ml-auto sm:flex sm:items-center">
                      {/* Visibility Toggle */}
                      <button
                        onClick={() => toggleVisibility(member.id)}
                        className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-all sm:size-10 sm:px-0 ${
                          member.showOnWebsite
                            ? 'bg-ocean-mist/20 text-ocean-mist hover:bg-ocean-mist/30'
                            : 'bg-sage/10 text-dune/40 hover:bg-sage/20'
                        }`}
                        title={member.showOnWebsite ? 'Hide from website' : 'Show on website'}
                        aria-label={`${member.showOnWebsite ? 'Hide' : 'Show'} ${member.name} on the website`}
                      >
                        {member.showOnWebsite ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                        <span className="sm:sr-only">{member.showOnWebsite ? 'Visible' : 'Hidden'}</span>
                      </button>

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-sage/10 px-3 text-sm font-semibold text-dune/50 transition-colors hover:bg-sage/20 sm:size-10 sm:px-0"
                        aria-label={`${expandedMember === member.id ? 'Collapse' : 'Open'} details for ${member.name}`}
                      >
                        {expandedMember === member.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                        <span className="sm:sr-only">Details</span>
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
                        {/* Dual-mode banner — explains why fields lock/unlock */}
                        <div className={`flex items-center gap-2 rounded-lg border p-3 text-xs sm:col-span-2 ${
                          member.usesLashpopBooking
                            ? 'bg-dusty-rose/10 border-dusty-rose/20 text-dusty-rose'
                            : 'bg-golden/10 border-golden/30 text-dune'
                        }`}>
                          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                          {member.usesLashpopBooking ? (
                            <span>
                              <strong>Vagaro-synced stylist.</strong> Photo, bio, and service tags
                              are pulled from Vagaro on every sync — edit them in Vagaro, not here.
                              {member.lastSyncedAt && (
                                <> Last sync: {new Date(member.lastSyncedAt).toLocaleString()}.</>
                              )}
                            </span>
                          ) : (
                            <span>
                              <strong>External-booking stylist.</strong> Vagaro sync is disabled
                              for this row — all fields (photo, bio, categories) are admin-entered.
                            </span>
                          )}
                        </div>

                        {/* Profile Image */}
                        <div className="rounded-lg border border-golden/10 bg-golden/5 p-3 sm:col-span-2 sm:p-4">
                          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h4 className="text-xs uppercase tracking-wider text-dune/60 font-medium flex items-center gap-2">
                              <Users className="w-3.5 h-3.5" />
                              Profile Image
                              {member.usesLashpopBooking && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-dusty-rose normal-case tracking-normal font-normal">
                                  <Lock className="w-2.5 h-2.5" /> synced from Vagaro
                                </span>
                              )}
                            </h4>
                            <button
                              onClick={() => openImagePicker(member.id)}
                              disabled={member.usesLashpopBooking}
                              className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:w-auto ${
                                member.usesLashpopBooking
                                  ? 'bg-sage/10 text-dune/30 cursor-not-allowed'
                                  : 'bg-golden/20 text-golden hover:bg-golden/30'
                              }`}
                              title={member.usesLashpopBooking ? 'Edit the photo in Vagaro — this row is sync-owned.' : undefined}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Select from DAM
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-warm-sand border border-sage/20">
                              {member.imageUrl && member.imageUrl.length > 0 ? (
                                <Image
                                  src={member.imageUrl}
                                  alt={member.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-dune/30">
                                  <Users className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-dune/70 truncate">
                                {member.imageUrl ? (
                                  <>Current: <span className="text-dune">{member.imageUrl.split('/').pop()}</span></>
                                ) : (
                                  <span className="text-dune/40 italic">No image set</span>
                                )}
                              </p>
                              <p className="text-xs text-dune/50 mt-1">
                                Click &quot;Select from DAM&quot; to choose a profile photo from your media library
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Portfolio Album */}
                        <div className="rounded-lg border border-dusty-rose/10 bg-dusty-rose/5 p-3 sm:col-span-2 sm:p-4">
                          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h4 className="text-xs uppercase tracking-wider text-dune/60 font-medium flex items-center gap-2">
                              <Images className="w-3.5 h-3.5" />
                              Portfolio Album
                              {albumPhotos[member.id] && (
                                <span className="text-dune/40">({albumPhotos[member.id].length} photos)</span>
                              )}
                            </h4>
                            <button
                              onClick={() => openAlbumPicker(member.id)}
                              className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-md bg-dusty-rose/20 px-3 py-1.5 text-xs font-medium text-dusty-rose transition-colors hover:bg-dusty-rose/30 sm:w-auto"
                            >
                              <ImagePlus className="w-3.5 h-3.5" />
                              Add Photos
                            </button>
                          </div>

                          {/* Album Photos Grid */}
                          {loadingAlbum === member.id ? (
                            <div className="flex items-center justify-center py-8">
                              <RefreshCw className="w-5 h-5 animate-spin text-dune/40" />
                            </div>
                          ) : albumPhotos[member.id] && albumPhotos[member.id].length > 0 ? (
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                              {albumPhotos[member.id].map((photo) => (
                                <div key={photo.id} className="relative group aspect-square">
                                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-warm-sand border border-sage/20">
                                    <Image
                                      src={photo.filePath}
                                      alt={photo.fileName}
                                      fill
                                      className="object-cover"
                                    />
                                    {photo.isPrimary && (
                                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-dusty-rose rounded text-[8px] text-white font-medium">
                                        Primary
                                      </div>
                                    )}
                                  </div>
                                  {!photo.isPrimary && (
                                    <button
                                      onClick={() => removePhotoFromAlbum(member.id, photo.id)}
                                      className="absolute -right-1 -top-1 flex size-11 items-center justify-center rounded-md bg-terracotta text-white opacity-100 shadow-sm transition-opacity sm:size-8 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                                      title="Remove from album"
                                      aria-label={`Remove ${photo.fileName} from ${member.name}'s portfolio`}
                                    >
                                      <X className="w-3 h-3 text-white" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-dune/50">
                              <Images className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              <p className="text-xs">No portfolio photos yet</p>
                              <button
                                onClick={() => openAlbumPicker(member.id)}
                                className="mt-2 text-xs text-dusty-rose hover:underline"
                              >
                                Add photos to showcase their work
                              </button>
                            </div>
                          )}

                          {/* Load photos button if not loaded */}
                          {!albumPhotos[member.id] && loadingAlbum !== member.id && (
                            <button
                              onClick={() => fetchAlbumPhotos(member.id)}
                              className="w-full py-3 text-xs text-dune/60 hover:text-dune hover:bg-sage/10 rounded-lg transition-colors"
                            >
                              Load album photos
                            </button>
                          )}
                        </div>

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
                        <div className="space-y-3 rounded-lg border border-sage/10 bg-sage/5 p-3 sm:col-span-2 sm:p-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-dusty-rose" />
                            <h4 className="text-xs uppercase tracking-wider text-dune/60 font-medium">Service Tags</h4>
                            <span className="text-xs text-dune/40">(shown on profile card)</span>
                          </div>

                          {member.usesLashpopBooking ? (
                            // Vagaro-mode: tags are derived from Vagaro service assignments. Read-only.
                            <div className="space-y-1.5">
                              <p className="text-xs text-dune/50 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Synced from Vagaro (edit in Vagaro to change)
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {member.vagaroServiceCategories && member.vagaroServiceCategories.length > 0 ? (
                                  member.vagaroServiceCategories.map((cat, i) => (
                                    <span
                                      key={i}
                                      className="px-3 py-1.5 bg-dusty-rose/20 text-dusty-rose rounded-full text-xs font-medium flex items-center gap-1"
                                    >
                                      {cat}
                                      <Lock className="w-3 h-3 opacity-50" />
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs italic text-dune/40">
                                    No tags yet — assign this stylist to services in Vagaro and re-sync.
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            // External-mode: admin owns the category list.
                            <div className="space-y-1.5">
                              <p className="text-xs text-dune/50">Categories (editable — admin-owned)</p>
                              <div className="flex flex-wrap gap-2">
                                {(member.externalServiceCategories || []).map((cat, i) => (
                                  <span
                                    key={i}
                                    className="group flex items-center gap-1 rounded-lg bg-ocean-mist/20 px-3 py-1.5 text-xs font-medium text-ocean-mist"
                                  >
                                    {cat}
                                    <button
                                      onClick={() => removeExternalCategory(member.id, cat)}
                                      className="flex size-11 items-center justify-center rounded-md opacity-100 hover:bg-ocean-mist/30 sm:size-6 sm:opacity-60 sm:hover:opacity-100"
                                      aria-label={`Remove ${cat} from ${member.name}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}

                                {/* Add Tag Dropdown */}
                                <div className="relative group/dropdown">
                                  <button className="flex min-h-11 items-center gap-1 rounded-lg bg-sage/10 px-3 py-1.5 text-xs font-medium text-dune/60 transition-colors hover:bg-sage/20" aria-haspopup="menu">
                                    <Plus className="w-3 h-3" />
                                    Add Tag
                                  </button>
                                  <div className="absolute left-0 top-full z-50 mt-1 hidden w-48 rounded-lg border border-sage/20 bg-white py-2 shadow-lg group-focus-within/dropdown:block group-hover/dropdown:block">
                                    {CATEGORY_OPTIONS
                                      .filter(cat => !(member.externalServiceCategories || []).includes(cat))
                                      .map((cat) => (
                                        <button
                                          key={cat}
                                          onClick={() => addExternalCategory(member.id, cat)}
                                          className="w-full px-4 py-2 text-left text-sm text-dune/70 hover:bg-sage/10 hover:text-dune transition-colors"
                                        >
                                          {cat}
                                        </button>
                                      ))
                                    }
                                  </div>
                                </div>
                              </div>
                              {(member.externalServiceCategories || []).length === 0 && (
                                <p className="text-xs italic text-dune/40">
                                  No categories set — chips won&apos;t render on this stylist&apos;s card.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quick Facts Editor */}
                        <div className="rounded-lg border border-dusty-rose/10 bg-dusty-rose/5 p-3 sm:col-span-2 sm:p-4">
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
                        <div className="rounded-lg border border-ocean-mist/10 bg-ocean-mist/5 p-3 sm:col-span-2 sm:p-4">
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
                              {member.usesLashpopBooking && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-dusty-rose normal-case tracking-normal font-normal">
                                  <Lock className="w-2.5 h-2.5" /> synced from Vagaro
                                </span>
                              )}
                            </h4>
                            {editingBio !== member.id && !member.usesLashpopBooking && (
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

      {/* DAM Image Picker Modal - Profile Image */}
      <MiniDamExplorer
        isOpen={showImagePicker}
        onClose={() => {
          setShowImagePicker(false)
          setEditingImageMemberId(null)
        }}
        onSelect={handleImageSelect}
        selectedAssetId={editingImageMemberId ? teamMembers.find(m => m.id === editingImageMemberId)?.imageUrl : undefined}
        title="Select Profile Image"
        subtitle={editingImageMemberId ? `Choose a photo for ${teamMembers.find(m => m.id === editingImageMemberId)?.name}` : 'Choose a profile photo'}
      />

      {/* DAM Image Picker Modal - Album Photos */}
      <MiniDamExplorer
        isOpen={showAlbumPicker}
        onClose={() => {
          setShowAlbumPicker(false)
          setAlbumPickerMemberId(null)
        }}
        onSelect={() => {}} // Required but not used for multi-select
        allowMultiple={true}
        selectedAssetIds={[]}
        onMultiSelect={handleAlbumSelect}
        title="Add Portfolio Photos"
        subtitle={albumPickerMemberId ? `Select photos for ${teamMembers.find(m => m.id === albumPickerMemberId)?.name}'s portfolio` : 'Select portfolio photos'}
      />
    </div>
  )
}

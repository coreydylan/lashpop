"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Upload as UploadIcon, Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PhotoCropEditor } from "./components/PhotoCropEditor"

interface TeamMember {
  id: string
  name: string
  imageUrl: string
}

interface TeamMemberPhoto {
  id: string
  fileName: string
  filePath: string
  isPrimary: boolean
}

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [memberPhotos, setMemberPhotos] = useState<TeamMemberPhoto[]>([])
  const [editingPhoto, setEditingPhoto] = useState<TeamMemberPhoto | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/dam/team-members")
      const data = await response.json()
      setTeamMembers(data.teamMembers || [])
    } catch (error) {
      console.error("Failed to fetch team members:", error)
    }
  }, [])

  const fetchMemberPhotos = useCallback(async (memberId: string) => {
    try {
      const response = await fetch(`/api/dam/team/${memberId}/photos`)
      const data = await response.json()
      let photos = data.photos || []

      // If member has a current photo but it's not in the photos list, create an entry for it
      const member = teamMembers.find(m => m.id === memberId) || selectedMember
      if (member?.imageUrl && !photos.some((p: any) => p.filePath === member.imageUrl)) {
        // Add the current team member photo as a pseudo-photo entry
        photos = [{
          id: 'current',
          teamMemberId: memberId,
          fileName: 'Current Profile Photo',
          filePath: member.imageUrl,
          isPrimary: true,
          uploadedAt: new Date()
        }, ...photos]
      }

      setMemberPhotos(photos)
    } catch (error) {
      console.error("Failed to fetch photos:", error)
    }
  }, [selectedMember, teamMembers])

  useEffect(() => {
    void fetchTeamMembers()
  }, [fetchTeamMembers])

  useEffect(() => {
    if (selectedMember) {
      void fetchMemberPhotos(selectedMember.id)
    }
  }, [fetchMemberPhotos, selectedMember])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedMember || !event.target.files?.[0]) return

    const file = event.target.files[0]
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("teamMemberId", selectedMember.id)

      const response = await fetch("/api/dam/team/upload", {
        method: "POST",
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setMemberPhotos((prev) => [...prev, data.photo])
        setEditingPhoto(data.photo)
      }
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveCrops = async (crops: any) => {
    if (!editingPhoto) return

    // Prevent saving crops for pseudo 'current' photo
    if (editingPhoto.id === 'current') {
      alert('Cannot save crops for the current profile photo. Please upload a new photo first.')
      return
    }

    try {
      const response = await fetch(`/api/dam/team/photos/${editingPhoto.id}/crops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crops })
      })

      if (response.ok) {
        setEditingPhoto(null)
        void fetchMemberPhotos(selectedMember!.id)
      } else {
        const errorData = await response.json().catch(() => ({}))
        alert(`Failed to save crop settings: ${errorData.error || 'Unknown error'}`)
        console.error("Failed to save crops:", errorData)
      }
    } catch (error) {
      console.error("Failed to save crops:", error)
      alert('Failed to save crop settings. Please try again.')
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    if (!selectedMember) return

    try {
      const response = await fetch(`/api/dam/team/photos/${photoId}/set-primary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId: selectedMember.id })
      })

      if (response.ok) {
        void fetchMemberPhotos(selectedMember.id)
        void fetchTeamMembers() // Refresh to update primary photo
      }
    } catch (error) {
      console.error("Failed to set primary:", error)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="glass border-b border-sage/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dam"
              className="w-10 h-10 rounded-full hover:bg-warm-sand/30 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-sage" />
            </Link>
            <div>
              <h1 className="h2 text-dune">Team Management</h1>
              <p className="caption text-sage mt-2">
                Manage team member photos and headshots
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!selectedMember ? (
          /* Team Member Selection */
          <div className="space-y-6">
            <h2 className="h3 text-dune">Select Team Member</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="group"
                >
                  <div className="aspect-square arch-full overflow-hidden bg-warm-sand/40 mb-3 hover:ring-2 hover:ring-dusty-rose transition-all">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover scale-150"
                      style={{ objectPosition: "center 25%" }}
                    />
                  </div>
                  <p className="body text-dune font-medium text-center">
                    {member.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : editingPhoto ? (
          /* Crop Editor */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="h3 text-dune">{selectedMember.name}</h2>
                <p className="caption text-sage mt-1">Edit crop settings</p>
              </div>
              <button
                onClick={() => setEditingPhoto(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>

            <PhotoCropEditor
              imageUrl={editingPhoto.filePath}
              onSave={handleSaveCrops}
            />
          </div>
        ) : (
          /* Photo Management */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-sage hover:text-dune transition-colors flex items-center gap-2 mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="caption">Back to team</span>
                </button>
                <h2 className="h3 text-dune">{selectedMember.name}</h2>
                <p className="caption text-sage mt-1">
                  {memberPhotos.length} photo{memberPhotos.length !== 1 ? "s" : ""}
                </p>
              </div>

              <label className="btn btn-primary cursor-pointer">
                <UploadIcon className="w-5 h-5" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {memberPhotos.length === 0 ? (
              <div className="text-center py-16 bg-warm-sand/20 arch-full">
                <div className="w-20 h-20 bg-sage/10 arch-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-10 h-10 text-sage" />
                </div>
                <h3 className="h3 text-dune mb-2">No photos yet</h3>
                <p className="body text-sage">Upload the first photo for this team member</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {memberPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative group"
                  >
                    <div className="aspect-square arch-full overflow-hidden bg-warm-sand/40 mb-2">
                      <img
                        src={photo.filePath}
                        alt={photo.fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {photo.isPrimary && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-dusty-rose rounded-full">
                        <span className="text-xs text-cream font-medium">Primary</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPhoto(photo)}
                        disabled={photo.id === 'current'}
                        className={`flex-1 btn py-2 text-sm ${
                          photo.id === 'current'
                            ? 'btn-disabled opacity-50 cursor-not-allowed'
                            : 'btn-secondary'
                        }`}
                        title={photo.id === 'current' ? 'Upload a new photo to edit crops' : 'Edit crop settings'}
                      >
                        {photo.id === 'current' ? 'Upload to Edit Crops' : 'Edit Crops'}
                      </button>
                      {!photo.isPrimary && photo.id !== 'current' && (
                        <button
                          onClick={() => handleSetPrimary(photo.id)}
                          className="flex-1 btn bg-sage/10 text-sage hover:bg-sage hover:text-cream py-2 text-sm transition-all"
                        >
                          Set Primary
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

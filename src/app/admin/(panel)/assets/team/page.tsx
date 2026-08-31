"use client"

/* eslint-disable @next/next/no-img-element */

export const dynamic = "force-dynamic"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Crop,
  ImagePlus,
  LoaderCircle,
  Trash2,
  Upload,
  Users,
} from "lucide-react"
import { PhotoCropEditor } from "@/components/dam/PhotoCropEditor"
import { saveTeamPhotoCrops } from "@/actions/team-photos"

interface CropData {
  x: number
  y: number
  scale: number
}

interface TeamMember {
  id: string
  name: string
  imageUrl: string
  effectiveImageUrl: string
  effectiveImageSource: "vagaro" | "local" | "placeholder"
  hasLocalPrimary: boolean
  hasRequiredLocalCrops: boolean
  localPrimaryIsLive: boolean
}

interface TeamMemberPhoto {
  id: string
  fileName: string
  filePath: string
  isPrimary: boolean
  cropCloseUpCircle?: CropData | null
  cropSquare?: CropData | null
}

type CropSet = {
  fullVertical: CropData
  fullHorizontal: CropData
  mediumCircle: CropData
  closeUpCircle: CropData
  square: CropData
}

export default function TeamPhotographyPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [memberPhotos, setMemberPhotos] = useState<TeamMemberPhoto[]>([])
  const [editingPhoto, setEditingPhoto] = useState<TeamMemberPhoto | null>(null)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const fetchTeamMembers = useCallback(async () => {
    setIsLoadingMembers(true)
    setErrorMessage(null)
    try {
      const response = await fetch("/api/dam/team-members")
      if (!response.ok) throw new Error("Team members could not be loaded.")
      const data = await response.json()
      setTeamMembers(data.teamMembers || [])
    } catch (error) {
      console.error("Failed to fetch team members:", error)
      setErrorMessage("Team photography could not be loaded. Try again in a moment.")
    } finally {
      setIsLoadingMembers(false)
    }
  }, [])

  const fetchMemberPhotos = useCallback(async (memberId: string) => {
    setIsLoadingPhotos(true)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/dam/team/${memberId}/photos?includePrimary=1`)
      if (!response.ok) throw new Error("Team photos could not be loaded.")
      const data = await response.json()
      setMemberPhotos(data.photos || [])
    } catch (error) {
      console.error("Failed to fetch photos:", error)
      setErrorMessage("This team member’s photos could not be loaded. Try again in a moment.")
    } finally {
      setIsLoadingPhotos(false)
    }
  }, [])

  useEffect(() => {
    void fetchTeamMembers()
  }, [fetchTeamMembers])

  useEffect(() => {
    if (selectedMember) void fetchMemberPhotos(selectedMember.id)
  }, [fetchMemberPhotos, selectedMember])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedMember || !event.target.files?.length) return

    const files = Array.from(event.target.files)
    setIsUploading(true)
    setErrorMessage(null)
    setNotice(null)

    try {
      const formData = new FormData()
      formData.append("teamMemberId", selectedMember.id)
      for (const file of files) {
        formData.append("files", file)
      }

      const response = await fetch("/api/dam/team/upload", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Could not upload the photo.")
      }

      const uploadedPhotos = (result.photos || []) as TeamMemberPhoto[]
      const failedFiles = (result.errors || []).map((item: { fileName: string }) => item.fileName)

      if (uploadedPhotos.length > 0) {
        setMemberPhotos((current) => [...current, ...uploadedPhotos])
        setEditingPhoto(uploadedPhotos[0])
        setNotice(`${uploadedPhotos.length} ${uploadedPhotos.length === 1 ? "photo is" : "photos are"} ready for crop setup.`)
      }

      if (failedFiles.length > 0) {
        setErrorMessage(`${failedFiles.length} ${failedFiles.length === 1 ? "file" : "files"} could not be uploaded: ${failedFiles.join(", ")}`)
      }
    } catch (error) {
      console.error("Photo upload failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "Could not upload the photo.")
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleSaveCrops = async (crops: CropSet) => {
    if (!editingPhoto || !selectedMember) return
    setIsSaving(true)
    setErrorMessage(null)
    try {
      await saveTeamPhotoCrops({ photoId: editingPhoto.id, crops })
      setEditingPhoto(null)
      await Promise.all([fetchMemberPhotos(selectedMember.id), fetchTeamMembers()])
      setNotice("Crops saved and ready for the website.")
    } catch (error) {
      console.error("Failed to save crops:", error)
      setErrorMessage("Crop settings could not be saved. Your original photo is unchanged.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetPrimary = async (photoId: string) => {
    if (!selectedMember) return
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/dam/team/photos/${photoId}/set-primary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId: selectedMember.id }),
      })
      if (!response.ok) throw new Error("Primary photo could not be changed.")
      await Promise.all([fetchMemberPhotos(selectedMember.id), fetchTeamMembers()])
      setNotice(
        selectedMember.effectiveImageSource === "vagaro"
          ? "Primary upload changed. The website still uses the Vagaro photo."
          : "Website photo updated.",
      )
    } catch (error) {
      console.error("Failed to set primary:", error)
      setErrorMessage("The primary photo could not be changed. Try again.")
    }
  }

  const handleDeletePhoto = async (photo: TeamMemberPhoto) => {
    if (!selectedMember) return
    if (photo.isPrimary) {
      setErrorMessage("Choose a different primary photo before deleting this one.")
      return
    }
    if (!window.confirm(`Delete “${photo.fileName}”? You cannot undo this.`)) return

    setErrorMessage(null)
    try {
      const response = await fetch(`/api/dam/team/photos/${photo.id}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Photo could not be deleted.")
      }
      await fetchMemberPhotos(selectedMember.id)
      setNotice("Photo deleted.")
    } catch (error) {
      console.error("Failed to delete photo:", error)
      setErrorMessage(error instanceof Error ? error.message : "The photo could not be deleted.")
    }
  }

  const clearMember = () => {
    setSelectedMember(null)
    setMemberPhotos([])
    setEditingPhoto(null)
    setErrorMessage(null)
    setNotice(null)
  }

  return (
    <div className="min-h-screen bg-[#f5f0e9] px-4 py-7 text-[#292a27] sm:px-6 lg:px-8 lg:py-9">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-6 border-b border-black/10 pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <Link
              href="/admin/assets"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg text-xs font-semibold text-black/50 hover:text-[#9f4c33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Media library
            </Link>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#9f4c33]">Team photography</p>
            <h1 className="mt-2 max-w-3xl font-serif text-3xl leading-tight sm:text-4xl">Manage team profile photos</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/55">Choose the photo shown on the website and prepare the required crops.</p>
          </div>
          <div className="rounded-xl border border-black/10 bg-white px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">Profiles with a photo</p>
            <p className="mt-1 font-serif text-2xl">{teamMembers.filter(hasLivePortrait).length} / {teamMembers.length}</p>
            <p className="mt-1 text-xs text-black/45">profiles show a website photo</p>
          </div>
        </header>

        <div className="mt-6" aria-live="polite">
          {errorMessage && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-900/15 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="leading-5">{errorMessage}</span>
            </div>
          )}
          {notice && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-emerald-900/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span className="leading-5">{notice}</span>
            </div>
          )}
        </div>

        {isLoadingMembers ? (
          <LoadingState label="Loading team photography…" />
        ) : errorMessage && teamMembers.length === 0 ? (
          <div className="rounded-xl border border-black/10 bg-white px-6 py-14 text-center">
            <button type="button" onClick={() => void fetchTeamMembers()} className="inline-flex min-h-11 items-center rounded-lg bg-[#292a27] px-4 text-sm font-semibold text-white hover:bg-black">Try again</button>
          </div>
        ) : !selectedMember ? (
          <TeamRoster teamMembers={teamMembers} onSelect={setSelectedMember} />
        ) : editingPhoto ? (
          <section className="mt-2" aria-labelledby="crop-editor-heading">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <button type="button" onClick={() => setEditingPhoto(null)} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-xs font-semibold text-black/50 hover:text-[#9f4c33]">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  {selectedMember.name}’s photos
                </button>
                <h2 id="crop-editor-heading" className="mt-2 font-serif text-3xl">Prepare website crops</h2>
                <p className="mt-1 text-sm text-black/50">Set the square, horizontal, vertical and circle crops used on the website.</p>
              </div>
              {isSaving && <span className="inline-flex items-center gap-2 text-xs font-semibold text-black/45"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Saving crops…</span>}
            </div>
            <div className="overflow-hidden rounded-xl border border-black/10 bg-white p-4 sm:p-6">
              <PhotoCropEditor imageUrl={editingPhoto.filePath} onSave={handleSaveCrops} />
            </div>
          </section>
        ) : (
          <MemberPhotoLibrary
            member={selectedMember}
            photos={memberPhotos}
            isLoading={isLoadingPhotos}
            isUploading={isUploading}
            onBack={clearMember}
            onUpload={handleFileUpload}
            onEdit={setEditingPhoto}
            onSetPrimary={(photoId) => void handleSetPrimary(photoId)}
            onDelete={(photo) => void handleDeletePhoto(photo)}
          />
        )}
      </div>
    </div>
  )
}

function TeamRoster({ teamMembers, onSelect }: { teamMembers: TeamMember[]; onSelect: (member: TeamMember) => void }) {
  if (teamMembers.length === 0) {
    return (
      <section className="mt-2 rounded-xl border border-dashed border-black/20 bg-white px-6 py-16 text-center">
        <Users className="mx-auto size-7 text-[#9f4c33]" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-2xl">No team members found</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">Team members appear here after a Vagaro sync.</p>
      </section>
    )
  }

  return (
    <section className="mt-2" aria-labelledby="team-roster-heading">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id="team-roster-heading" className="font-serif text-2xl">Choose a team member</h2>
          <p className="mt-1 text-xs text-black/45">Every preview below matches the photo currently shown on the website.</p>
        </div>
        <p className="text-xs font-semibold text-black/40">{teamMembers.length} profiles</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...teamMembers].sort((a, b) => Number(hasLivePortrait(a)) - Number(hasLivePortrait(b)) || a.name.localeCompare(b.name)).map((member) => {
          const live = hasLivePortrait(member)
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelect(member)}
              className="group grid min-h-32 grid-cols-[5.5rem_1fr] overflow-hidden rounded-xl border border-black/10 bg-white text-left hover:border-[#c96f50]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c96f50]"
              aria-label={`Manage photography for ${member.name}, ${liveSourceLabel(member)}`}
            >
              <span className="relative h-full min-h-32 overflow-hidden bg-[#eadfd5]">
                <img src={member.effectiveImageUrl} alt="" width={320} height={320} loading="lazy" className={`absolute inset-0 size-full ${member.effectiveImageSource === "placeholder" ? "object-contain p-4" : "object-cover object-top"}`} />
              </span>
              <span className="flex min-w-0 flex-col justify-between p-4">
                <span className="font-serif text-xl leading-tight">{member.name}</span>
                <span className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${live ? "border-emerald-800/15 bg-emerald-50 text-emerald-800" : "border-amber-800/15 bg-amber-50 text-amber-900"}`}>
                  {live ? <CheckCircle2 className="size-3" aria-hidden="true" /> : <AlertCircle className="size-3" aria-hidden="true" />}
                  {liveSourceLabel(member)}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function MemberPhotoLibrary({
  member,
  photos,
  isLoading,
  isUploading,
  onBack,
  onUpload,
  onEdit,
  onSetPrimary,
  onDelete,
}: {
  member: TeamMember
  photos: TeamMemberPhoto[]
  isLoading: boolean
  isUploading: boolean
  onBack: () => void
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onEdit: (photo: TeamMemberPhoto) => void
  onSetPrimary: (photoId: string) => void
  onDelete: (photo: TeamMemberPhoto) => void
}) {
  return (
    <section className="mt-2" aria-labelledby="member-photos-heading">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-xs font-semibold text-black/50 hover:text-[#9f4c33]">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All team members
          </button>
          <h2 id="member-photos-heading" className="mt-2 font-serif text-3xl">{member.name}</h2>
          <p className="mt-1 text-sm text-black/50">{photos.length} uploaded {photos.length === 1 ? "photo" : "photos"} · the current website photo is shown below.</p>
        </div>
        <label className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#292a27] px-4 text-sm font-semibold text-white hover:bg-black focus-within:ring-2 focus-within:ring-[#c96f50] ${isUploading ? "pointer-events-none opacity-60" : ""}`}>
          {isUploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
          {isUploading ? "Uploading…" : "Upload photos"}
          <input name="team-photos" type="file" accept="image/*" multiple onChange={onUpload} className="sr-only" disabled={isUploading} />
        </label>
      </div>

      <div className="mb-6 grid overflow-hidden rounded-xl border border-black/10 bg-white sm:grid-cols-[10rem_1fr]">
        <div className="relative aspect-square overflow-hidden bg-[#eadfd5] sm:aspect-auto sm:min-h-40">
          <img
            src={member.effectiveImageUrl}
            alt={`${member.name} as currently shown on the website`}
            width={480}
            height={480}
            className={`absolute inset-0 size-full ${member.effectiveImageSource === "placeholder" ? "object-contain p-5" : "object-cover object-top"}`}
          />
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9f4c33]">Website photo</p>
          <p className="mt-2 font-serif text-2xl">{liveSourceLabel(member)}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
            {member.effectiveImageSource === "vagaro"
              ? "The website is using this Vagaro photo. Uploaded photos below do not replace it until the website photo source changes."
              : member.effectiveImageSource === "local"
                ? "The website is using this photo uploaded in Admin."
                : "The website does not show a photo for this team member."}
          </p>
          {member.effectiveImageSource === "vagaro" && !member.hasLocalPrimary && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-amber-900">
              <AlertCircle className="size-3.5" aria-hidden="true" /> No uploaded primary photo. The website still uses Vagaro.
            </p>
          )}
          {member.hasLocalPrimary && !member.localPrimaryIsLive && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-black/45">
              <Crop className="size-3.5" aria-hidden="true" /> An uploaded primary photo is ready, but it is not the photo currently shown on the website.
            </p>
          )}
          {member.hasLocalPrimary && !member.hasRequiredLocalCrops && (
            <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-amber-900">
              <AlertCircle className="size-3.5" aria-hidden="true" /> Create all required crops for the primary photo.
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingState label={`Loading ${member.name}’s photos…`} />
      ) : photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/20 bg-white px-6 py-16 text-center">
          <ImagePlus className="mx-auto size-7 text-[#9f4c33]" aria-hidden="true" />
          <h3 className="mt-4 font-serif text-2xl">Upload a profile photo</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/50">Use the original full-resolution image. You will crop it for each website placement.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo) => {
            const hasCrops = Boolean(photo.cropSquare && photo.cropCloseUpCircle)
            return (
              <article key={photo.id} className="group overflow-hidden rounded-xl border border-black/10 bg-white">
                <div className="relative aspect-square overflow-hidden bg-[#eadfd5]">
                  <SourcePhotoPreview photo={photo} />
                  <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onDelete(photo)}
                      disabled={photo.isPrimary}
                      className="flex size-11 items-center justify-center rounded-lg border border-white/30 bg-black/65 text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                      aria-label={photo.isPrimary ? `Cannot delete primary photo ${photo.fileName}` : `Delete ${photo.fileName}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                    <span className="flex flex-wrap justify-end gap-1.5">
                      {photo.isPrimary && <span className="rounded-full bg-[#292a27] px-2.5 py-1 text-[10px] font-semibold text-white">Primary upload</span>}
                      {hasCrops && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800"><CheckCircle2 className="size-3" aria-hidden="true" /> Cropped</span>}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="truncate text-xs font-semibold text-black/65" title={photo.fileName}>{photo.fileName}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => onEdit(photo)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-black/15 text-xs font-semibold hover:border-[#c96f50]/50 hover:text-[#9f4c33]">
                      <Crop className="size-3.5" aria-hidden="true" />
                      {hasCrops ? "Edit crops" : "Set crops"}
                    </button>
                    <button type="button" onClick={() => onSetPrimary(photo.id)} disabled={photo.isPrimary} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#f4dfd5] px-2 text-xs font-semibold text-[#87442f] hover:bg-[#ecd0c3] disabled:cursor-default disabled:bg-black/[0.04] disabled:text-black/35">
                      {photo.isPrimary ? "Primary upload" : "Make primary"}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-black/10 bg-white" aria-busy="true">
      <span className="inline-flex items-center gap-2 text-sm text-black/45"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />{label}</span>
    </div>
  )
}

function SourcePhotoPreview({ photo }: { photo: TeamMemberPhoto }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-amber-50 px-4 text-center text-amber-900" role="status">
        <AlertCircle className="size-5" aria-hidden="true" />
        <span className="text-xs font-semibold">Source file unavailable</span>
      </div>
    )
  }

  return (
    <img
      src={photo.filePath}
      alt={photo.fileName}
      width={640}
      height={640}
      loading="lazy"
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  )
}

function hasLivePortrait(member: TeamMember): boolean {
  return member.effectiveImageSource !== "placeholder"
}

function liveSourceLabel(member: TeamMember): string {
  if (member.effectiveImageSource === "vagaro") return "From Vagaro"
  if (member.effectiveImageSource === "local") return "Uploaded in Admin"
  return "No website photo"
}

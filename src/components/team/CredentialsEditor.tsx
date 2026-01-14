'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Trash2,
  Check,
  Award,
  FileCheck,
  GraduationCap,
  Trophy,
  BookOpen,
  Shield,
  ExternalLink,
  Calendar,
  type LucideIcon
} from 'lucide-react'
import type { TeamMemberCredential } from '@/db/schema/team_members'

// Credential type definitions with icons
const CREDENTIAL_TYPES = {
  license: { label: "License", icon: FileCheck, description: "State or professional license" },
  certification: { label: "Certification", icon: Award, description: "Professional certification" },
  training: { label: "Training", icon: BookOpen, description: "Specialized training program" },
  education: { label: "Education", icon: GraduationCap, description: "Degree or formal education" },
  award: { label: "Award", icon: Trophy, description: "Industry recognition or award" },
} as const

type CredentialType = keyof typeof CREDENTIAL_TYPES

interface CredentialsEditorProps {
  memberId: string
  memberName: string
  initialCredentials?: TeamMemberCredential[]
  onCredentialsChange?: (credentials: TeamMemberCredential[]) => void
}

export function CredentialsEditor({
  memberId,
  memberName,
  initialCredentials = [],
  onCredentialsChange
}: CredentialsEditorProps) {
  const [credentials, setCredentials] = useState<TeamMemberCredential[]>(initialCredentials)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newCredential, setNewCredential] = useState<TeamMemberCredential>({
    type: 'certification',
    name: '',
    issuer: '',
    dateIssued: '',
    licenseNumber: '',
    url: ''
  })

  useEffect(() => {
    setCredentials(initialCredentials)
  }, [initialCredentials])

  const handleAddCredential = async () => {
    if (!newCredential.name.trim()) return

    setSaving(true)
    try {
      const cleanedCredential = {
        ...newCredential,
        name: newCredential.name.trim(),
        issuer: newCredential.issuer?.trim() || undefined,
        licenseNumber: newCredential.licenseNumber?.trim() || undefined,
        url: newCredential.url?.trim() || undefined,
        dateIssued: newCredential.dateIssued || undefined,
      }

      const updatedCredentials = [...credentials, cleanedCredential]

      // Save to server
      const response = await fetch('/api/admin/website/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, credentials: updatedCredentials }),
      })

      if (response.ok) {
        setCredentials(updatedCredentials)
        onCredentialsChange?.(updatedCredentials)
        setNewCredential({
          type: 'certification',
          name: '',
          issuer: '',
          dateIssued: '',
          licenseNumber: '',
          url: ''
        })
        setIsAddingNew(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error adding credential:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCredential = async (index: number, updates: Partial<TeamMemberCredential>) => {
    setSaving(true)
    try {
      const updatedCredentials = credentials.map((cred, i) =>
        i === index ? { ...cred, ...updates } : cred
      )

      const response = await fetch('/api/admin/website/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, credentials: updatedCredentials }),
      })

      if (response.ok) {
        setCredentials(updatedCredentials)
        onCredentialsChange?.(updatedCredentials)
        setEditingIndex(null)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error updating credential:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCredential = async (index: number) => {
    if (!confirm('Are you sure you want to delete this credential?')) return

    setSaving(true)
    try {
      const updatedCredentials = credentials.filter((_, i) => i !== index)

      const response = await fetch('/api/admin/website/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, credentials: updatedCredentials }),
      })

      if (response.ok) {
        setCredentials(updatedCredentials)
        onCredentialsChange?.(updatedCredentials)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error('Error deleting credential:', error)
    } finally {
      setSaving(false)
    }
  }

  const getCredentialTypeInfo = (type: string) => {
    return CREDENTIAL_TYPES[type as CredentialType] || CREDENTIAL_TYPES.certification
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-dune flex items-center gap-2">
            <Shield className="w-4 h-4 text-ocean-mist" />
            Credentials & Certifications
            {saved && (
              <span className="text-xs text-ocean-mist flex items-center gap-1">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
          </h4>
          <p className="text-xs text-dune/50 mt-0.5">
            For search engines only (not displayed publicly)
          </p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ocean-mist/10 text-ocean-mist rounded-full hover:bg-ocean-mist/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Credential
        </button>
      </div>

      {/* Existing Credentials List */}
      {credentials.length > 0 && (
        <div className="space-y-2">
          {credentials.map((credential, index) => {
            const typeInfo = getCredentialTypeInfo(credential.type)
            const Icon = typeInfo.icon
            const isEditing = editingIndex === index

            return (
              <div
                key={index}
                className={`group flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  isEditing
                    ? 'bg-ocean-mist/5 border-ocean-mist/20'
                    : 'bg-sage/5 border-sage/10 hover:bg-sage/10'
                }`}
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon className="w-4 h-4 text-ocean-mist" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <EditCredentialForm
                      credential={credential}
                      onSave={(updates) => handleUpdateCredential(index, updates)}
                      onCancel={() => setEditingIndex(null)}
                      saving={saving}
                    />
                  ) : (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-dune/50 mb-0.5">
                        {typeInfo.label}
                      </div>
                      <div className="text-sm font-medium text-dune/80">
                        {credential.name}
                      </div>
                      {credential.issuer && (
                        <div className="text-xs text-dune/50 mt-0.5">
                          {credential.issuer}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {credential.licenseNumber && (
                          <span className="text-[10px] px-2 py-0.5 bg-sage/10 rounded-full text-dune/60">
                            #{credential.licenseNumber}
                          </span>
                        )}
                        {credential.dateIssued && (
                          <span className="text-[10px] px-2 py-0.5 bg-sage/10 rounded-full text-dune/60 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {credential.dateIssued}
                          </span>
                        )}
                        {credential.url && (
                          <a
                            href={credential.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-2 py-0.5 bg-ocean-mist/10 rounded-full text-ocean-mist flex items-center gap-1 hover:bg-ocean-mist/20"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Verify
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingIndex(index)}
                      className="w-7 h-7 rounded-lg hover:bg-sage/20 flex items-center justify-center text-dune/40 hover:text-dune/70 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCredential(index)}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-dune/40 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {credentials.length === 0 && !isAddingNew && (
        <div className="text-center py-6 text-dune/40 text-sm border border-dashed border-sage/20 rounded-xl">
          No credentials yet. Add licenses, certifications, training...
          <p className="text-xs mt-1 text-dune/30">
            These appear in search engine data to boost E-E-A-T signals
          </p>
        </div>
      )}

      {/* Add New Credential Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-ocean-mist/5 border border-ocean-mist/20 rounded-xl space-y-3">
              {/* Credential Type Selector */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(CREDENTIAL_TYPES).map(([key, info]) => {
                  const Icon = info.icon
                  const isSelected = newCredential.type === key
                  return (
                    <button
                      key={key}
                      onClick={() => setNewCredential({ ...newCredential, type: key as CredentialType })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-ocean-mist text-white'
                          : 'bg-white text-dune/70 hover:bg-ocean-mist/10'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {info.label}
                    </button>
                  )
                })}
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Credential name (e.g., Licensed Esthetician)*"
                  value={newCredential.name}
                  onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                  autoFocus
                />

                <input
                  type="text"
                  placeholder="Issuing organization (e.g., California Board of Cosmetology)"
                  value={newCredential.issuer || ''}
                  onChange={(e) => setNewCredential({ ...newCredential, issuer: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="License/cert number"
                    value={newCredential.licenseNumber || ''}
                    onChange={(e) => setNewCredential({ ...newCredential, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                  />
                  <input
                    type="text"
                    placeholder="Date issued (YYYY-MM-DD)"
                    value={newCredential.dateIssued || ''}
                    onChange={(e) => setNewCredential({ ...newCredential, dateIssued: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                  />
                </div>

                <input
                  type="url"
                  placeholder="Verification URL (optional)"
                  value={newCredential.url || ''}
                  onChange={(e) => setNewCredential({ ...newCredential, url: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-sage/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-mist/20 focus:border-ocean-mist/40"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsAddingNew(false)
                    setNewCredential({
                      type: 'certification',
                      name: '',
                      issuer: '',
                      dateIssued: '',
                      licenseNumber: '',
                      url: ''
                    })
                  }}
                  className="px-4 py-2 text-sm text-dune/60 hover:text-dune transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCredential}
                  disabled={!newCredential.name.trim() || saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ocean-mist text-white rounded-lg hover:bg-ocean-mist/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Credential
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inline edit form component
function EditCredentialForm({
  credential,
  onSave,
  onCancel,
  saving,
}: {
  credential: TeamMemberCredential
  onSave: (updates: Partial<TeamMemberCredential>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [formData, setFormData] = useState(credential)

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Credential name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-2 py-1 text-sm border border-sage/20 rounded focus:outline-none focus:ring-1 focus:ring-ocean-mist/30"
        autoFocus
      />
      <input
        type="text"
        placeholder="Issuing organization"
        value={formData.issuer || ''}
        onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
        className="w-full px-2 py-1 text-xs border border-sage/20 rounded focus:outline-none focus:ring-1 focus:ring-ocean-mist/30"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="License #"
          value={formData.licenseNumber || ''}
          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
          className="w-full px-2 py-1 text-xs border border-sage/20 rounded focus:outline-none focus:ring-1 focus:ring-ocean-mist/30"
        />
        <input
          type="text"
          placeholder="Date issued"
          value={formData.dateIssued || ''}
          onChange={(e) => setFormData({ ...formData, dateIssued: e.target.value })}
          className="w-full px-2 py-1 text-xs border border-sage/20 rounded focus:outline-none focus:ring-1 focus:ring-ocean-mist/30"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(formData)}
          disabled={saving}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-ocean-mist text-white rounded hover:bg-ocean-mist/90 disabled:opacity-50"
        >
          <Check className="w-3 h-3" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-2 py-1 text-xs text-dune/60 hover:text-dune"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default CredentialsEditor

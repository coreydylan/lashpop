"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { FileText, Eye, Edit3, Save, Check, RefreshCw, Plus, Trash2, GripVertical } from 'lucide-react'
import { FounderLetterSettings } from '@/db/schema/site_settings'

export default function FounderLetterEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  const [letterContent, setLetterContent] = useState<FounderLetterSettings>({
    enabled: true,
    greeting: 'Dear Beautiful Soul,',
    paragraphs: [
      "When I started LashPop, I wanted to build something simple: a place where you actually feel taken care of.",
      "We're all united by the same mission—helping you feel effortlessly beautiful and confident, with a few less things to worry about during your busy week. We might be able to give you that \"just woke up from eight blissful hours\" look with little effort (even if your reality looks more like five). We're not here to judge ;)",
      "Thank you for trusting us. We can't wait to see you."
    ],
    signOff: 'With love and lashes,',
    signature: 'Emily and the LashPop Family',
    founderName: 'Emily',
    founderTitle: 'Founder, LashPop Studios'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/website/site-settings')
      if (response.ok) {
        const data = await response.json()
        if (data.founderLetter) {
          setLetterContent(data.founderLetter)
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/website/site-settings/founder-letter', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(letterContent)
      })

      if (response.ok) {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 2000)
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateField = <K extends keyof FounderLetterSettings>(key: K, value: FounderLetterSettings[K]) => {
    setLetterContent(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const updateParagraph = (index: number, value: string) => {
    const newParagraphs = [...letterContent.paragraphs]
    newParagraphs[index] = value
    updateField('paragraphs', newParagraphs)
  }

  const addParagraph = () => {
    updateField('paragraphs', [...letterContent.paragraphs, ''])
  }

  const removeParagraph = (index: number) => {
    if (letterContent.paragraphs.length > 1) {
      const newParagraphs = letterContent.paragraphs.filter((_, i) => i !== index)
      updateField('paragraphs', newParagraphs)
    }
  }

  const moveParagraph = (index: number, direction: 'up' | 'down') => {
    const newParagraphs = [...letterContent.paragraphs]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < newParagraphs.length) {
      [newParagraphs[index], newParagraphs[newIndex]] = [newParagraphs[newIndex], newParagraphs[index]]
      updateField('paragraphs', newParagraphs)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage/30 to-sage/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-sage" />
            </div>
            <div>
              <h1 className="h2 text-dune">Founder Letter</h1>
              <p className="text-sm text-dune/60">Emily&apos;s welcome message section</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                viewMode === 'edit'
                  ? 'bg-sage/20 text-dune border border-sage/30'
                  : 'bg-cream/50 text-dune/60 border border-sage/10 hover:border-sage/20'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                viewMode === 'preview'
                  ? 'bg-sage/20 text-dune border border-sage/30'
                  : 'bg-cream/50 text-dune/60 border border-sage/10 hover:border-sage/20'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`btn ${saved ? 'btn-secondary bg-sage/20 border-sage/30' : 'btn-primary'} ${!hasChanges && !saved ? 'opacity-50' : ''}`}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {viewMode === 'edit' ? (
          <div className="glass rounded-3xl p-6 border border-sage/20 space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 bg-cream/50 border border-sage/20 rounded-xl">
              <div>
                <p className="text-sm text-dune font-medium">Show Founder Letter Section</p>
                <p className="text-xs text-dune/50">Display this section on the homepage</p>
              </div>
              <div
                onClick={() => updateField('enabled', !letterContent.enabled)}
                className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                  letterContent.enabled ? 'bg-sage' : 'bg-sage/30'
                }`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  letterContent.enabled ? 'left-6' : 'left-1'
                }`} />
              </div>
            </div>

            {/* Greeting */}
            <div>
              <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                Greeting
              </label>
              <input
                type="text"
                value={letterContent.greeting}
                onChange={(e) => updateField('greeting', e.target.value)}
                placeholder="Dear Beautiful Soul,"
                className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-sage transition-colors font-serif text-lg"
              />
            </div>

            {/* Paragraphs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-dune/50 uppercase tracking-wider">
                  Letter Body ({letterContent.paragraphs.length} paragraphs)
                </label>
                <button
                  onClick={addParagraph}
                  className="text-xs text-sage hover:text-sage/80 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Paragraph
                </button>
              </div>
              <div className="space-y-3">
                {letterContent.paragraphs.map((paragraph, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex flex-col gap-1 pt-3">
                      <button
                        onClick={() => moveParagraph(index, 'up')}
                        disabled={index === 0}
                        className="text-dune/30 hover:text-dune/60 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <GripVertical className="w-4 h-4 text-dune/30" />
                      <button
                        onClick={() => moveParagraph(index, 'down')}
                        disabled={index === letterContent.paragraphs.length - 1}
                        className="text-dune/30 hover:text-dune/60 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <textarea
                      value={paragraph}
                      onChange={(e) => updateParagraph(index, e.target.value)}
                      placeholder={`Paragraph ${index + 1}...`}
                      rows={3}
                      className="flex-1 px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-sage transition-colors resize-none"
                    />
                    <button
                      onClick={() => removeParagraph(index)}
                      disabled={letterContent.paragraphs.length <= 1}
                      className="pt-3 text-terracotta/50 hover:text-terracotta disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sign Off */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Sign Off
                </label>
                <input
                  type="text"
                  value={letterContent.signOff}
                  onChange={(e) => updateField('signOff', e.target.value)}
                  placeholder="With love and lashes,"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-sage transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Signature
                </label>
                <input
                  type="text"
                  value={letterContent.signature}
                  onChange={(e) => updateField('signature', e.target.value)}
                  placeholder="Emily and the LashPop Family"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-sage transition-colors font-serif text-lg"
                />
              </div>
            </div>

            {/* Founder Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Founder Name
                </label>
                <input
                  type="text"
                  value={letterContent.founderName}
                  onChange={(e) => updateField('founderName', e.target.value)}
                  placeholder="Emily"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-sage transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-dune/50 uppercase tracking-wider mb-2 block">
                  Founder Title
                </label>
                <input
                  type="text"
                  value={letterContent.founderTitle}
                  onChange={(e) => updateField('founderTitle', e.target.value)}
                  placeholder="Founder, LashPop Studios"
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:outline-none focus:border-sage transition-colors"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="glass rounded-3xl p-6 border border-sage/20">
            <div className="prose prose-dune max-w-none">
              <div className="bg-cream rounded-2xl p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                  {/* Arch Image */}
                  <div className="w-full md:w-auto flex-shrink-0">
                    <div className="relative w-48 md:w-64 mx-auto md:mx-0">
                      <Image
                        src="/lashpop-images/emily-arch.png"
                        alt="Emily in decorative arch"
                        width={280}
                        height={360}
                        className="w-full h-auto"
                      />
                    </div>
                  </div>

                  {/* Letter Content */}
                  <div className="flex-1 text-[#8a5e55] font-swanky">
                    <p className="text-xl md:text-2xl mb-4">{letterContent.greeting}</p>

                    {letterContent.paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-lg leading-relaxed mb-4">
                        {paragraph}
                      </p>
                    ))}

                    <div className="mt-6">
                      <p className="text-lg">{letterContent.signOff}</p>
                      <p className="text-xl md:text-2xl mt-2">{letterContent.signature}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

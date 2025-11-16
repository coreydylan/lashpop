"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import type { CampaignBriefInput, SocialPlatform } from "@/types/campaign"

/**
 * Campaign Creation Page
 *
 * Allows users to:
 * 1. Create a new campaign brief
 * 2. Select brand assets and inspiration
 * 3. Define deliverables and requirements
 * 4. Generate campaign with AI
 */
export default function CampaignsPage() {
  const [step, setStep] = useState<'list' | 'create' | 'generating'>('list')
  const [brief, setBrief] = useState<Partial<CampaignBriefInput>>({
    platforms: ['instagram'],
    brandAssets: {},
    inspiration: {},
    requirements: {}
  })

  // Fetch existing campaigns
  const { data: campaigns, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/campaigns')
      const data = await res.json()
      return data.campaigns || []
    }
  })

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (input: CampaignBriefInput) => {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      return res.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        // Immediately start generation
        generateCampaign.mutate(data.campaign.id)
      }
    }
  })

  // Generate campaign mutation
  const generateCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/campaigns/${campaignId}/generate`, {
        method: 'POST'
      })
      return res.json()
    },
    onSuccess: () => {
      refetch()
      setStep('list')
    }
  })

  const handleCreate = () => {
    if (!brief.campaignName || !brief.objective) {
      alert('Please fill in campaign name and objective')
      return
    }

    createCampaign.mutate(brief as CampaignBriefInput)
    setStep('generating')
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Generating Your Campaign</h2>
          <p className="text-gray-600 mb-4">
            The AI is creating your campaign assets...
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>✓ Analyzing brand assets</p>
            <p>✓ Creating creative brief</p>
            <p className="animate-pulse">→ Generating assets in parallel...</p>
            <p>⋯ Quality control</p>
            <p>⋯ Ready for review</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'create') {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <button
            onClick={() => setStep('list')}
            className="text-pink-600 hover:text-pink-700 mb-4"
          >
            ← Back to campaigns
          </button>
          <h1 className="text-3xl font-bold mb-2">Create New Campaign</h1>
          <p className="text-gray-600">
            Tell us about your campaign and we'll generate everything you need
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={brief.campaignName || ''}
                  onChange={(e) => setBrief({ ...brief, campaignName: e.target.value })}
                  placeholder="Summer Lash Collection 2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objective *
                </label>
                <textarea
                  value={brief.objective || ''}
                  onChange={(e) => setBrief({ ...brief, objective: e.target.value })}
                  placeholder="Launch new summer lash styles, target Gen Z, vibrant aesthetic"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['instagram', 'tiktok', 'pinterest', 'facebook'] as SocialPlatform[]).map(platform => (
                    <label key={platform} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={brief.platforms?.includes(platform)}
                        onChange={(e) => {
                          const platforms = brief.platforms || []
                          setBrief({
                            ...brief,
                            platforms: e.target.checked
                              ? [...platforms, platform]
                              : platforms.filter(p => p !== platform)
                          })
                        }}
                        className="rounded text-pink-600"
                      />
                      <span className="text-sm capitalize">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Deliverables */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Deliverables</h2>
            <p className="text-sm text-gray-600 mb-4">
              What assets do you need? (one per line)
            </p>
            <textarea
              value={brief.requirements?.deliverables?.join('\n') || ''}
              onChange={(e) => setBrief({
                ...brief,
                requirements: {
                  ...brief.requirements,
                  deliverables: e.target.value.split('\n').filter(Boolean)
                }
              })}
              placeholder="Hero campaign image&#10;5 product highlight posts&#10;3 lifestyle posts&#10;10 Instagram stories&#10;Email header&#10;Website banner"
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              Example: "Hero campaign image", "Instagram feed post", "Story graphic"
            </p>
          </div>

          {/* Create Button */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setStep('list')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createCampaign.isPending}
              className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
            >
              {createCampaign.isPending ? 'Creating...' : 'Create & Generate Campaign'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Campaign Orchestration</h1>
          <p className="text-gray-600">
            Create complete campaigns with multi-agent AI
          </p>
        </div>
        <button
          onClick={() => setStep('create')}
          className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
        >
          + New Campaign
        </button>
      </div>

      {campaigns?.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-2xl font-semibold mb-2">No campaigns yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first AI-powered campaign
          </p>
          <button
            onClick={() => setStep('create')}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Create First Campaign
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {campaigns?.map((campaign: any) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{campaign.name}</h3>
                  <p className="text-gray-600 text-sm">{campaign.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  campaign.status === 'review' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'generating_assets' ? 'bg-blue-100 text-blue-800' :
                  campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {campaign.status}
                </span>
              </div>

              {campaign.generationMetadata && (
                <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Assets:</span>{' '}
                    {campaign.generationMetadata.generatedAssets}/{campaign.generationMetadata.totalAssets}
                  </div>
                  <div>
                    <span className="font-medium">Cost:</span>{' '}
                    ${(campaign.generationMetadata.totalCost / 100).toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>{' '}
                    {Math.round(campaign.generationMetadata.totalTime / 1000)}s
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    {campaign.status}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => window.location.href = `/dam/campaigns/${campaign.id}`}
                  className="px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 text-sm"
                >
                  View Campaign
                </button>
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => generateCampaign.mutate(campaign.id)}
                    disabled={generateCampaign.isPending}
                    className="px-4 py-2 border border-pink-600 text-pink-600 rounded hover:bg-pink-50 text-sm"
                  >
                    Generate Assets
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Onboarding Flow Page
 *
 * Multi-step wizard for onboarding new users with AI-powered brand extraction
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export default function OnboardingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Get onboarding progress
  const { data: progressData } = useQuery({
    queryKey: ['onboarding-progress'],
    queryFn: async () => {
      const response = await fetch('/api/onboarding/progress')
      if (!response.ok) throw new Error('Failed to fetch progress')
      return response.json()
    }
  })

  // Check if onboarding is already completed
  useEffect(() => {
    if (progressData?.progress?.status === 'completed') {
      router.push('/dam')
    }
  }, [progressData, router])

  const handleComplete = async () => {
    // Mark onboarding as completed
    await fetch('/api/onboarding/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        completionPercentage: 100
      })
    })

    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] })

    // Redirect to main app
    router.push('/dam')
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-warm-sand via-cream to-ocean-mist opacity-50" />

      {/* Content */}
      <div className="relative z-10">
        <OnboardingWizard
          initialProgress={progressData?.progress}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}

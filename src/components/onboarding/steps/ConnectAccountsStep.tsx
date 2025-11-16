/**
 * Connect Accounts Step
 *
 * Let users connect Instagram, websites, and other sources
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Instagram, Globe, Plus, X, Check, Loader2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

interface ConnectAccountsStepProps {
  onNext: (data?: any) => void
  onBack: () => void
  onSkip: () => void
  data?: any
}

export function ConnectAccountsStep({ onNext, data }: ConnectAccountsStepProps) {
  const [accountType, setAccountType] = useState<string>('instagram')
  const [accountIdentifier, setAccountIdentifier] = useState('')
  const queryClient = useQueryClient()

  // Get connected accounts
  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/onboarding/connect-account')
      if (!response.ok) throw new Error('Failed to fetch accounts')
      return response.json()
    }
  })

  // Connect account mutation
  const connectMutation = useMutation({
    mutationFn: async (data: { accountType: string; accountIdentifier: string }) => {
      const response = await fetch('/api/onboarding/connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType: data.accountType,
          accountIdentifier: data.accountIdentifier,
          displayName: data.accountIdentifier,
          profileUrl:
            data.accountType === 'instagram'
              ? `https://instagram.com/${data.accountIdentifier}`
              : data.accountIdentifier
        })
      })

      if (!response.ok) throw new Error('Failed to connect account')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] })
      setAccountIdentifier('')
    }
  })

  // Delete account mutation
  const deleteMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch(`/api/onboarding/connect-account?accountId=${accountId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete account')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] })
    }
  })

  const handleConnect = () => {
    if (!accountIdentifier.trim()) return

    connectMutation.mutate({
      accountType,
      accountIdentifier: accountIdentifier.trim()
    })
  }

  const handleContinue = () => {
    onNext({
      connectedAccounts: accountsData?.accounts || []
    })
  }

  const accounts = accountsData?.accounts || []
  const hasAccounts = accounts.length > 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-dune mb-3">Connect Your Brand</h2>
        <p className="text-sage">
          Add your Instagram, website, or other social profiles so we can learn about your brand
        </p>
      </div>

      {/* Account type selector */}
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 mb-6">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setAccountType('instagram')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all ${
              accountType === 'instagram'
                ? 'bg-gradient-to-r from-dusty-rose to-golden text-white'
                : 'bg-warm-sand text-sage hover:bg-warm-sand/80'
            }`}
          >
            <Instagram className="w-5 h-5" />
            Instagram
          </button>
          <button
            onClick={() => setAccountType('website')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all ${
              accountType === 'website'
                ? 'bg-gradient-to-r from-dusty-rose to-golden text-white'
                : 'bg-warm-sand text-sage hover:bg-warm-sand/80'
            }`}
          >
            <Globe className="w-5 h-5" />
            Website
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={accountIdentifier}
            onChange={(e) => setAccountIdentifier(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
            placeholder={
              accountType === 'instagram' ? 'Enter Instagram username' : 'Enter website URL'
            }
            className="flex-1 px-4 py-3 rounded-2xl bg-white border border-sage/20 focus:border-golden focus:outline-none"
          />
          <button
            onClick={handleConnect}
            disabled={!accountIdentifier.trim() || connectMutation.isPending}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-dusty-rose to-golden text-white hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {connectMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Add
          </button>
        </div>
      </div>

      {/* Connected accounts list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-golden" />
        </div>
      ) : hasAccounts ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-sage mb-3">Connected Accounts</h3>
          {accounts.map((account: any) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warm-sand flex items-center justify-center">
                  {account.accountType === 'instagram' ? (
                    <Instagram className="w-5 h-5 text-golden" />
                  ) : (
                    <Globe className="w-5 h-5 text-golden" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-dune">{account.displayName}</div>
                  <div className="text-sm text-sage">{account.accountType}</div>
                </div>
              </div>

              <button
                onClick={() => deleteMutation.mutate(account.id)}
                className="p-2 hover:bg-warm-sand rounded-full transition-all"
              >
                <X className="w-5 h-5 text-sage" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-sage">
          <p>No accounts connected yet. Add one above to get started!</p>
        </div>
      )}

      {/* Continue button */}
      {hasAccounts && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleContinue}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-golden text-white hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
          >
            <Check className="w-5 h-5" />
            Continue with {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

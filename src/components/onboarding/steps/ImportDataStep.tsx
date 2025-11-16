/**
 * Import Data Step - Scrapes connected accounts
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Check, AlertCircle, Image as ImageIcon } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'

interface ImportDataStepProps {
  onNext: (data?: any) => void
  allData: any
}

export function ImportDataStep({ onNext, allData }: ImportDataStepProps) {
  const [scrapingStatus, setScrapingStatus] = useState<Record<string, string>>({})
  const [importedData, setImportedData] = useState<any[]>([])

  const connectedAccounts = allData.connect?.connectedAccounts || []

  const scrapeMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await fetch('/api/onboarding/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      })
      if (!response.ok) throw new Error('Failed to scrape')
      return response.json()
    },
    onSuccess: (data, accountId) => {
      setScrapingStatus((prev) => ({ ...prev, [accountId]: 'completed' }))
      setImportedData((prev) => [...prev, data])
    },
    onError: (_, accountId) => {
      setScrapingStatus((prev) => ({ ...prev, [accountId]: 'failed' }))
    }
  })

  useEffect(() => {
    // Auto-scrape all accounts
    connectedAccounts.forEach((account: any) => {
      setScrapingStatus((prev) => ({ ...prev, [account.id]: 'scraping' }))
      scrapeMutation.mutate(account.id)
    })
  }, [])

  const allCompleted = Object.values(scrapingStatus).every((s) => s === 'completed')
  const hasFailures = Object.values(scrapingStatus).some((s) => s === 'failed')

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-dune mb-3">Importing Your Content</h2>
        <p className="text-sage">We're gathering images and data from your connected accounts</p>
      </div>

      <div className="space-y-4">
        {connectedAccounts.map((account: any) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warm-sand flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-golden" />
                </div>
                <div>
                  <div className="font-medium text-dune">{account.displayName}</div>
                  <div className="text-sm text-sage capitalize">{scrapingStatus[account.id]}</div>
                </div>
              </div>

              {scrapingStatus[account.id] === 'scraping' && (
                <Loader2 className="w-6 h-6 animate-spin text-golden" />
              )}
              {scrapingStatus[account.id] === 'completed' && (
                <Check className="w-6 h-6 text-green-500" />
              )}
              {scrapingStatus[account.id] === 'failed' && (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <div className="bg-warm-sand rounded-2xl p-6 mb-6">
            <Check className="w-12 h-12 text-golden mx-auto mb-3" />
            <h3 className="text-xl font-medium text-dune mb-2">Import Complete!</h3>
            <p className="text-sage">
              We've imported {importedData.reduce((sum, d) => sum + (d.importedAssets?.length || 0), 0)} images
            </p>
          </div>
          <button
            onClick={() => onNext({ importedData })}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-golden text-white hover:shadow-lg transition-all"
          >
            Continue to Brand Analysis
          </button>
        </motion.div>
      )}
    </div>
  )
}

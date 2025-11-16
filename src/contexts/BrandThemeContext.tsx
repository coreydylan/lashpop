/**
 * Brand Theme Context
 *
 * Provides custom brand theming throughout the application
 * Applies colors, logo, and styling based on user's onboarding choices
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

interface BrandTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  textSecondaryColor: string
  colorPalette: Record<string, string>
  logoUrl?: string
  isActive: boolean
}

interface BrandThemeContextValue {
  theme: BrandTheme | null
  isLoading: boolean
  applyTheme: (theme: BrandTheme) => void
  resetTheme: () => void
}

const BrandThemeContext = createContext<BrandThemeContextValue | undefined>(undefined)

const DEFAULT_THEME: BrandTheme = {
  primaryColor: '#A19781',
  secondaryColor: '#CDA89E',
  accentColor: '#D4AF75',
  backgroundColor: '#FAF7F1',
  surfaceColor: '#EBE0CB',
  textColor: '#8A7C69',
  textSecondaryColor: '#A19781',
  colorPalette: {
    sage: '#A19781',
    dustyRose: '#CDA89E',
    warmSand: '#EBE0CB',
    golden: '#D4AF75',
    terracotta: '#BD8878',
    oceanMist: '#BCC9C2',
    cream: '#FAF7F1',
    dune: '#8A7C69'
  },
  isActive: false
}

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<BrandTheme>(DEFAULT_THEME)

  // Fetch user's custom theme
  const { data, isLoading } = useQuery({
    queryKey: ['brand-theme'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/onboarding/generate-theme')
        if (!response.ok) return null
        const data = await response.json()
        return data.theme
      } catch (error) {
        return null
      }
    },
    staleTime: 1000 * 60 * 60 // 1 hour
  })

  useEffect(() => {
    if (data && data.isActive) {
      applyTheme(data)
    }
  }, [data])

  const applyTheme = (newTheme: BrandTheme) => {
    setTheme(newTheme)

    // Apply CSS variables to root
    if (typeof document !== 'undefined') {
      const root = document.documentElement

      // Color variables
      root.style.setProperty('--brand-primary', newTheme.primaryColor)
      root.style.setProperty('--brand-secondary', newTheme.secondaryColor)
      root.style.setProperty('--brand-accent', newTheme.accentColor)
      root.style.setProperty('--brand-bg', newTheme.backgroundColor)
      root.style.setProperty('--brand-surface', newTheme.surfaceColor)
      root.style.setProperty('--brand-text', newTheme.textColor)
      root.style.setProperty('--brand-text-secondary', newTheme.textSecondaryColor)

      // Palette variables
      Object.entries(newTheme.colorPalette).forEach(([name, color]) => {
        root.style.setProperty(`--brand-${name}`, color)
      })
    }
  }

  const resetTheme = () => {
    setTheme(DEFAULT_THEME)
    applyTheme(DEFAULT_THEME)
  }

  return (
    <BrandThemeContext.Provider
      value={{
        theme,
        isLoading,
        applyTheme,
        resetTheme
      }}
    >
      {children}
    </BrandThemeContext.Provider>
  )
}

export function useBrandTheme() {
  const context = useContext(BrandThemeContext)
  if (context === undefined) {
    throw new Error('useBrandTheme must be used within a BrandThemeProvider')
  }
  return context
}

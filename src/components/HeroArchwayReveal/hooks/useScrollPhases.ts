/**
 * Hook to track and manage scroll phases
 */

import { useEffect, useState } from 'react'
import { MotionValue } from 'framer-motion'
import { getCurrentPhase } from '../utils'

export function useScrollPhases(scrollYProgress: MotionValue<number>) {
  const [currentPhase, setCurrentPhase] = useState<string>('hero-visible')

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      const phase = getCurrentPhase(latest)
      setCurrentPhase(phase)
    })

    return () => unsubscribe()
  }, [scrollYProgress])

  return currentPhase
}

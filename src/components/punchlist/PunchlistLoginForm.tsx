'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { toE164, formatPhoneNumber, validatePhoneNumber } from '@/lib/phone-utils'
import { getPunchlistUserByPhone, createPunchlistSession } from '@/actions/punchlist'
import { Loader2, Phone, ArrowRight, AlertCircle } from 'lucide-react'

interface PunchlistLoginFormProps {
  onSuccess: () => void
}

export function PunchlistLoginForm({ onSuccess }: PunchlistLoginFormProps) {
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    if (!validatePhoneNumber(phone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    const e164 = toE164(phone)

    setIsLoading(true)
    setError('')

    try {
      // Check if user exists
      const user = await getPunchlistUserByPhone(e164)

      if (!user) {
        setError('This phone number is not authorized for the punchlist')
        return
      }

      // Create session
      const token = await createPunchlistSession(user.id)

      if (!token) {
        setError('Failed to create session. Please try again.')
        return
      }

      onSuccess()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-dusty-rose/10 flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-dusty-rose" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Punchlist Access</h1>
        <p className="text-gray-500">Enter your phone number to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 555-5555"
              className={cn(
                'w-full px-4 py-3 text-lg rounded-xl border',
                'bg-white focus:ring-2 focus:ring-dusty-rose/20 outline-none transition-all',
                error
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-gray-200 focus:border-dusty-rose/50'
              )}
              autoFocus
              autoComplete="tel"
            />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-red-600 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={!phone || isLoading}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl',
            'bg-dusty-rose text-white font-medium text-lg',
            'hover:bg-dusty-rose/90 transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'shadow-sm hover:shadow-md'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-6">
        Only authorized team members can access the punchlist.
      </p>
    </motion.div>
  )
}

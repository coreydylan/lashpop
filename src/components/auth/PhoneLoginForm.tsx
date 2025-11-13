/**
 * Phone Login Form Component
 *
 * Handles phone number input and OTP verification
 */

'use client'

import { useState } from 'react'
import { phoneNumberAuth } from '@/lib/auth-client'
import { formatPhoneNumber, validatePhoneNumber } from '@/lib/phone-utils'

type Step = 'phone' | 'verify'

export function PhoneLoginForm() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validate phone number
      if (!validatePhoneNumber(phone)) {
        throw new Error('Please enter a valid phone number')
      }

      // Send OTP
      await phoneNumberAuth.sendOtp({
        phoneNumber: phone
      })

      setStep('verify')
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Verify OTP
      await phoneNumberAuth.verifyOtp({
        phoneNumber: phone,
        otp: code
      })

      // Success! User is now signed in
      // The page will automatically update via useSession
      window.location.href = '/dashboard' // or wherever you want to redirect
    } catch (err: any) {
      setError(err.message || 'Invalid verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setIsLoading(true)

    try {
      await phoneNumberAuth.sendOtp({
        phoneNumber: phone
      })

      setError('')
      alert('Code resent!')
    } catch (err: any) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'phone') {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Sign in to LashPop</h2>
        <p className="text-gray-600 mb-6">
          Enter your phone number to get started
        </p>

        <form onSubmit={handleSendOTP}>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value)
                setPhone(formatted)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !phone}
            className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send Code'}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          By continuing, you agree to receive SMS messages from LashPop.
          Standard message rates may apply.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <button
        onClick={() => setStep('phone')}
        className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
      >
        ← Change number
      </button>

      <h2 className="text-2xl font-bold mb-2">Enter verification code</h2>
      <p className="text-gray-600 mb-6">
        We sent a 6-digit code to {phone}
      </p>

      <form onSubmit={handleVerifyOTP}>
        <div className="mb-4">
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
            disabled={isLoading}
            autoFocus
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || code.length !== 6}
          className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </form>

      <button
        onClick={handleResendOTP}
        disabled={isLoading}
        className="w-full mt-4 text-sm text-pink-600 hover:text-pink-700 disabled:opacity-50"
      >
        Didn&apos;t receive a code? Resend
      </button>

      <p className="mt-4 text-xs text-gray-500 text-center">
        The code expires in 10 minutes
      </p>
    </div>
  )
}

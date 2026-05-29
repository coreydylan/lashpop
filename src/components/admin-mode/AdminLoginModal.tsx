'use client'

/**
 * Inline admin login — a phone-OTP modal shown in place when someone tries to
 * enter admin mode without a valid session, instead of bouncing to /dam/login.
 * Reuses the existing OTP endpoints; on success the verify route sets the
 * auth_token cookie and we call onSuccess() so the provider re-checks the session.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { toE164 } from '@/lib/phone-utils'
import { ADMIN, AdminIcons } from './adminTokens'

export function AdminLoginModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const Spinner = AdminIcons.spinner

  const sendOtp = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: toE164(phone) }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) setStep('otp')
      else setError(data?.error || 'Couldn’t send the code. Check the number and try again.')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: toE164(phone), otp }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok) onSuccess()
      else setError(data?.error || 'That code didn’t match. Try again.')
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-[min(92vw,380px)] rounded-2xl bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Admin sign in"
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full" style={{ background: ADMIN.accent }}>
            <AdminIcons.editText className="h-3.5 w-3.5 text-white" />
          </span>
          <h2 className="font-serif text-xl text-stone-900">Admin sign in</h2>
        </div>
        <p className="mb-4 text-sm text-stone-500">
          {step === 'phone'
            ? 'Enter your phone number to edit this page.'
            : `We texted a code to ${phone}.`}
        </p>

        {step === 'phone' ? (
          <input
            autoFocus
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && phone && sendOtp()}
            placeholder="(760) 555‑0199"
            className="w-full rounded-lg border border-stone-300 px-3 py-3 text-base text-stone-900 outline-none focus-visible:ring-2 focus-visible:ring-[#C9A9A6]"
          />
        ) : (
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && otp && verifyOtp()}
            placeholder="6‑digit code"
            className="w-full rounded-lg border border-stone-300 px-3 py-3 text-center text-lg tracking-[0.3em] text-stone-900 outline-none focus-visible:ring-2 focus-visible:ring-[#C9A9A6]"
          />
        )}

        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled={loading || (step === 'phone' ? !phone : !otp)}
            onClick={step === 'phone' ? sendOtp : verifyOtp}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: ADMIN.ink }}
          >
            {loading ? <Spinner className="h-4 w-4 animate-spin" /> : null}
            {step === 'phone' ? 'Send code' : 'Sign in'}
          </button>
          <button
            type="button"
            onClick={step === 'otp' ? () => { setStep('phone'); setOtp(''); setError(null) } : onClose}
            className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-stone-500 hover:bg-stone-100"
          >
            {step === 'otp' ? 'Back' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

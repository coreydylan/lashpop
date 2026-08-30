"use client"

import { useState, FormEvent } from "react"
import { ArrowRight, Phone, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { toE164 } from "@/lib/phone-utils"

export default function AdminLogin() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formattedPhone = toE164(phoneNumber)

      const response = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: formattedPhone }),
      })

      const data = await response.json()

      if (response.ok) {
        setStep("otp")
      } else {
        setError(data.error || "Failed to send verification code")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formattedPhone = toE164(phoneNumber)

      const response = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: formattedPhone, otp }),
      })

      const data = await response.json()

      if (response.ok) {
        const requestedPath = new URLSearchParams(window.location.search).get("next")
        const destination =
          requestedPath?.startsWith("/admin")
          && !requestedPath.startsWith("//")
          && !requestedPath.startsWith("/admin/login")
            ? requestedPath
            : "/admin"

        // Cross a document boundary after the auth cookie is written. This
        // avoids reusing a stale unauthenticated RSC tree and returns the admin
        // to the panel they originally tried to open.
        window.location.assign(destination)
      } else {
        setError(data.error || "Invalid verification code")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login min-h-[100dvh] bg-[#f6f2ec] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-[#292a27] sm:grid sm:place-items-center sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center sm:min-h-0 sm:w-full"
      >
        <header className="border-b border-black/[0.09] pb-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#292a27] font-serif text-xs tracking-[0.09em] text-[#fbf8f3]">LP</span>
            <div>
              <p className="font-serif text-xl leading-none">LashPop</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/42">Studio desk</p>
            </div>
          </div>
          <h1 className="mt-9 font-serif text-[2.15rem] leading-[1.02] tracking-[-0.02em] sm:text-4xl">Sign in to manage the studio.</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-black/55">Use the phone number connected to your LashPop admin access.</p>
        </header>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7"
          onSubmit={step === "phone" ? handleSendOTP : handleVerifyOTP}
        >
          <div className="rounded-2xl border border-black/[0.1] bg-[#fbf8f3] p-5 shadow-[0_16px_44px_rgba(49,39,32,0.08)] sm:p-7">
            <div className="space-y-5">
              {step === "phone" ? (
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-semibold text-[#292a27] mb-2">
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#a84f35]" strokeWidth={1.7} />
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      required
                      className="appearance-none relative block min-h-12 w-full rounded-xl border border-black/15 bg-white pl-12 pr-4 text-[#292a27] placeholder:text-black/35 focus:outline-none focus:ring-2 focus:ring-[#c96f50]/60 focus:border-[#c96f50] transition-colors"
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-[#292a27] mb-2">
                    Verification code
                  </label>
                  <div className="relative">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                      className="appearance-none relative block min-h-14 w-full rounded-xl border border-black/15 bg-white px-4 text-center font-mono text-2xl tracking-[0.38em] text-[#292a27] placeholder:text-black/25 focus:outline-none focus:ring-2 focus:ring-[#c96f50]/60 focus:border-[#c96f50] transition-colors"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-center text-black/52">
                    Sent to {phoneNumber}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone")
                      setOtp("")
                      setError("")
                    }}
                    className="mt-2 min-h-11 w-full text-center text-xs font-semibold text-[#a84f35] hover:text-[#7f3927] transition-colors"
                  >
                    Change number
                  </button>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-[#a84f35]/25 bg-[#a84f35]/[0.08] p-4"
                >
                  <p className="text-sm text-[#8f402b]">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#292a27] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(31,27,23,0.15)] transition-colors hover:bg-[#3a3530] focus:outline-none focus:ring-2 focus:ring-[#c96f50] focus:ring-offset-2 focus:ring-offset-[#fbf8f3] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="size-5 rounded-full border-2 border-white/30 border-t-white"
                    />
                    <span>{step === "phone" ? "Sending…" : "Verifying…"}</span>
                  </>
                ) : (
                  <>
                    {step === "phone" ? <Phone className="size-4" /> : <ArrowRight className="size-4" />}
                    <span>{step === "phone" ? "Send code" : "Verify and enter"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </motion.form>
        <p className="mt-5 flex items-center gap-2 text-xs leading-5 text-black/42"><ShieldCheck className="size-4 shrink-0 text-[#a84f35]" /> Private access for the LashPop team.</p>
      </motion.div>
    </main>
  )
}

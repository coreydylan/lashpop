"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Phone, Image as ImageIcon } from "lucide-react"
import { motion } from "framer-motion"
import { toE164 } from "@/lib/phone-utils"

export default function DAMLogin() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        // Redirect to DAM
        router.push("/dam")
        router.refresh()
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-warm-sand to-dusty-rose/30 px-4 overflow-hidden relative">
      {/* Floating decorative elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 right-20 w-32 h-32 rounded-full bg-sage/20 blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -5, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-20 left-20 w-40 h-40 rounded-full bg-dusty-rose/20 blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, -15, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
        className="absolute top-1/3 left-1/4 w-24 h-24 rounded-full bg-golden/20 blur-2xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center"
        >
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-br from-dusty-rose/30 to-terracotta/30 backdrop-blur-sm border border-dusty-rose/20 mb-6">
            <ImageIcon className="h-10 w-10 text-terracotta" strokeWidth={1.5} />
          </div>
          <h2 className="h2 text-dune">
            Digital Asset Manager
          </h2>
          <p className="mt-3 caption text-golden">
            LashPop Studios
          </p>
          <p className="mt-2 body text-dune/60">
            Sign in with your phone number
          </p>
        </motion.div>

        {/* Form Section */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-8 space-y-6"
          onSubmit={step === "phone" ? handleSendOTP : handleVerifyOTP}
        >
          <div className="glass border border-sage/20 rounded-3xl p-8 shadow-xl">
            <div className="space-y-5">
              {step === "phone" ? (
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-light text-dune/80 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sage" strokeWidth={1.5} />
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      required
                      className="appearance-none relative block w-full pl-12 pr-4 py-3.5 border border-sage/30 placeholder-dune/40 text-dune bg-cream/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-dusty-rose/50 focus:border-dusty-rose transition-all"
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="otp" className="block text-sm font-light text-dune/80 mb-2">
                    Verification Code
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
                      className="appearance-none relative block w-full px-4 py-3.5 border border-sage/30 placeholder-dune/40 text-dune bg-cream/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-dusty-rose/50 focus:border-dusty-rose transition-all text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-center text-dune/60">
                    Sent to {phoneNumber}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone")
                      setOtp("")
                      setError("")
                    }}
                    className="mt-2 text-xs text-center w-full text-dusty-rose hover:text-terracotta transition-colors"
                  >
                    Change number
                  </button>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-terracotta/10 border border-terracotta/30 p-4"
                >
                  <p className="text-sm text-terracotta font-light">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-6 border border-transparent font-light rounded-full text-cream bg-gradient-to-r from-dusty-rose to-terracotta hover:from-terracotta hover:to-dusty-rose focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dusty-rose disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full"
                    />
                    <span className="caption">{step === "phone" ? "Sending..." : "Verifying..."}</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    <span className="caption">{step === "phone" ? "Send Code" : "Verify & Access"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-dune/40 font-light">
            Secure phone authentication for LashPop Studios team
          </p>
        </motion.form>
      </motion.div>
    </div>
  )
}

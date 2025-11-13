"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Lock, Image as ImageIcon } from "lucide-react"
import { motion } from "framer-motion"

export default function DAMLogin() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/dam/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to DAM
        router.push("/dam")
        router.refresh()
      } else {
        setError(data.error || "Invalid password")
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
            Enter password to access your media library
          </p>
        </motion.div>

        {/* Form Section */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="glass border border-sage/20 rounded-3xl p-8 shadow-xl">
            <div className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-light text-dune/80 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sage" strokeWidth={1.5} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none relative block w-full pl-12 pr-4 py-3.5 border border-sage/30 placeholder-dune/40 text-dune bg-cream/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-dusty-rose/50 focus:border-dusty-rose transition-all"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

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
                    <span className="caption">Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span className="caption">Access DAM</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-dune/40 font-light">
            Secure access to LashPop Studios media assets
          </p>
        </motion.form>
      </motion.div>
    </div>
  )
}

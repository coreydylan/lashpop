'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import { useAskLashpop } from '@/contexts/AskLashpopContext'

export function ContactForm() {
  const { state, goBackToChat, updateFormField, submitForm } = useAskLashpop()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = state.activeForm
  if (!form) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await submitForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = form.fields
    .filter((f) => f.required)
    .every((f) => state.formData[f.name]?.trim())

  // Form type specific headers
  const formHeaders: Record<string, { title: string; subtitle: string }> = {
    contact: {
      title: 'Get in Touch',
      subtitle: "We'll get back to you within 24 hours",
    },
    bridal: {
      title: 'Bridal Inquiry',
      subtitle: "Let's plan your perfect wedding look",
    },
    complaint: {
      title: 'We Want to Make It Right',
      subtitle: 'Tell us what happened',
    },
    callback: {
      title: 'Request a Callback',
      subtitle: "We'll call you back soon",
    },
  }

  const header = formHeaders[form.formType] || formHeaders.contact

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-sage/10 bg-white/80 backdrop-blur-sm">
        <motion.button
          onClick={goBackToChat}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 -ml-2 rounded-full hover:bg-sage/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-dune" />
        </motion.button>
        <div className="flex-1">
          <h3 className="font-medium text-dune">{header.title}</h3>
          <p className="text-xs text-dune/60">{header.subtitle}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {form.fields.map((field, index) => (
          <motion.div
            key={field.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <label className="block text-sm font-medium text-dune mb-1.5">
              {field.label}
              {field.required && <span className="text-dusty-rose ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={state.formData[field.name] || ''}
                onChange={(e) => updateFormField(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white border border-sage/20
                           text-dune placeholder:text-dune/40 text-sm
                           focus:outline-none focus:border-dusty-rose/50 focus:ring-2 focus:ring-dusty-rose/20
                           transition-all resize-none"
              />
            ) : (
              <input
                type={field.type}
                value={state.formData[field.name] || ''}
                onChange={(e) => updateFormField(field.name, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-4 py-3 rounded-xl bg-white border border-sage/20
                           text-dune placeholder:text-dune/40 text-sm
                           focus:outline-none focus:border-dusty-rose/50 focus:ring-2 focus:ring-dusty-rose/20
                           transition-all"
              />
            )}
          </motion.div>
        ))}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!isValid || isSubmitting}
          whileHover={{ scale: isValid && !isSubmitting ? 1.02 : 1 }}
          whileTap={{ scale: isValid && !isSubmitting ? 0.98 : 1 }}
          className="w-full mt-6 py-3 px-6 rounded-full bg-dusty-rose text-white font-medium
                     flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-terracotta transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send to Lashpop</span>
            </>
          )}
        </motion.button>
      </form>
    </div>
  )
}

"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Code, Eye, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function FounderLetterEditor() {
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview')

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage/30 to-sage/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-sage" />
            </div>
            <div>
              <h1 className="h2 text-dune">Founder Letter</h1>
              <p className="text-sm text-dune/60">Emily&apos;s welcome message section</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                viewMode === 'preview'
                  ? 'bg-sage/20 text-dune border border-sage/30'
                  : 'bg-cream/50 text-dune/60 border border-sage/10 hover:border-sage/20'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('source')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                viewMode === 'source'
                  ? 'bg-sage/20 text-dune border border-sage/30'
                  : 'bg-cream/50 text-dune/60 border border-sage/10 hover:border-sage/20'
              }`}
            >
              <Code className="w-4 h-4" />
              Source
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="glass rounded-3xl p-6 border border-sage/20">
          {viewMode === 'preview' ? (
            <div className="prose prose-dune max-w-none">
              {/* Preview of the founder letter section */}
              <div className="bg-warm-sand/30 rounded-2xl p-8 md:p-12">
                <div className="max-w-2xl mx-auto text-center">
                  <p className="text-xs uppercase tracking-[0.25em] text-dune/50 mb-6">
                    A Letter from Our Founder
                  </p>
                  
                  <div className="relative mb-8">
                    <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-cream shadow-xl">
                      <div className="w-full h-full bg-dusty-rose/20 flex items-center justify-center">
                        <span className="text-4xl">👩</span>
                      </div>
                    </div>
                  </div>

                  <blockquote className="font-serif text-xl md:text-2xl text-dune/80 leading-relaxed italic mb-6">
                    &ldquo;Welcome to LashPop Studios — a space where beauty meets artistry, 
                    and every client leaves feeling their most confident self.&rdquo;
                  </blockquote>

                  <p className="text-dune/60 mb-6 leading-relaxed">
                    When I founded LashPop in Oceanside, my vision was simple: create a sanctuary 
                    where women could experience exceptional beauty services in a warm, welcoming 
                    environment. Today, that dream has grown into a collective of talented artists, 
                    each bringing their unique touch to help you look and feel amazing.
                  </p>

                  <div className="font-league-script text-3xl text-dusty-rose">
                    Emily
                  </div>
                  <p className="text-xs text-dune/40 mt-1">Founder, LashPop Studios</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dune/60">Component Source</span>
                <Link
                  href="/src/components/landing-v2/sections/FounderLetterSection.tsx"
                  className="text-xs text-dusty-rose hover:underline flex items-center gap-1"
                >
                  Open in Editor
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="bg-dune/5 rounded-xl p-4 font-mono text-xs text-dune/70 overflow-auto max-h-[500px]">
                <pre>{`// FounderLetterSection.tsx
// This section is currently static HTML
// To edit, modify the component directly

<section className="py-20 bg-warm-sand/30">
  <div className="container-narrow text-center">
    <p className="caption mb-6">
      A Letter from Our Founder
    </p>
    
    {/* Founder Photo */}
    <div className="w-32 h-32 mx-auto rounded-full">
      <Image src="/founder-photo.jpg" ... />
    </div>

    {/* Quote */}
    <blockquote className="font-serif text-xl">
      "Welcome to LashPop Studios..."
    </blockquote>

    {/* Message */}
    <p className="text-dune/60">
      When I founded LashPop in Oceanside...
    </p>

    {/* Signature */}
    <div className="font-league-script text-3xl">
      Emily
    </div>
  </div>
</section>`}</pre>
              </div>
              <div className="p-4 bg-sage/10 rounded-xl border border-sage/20">
                <p className="text-xs text-dune/70">
                  <strong>Note:</strong> The Founder Letter is currently static HTML. 
                  To make it editable, we can create a CMS entry or database table for this content. 
                  For now, edit the source component directly.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}


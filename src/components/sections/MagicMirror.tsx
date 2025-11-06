'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Upload, Sparkles } from 'lucide-react'

interface MagicMirrorProps {
  onStyleSelect: (styleId: string) => void
  selectedStyle: string | null
}

const lashStyleButtons = [
  { id: 'classic', label: 'Classic', emoji: '✨' },
  { id: 'hybrid', label: 'Hybrid', emoji: '💫' },
  { id: 'volume', label: 'Volume', emoji: '🌟' }
]

export function MagicMirror({ onStyleSelect, selectedStyle }: MagicMirrorProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [previewStyle, setPreviewStyle] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleStylePreview = (styleId: string) => {
    setPreviewStyle(styleId)
    onStyleSelect(styleId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-terracotta" />
          <h3 className="h3 text-dune">Try Before You Book</h3>
          <Sparkles className="w-5 h-5 text-terracotta" />
        </div>
        <p className="body text-dune/70">
          Upload a selfie and see how different lash styles would look on you
        </p>
      </motion.div>

      {/* Mirror Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass arch-full p-8 max-w-2xl mx-auto"
      >
        {/* Mirror Display */}
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-warm-sand/20 to-cream mb-6">
          {/* Base Mirror Image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/magicmirror.png"
              alt="Magic Mirror"
              fill
              className="object-contain"
            />
          </div>

          {/* Uploaded Image Overlay */}
          <AnimatePresence>
            {uploadedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={uploadedImage}
                    alt="Your photo"
                    fill
                    className="object-cover"
                  />
                  {/* Style Preview Overlay - Placeholder for AI */}
                  {previewStyle && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                      className="absolute inset-0 bg-gradient-to-b from-transparent to-sage/20"
                    >
                      <div className="absolute bottom-4 left-4 right-4 text-center">
                        <p className="text-white text-sm font-medium bg-black/40 rounded-full py-2 px-4 backdrop-blur-sm">
                          {previewStyle.charAt(0).toUpperCase() + previewStyle.slice(1)} Preview
                          <span className="block text-xs opacity-80 mt-1">
                            (AI visualization coming soon)
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!uploadedImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-6xl mb-4"
                >
                  ✨
                </motion.div>
                <p className="body text-dune/60">Upload your photo to try on lashes</p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex gap-3 mb-6">
          <button
            onClick={handleUploadClick}
            className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>
          <button
            onClick={handleUploadClick}
            className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Take Selfie
          </button>
        </div>

        {/* Style Selection Buttons */}
        <AnimatePresence>
          {uploadedImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-3"
            >
              <p className="text-center text-sm text-dune/70 mb-3">
                Select a style to preview:
              </p>
              <div className="grid grid-cols-3 gap-3">
                {lashStyleButtons.map((style) => (
                  <motion.button
                    key={style.id}
                    onClick={() => handleStylePreview(style.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      px-4 py-3 rounded-full font-medium transition-all duration-300
                      ${previewStyle === style.id || selectedStyle === style.id
                        ? 'bg-gradient-to-r from-sage to-ocean-mist text-white shadow-lg'
                        : 'glass hover:bg-warm-sand/20 text-dune'
                      }
                    `}
                  >
                    <span className="flex flex-col items-center gap-1">
                      <span className="text-xl">{style.emoji}</span>
                      <span className="text-xs">{style.label}</span>
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="caption text-dune/60">
          This is a preview placeholder. AI-powered visualization coming soon!
        </p>
      </motion.div>
    </div>
  )
}

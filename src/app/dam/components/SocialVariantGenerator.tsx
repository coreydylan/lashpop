"use client"

import { useState, useMemo, useCallback } from "react"
import { X, Sparkles, Instagram, Facebook, Twitter, Linkedin, Youtube, Music, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import clsx from "clsx"
import type {
  SocialVariantGeneratorProps,
  SocialPlatform,
  CropStrategy,
  LetterboxStyle,
  GeneratedVariant,
  PLATFORM_VARIANTS,
  GenerationSettings
} from "@/types/social-variants-ui"
import {
  getPlatformLabel,
  estimateGenerationTime,
  estimateTotalSize,
  PLATFORM_VARIANTS as VARIANTS
} from "@/types/social-variants-ui"

// Platform icon mapping
const PLATFORM_ICONS: Record<SocialPlatform, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  pinterest: <Info className="w-4 h-4" />, // Using Info as placeholder for Pinterest
  tiktok: <Music className="w-4 h-4" />
}

export function SocialVariantGenerator({
  sourceAsset,
  open,
  onClose,
  onGenerate
}: SocialVariantGeneratorProps) {
  // Selection state
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(["instagram"])
  const [cropStrategy, setCropStrategy] = useState<CropStrategy>("smart-ai")
  const [letterboxStyle, setLetterboxStyle] = useState<LetterboxStyle>("blur")
  const [namingConvention, setNamingConvention] = useState<"platform-size" | "platform-name" | "custom">("platform-size")
  const [isGenerating, setIsGenerating] = useState(false)

  // Calculate total variants
  const totalVariants = useMemo(() => {
    return selectedPlatforms.reduce((total, platform) => {
      return total + (VARIANTS[platform]?.length || 0)
    }, 0)
  }, [selectedPlatforms])

  // Calculate estimates
  const estimatedTime = useMemo(() => estimateGenerationTime(totalVariants), [totalVariants])
  const estimatedSize = useMemo(() => estimateTotalSize(totalVariants), [totalVariants])

  // Toggle platform selection
  const togglePlatform = useCallback((platform: SocialPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }, [])

  // Handle generation
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)

    // Simulate variant generation
    // In real implementation, this would call the AI service
    const variants: GeneratedVariant[] = []

    for (const platform of selectedPlatforms) {
      const platformVariants = VARIANTS[platform]
      for (const variant of platformVariants) {
        variants.push({
          id: `variant-${platform}-${variant.id}-${Date.now()}`,
          sourceAssetId: sourceAsset.id,
          platform,
          variantType: variant.id,
          displayName: variant.displayName,
          width: variant.width,
          height: variant.height,
          cropData: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            scale: 1
          },
          cropStrategy,
          letterboxStyle: cropStrategy === "letterbox" ? letterboxStyle : undefined,
          status: "perfect",
          qualityScore: Math.floor(Math.random() * 20) + 80, // 80-100
          warnings: [],
          createdAt: new Date()
        })
      }
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsGenerating(false)
    onGenerate(variants)
  }, [selectedPlatforms, cropStrategy, letterboxStyle, sourceAsset, onGenerate])

  const handlePreviewFirst = useCallback(async () => {
    setIsGenerating(true)

    // Generate only first variant as preview
    const firstPlatform = selectedPlatforms[0]
    const firstVariant = VARIANTS[firstPlatform]?.[0]

    if (!firstVariant) {
      setIsGenerating(false)
      return
    }

    const previewVariant: GeneratedVariant = {
      id: `preview-${firstPlatform}-${firstVariant.id}-${Date.now()}`,
      sourceAssetId: sourceAsset.id,
      platform: firstPlatform,
      variantType: firstVariant.id,
      displayName: firstVariant.displayName,
      width: firstVariant.width,
      height: firstVariant.height,
      cropData: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        scale: 1
      },
      cropStrategy,
      letterboxStyle: cropStrategy === "letterbox" ? letterboxStyle : undefined,
      status: "perfect",
      qualityScore: 95,
      warnings: [],
      createdAt: new Date()
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsGenerating(false)
    onGenerate([previewVariant])
  }, [selectedPlatforms, cropStrategy, letterboxStyle, sourceAsset, onGenerate])

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-cream rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-sage/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dusty-rose/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-dusty-rose" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-dune">Generate Social Variants</h2>
                    <p className="text-sm text-sage">Create optimized versions for social media platforms</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-warm-sand hover:bg-sage/20 transition-colors flex items-center justify-center"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-sage" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8 space-y-8">
                {/* Source Preview */}
                <div className="flex gap-6">
                  <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-sage/20 flex-shrink-0">
                    <img
                      src={sourceAsset.filePath}
                      alt={sourceAsset.fileName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-dune">Source Image</h3>
                    <p className="text-sm text-sage">{sourceAsset.fileName}</p>
                    <p className="text-xs text-sage/70">
                      Dimensions: {sourceAsset.width} × {sourceAsset.height}px
                    </p>
                    <p className="text-sm text-dune mt-4">
                      Select the platforms and settings below to generate optimized variants for social media posting.
                    </p>
                  </div>
                </div>

                {/* Platform Selector */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dune">Select Platforms</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(VARIANTS) as SocialPlatform[]).map((platform) => {
                      const isSelected = selectedPlatforms.includes(platform)
                      const variantCount = VARIANTS[platform].length

                      return (
                        <button
                          key={platform}
                          onClick={() => togglePlatform(platform)}
                          className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                            isSelected
                              ? "bg-dusty-rose/20 border-dusty-rose text-dune"
                              : "bg-white border-sage/20 text-sage hover:border-dusty-rose/50"
                          )}
                        >
                          <div className={clsx(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isSelected ? "bg-dusty-rose text-cream" : "bg-sage/10 text-sage"
                          )}>
                            {PLATFORM_ICONS[platform]}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-sm">{getPlatformLabel(platform)}</div>
                            <div className="text-xs opacity-70">({variantCount} sizes)</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Crop Strategy */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dune">Crop Strategy</h3>
                  <div className="space-y-3">
                    {/* Smart AI Crop */}
                    <label className={clsx(
                      "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      cropStrategy === "smart-ai"
                        ? "bg-dusty-rose/20 border-dusty-rose"
                        : "bg-white border-sage/20 hover:border-dusty-rose/50"
                    )}>
                      <input
                        type="radio"
                        name="cropStrategy"
                        value="smart-ai"
                        checked={cropStrategy === "smart-ai"}
                        onChange={(e) => setCropStrategy(e.target.value as CropStrategy)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-dune">Smart AI Crop</span>
                          <span className="px-2 py-0.5 bg-dusty-rose text-cream text-xs rounded-full font-semibold">
                            Recommended
                          </span>
                        </div>
                        <p className="text-sm text-sage mt-1">
                          Automatically detects faces, logos, and important elements to create optimal crops
                        </p>
                      </div>
                    </label>

                    {/* Center Crop */}
                    <label className={clsx(
                      "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      cropStrategy === "center"
                        ? "bg-dusty-rose/20 border-dusty-rose"
                        : "bg-white border-sage/20 hover:border-dusty-rose/50"
                    )}>
                      <input
                        type="radio"
                        name="cropStrategy"
                        value="center"
                        checked={cropStrategy === "center"}
                        onChange={(e) => setCropStrategy(e.target.value as CropStrategy)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-dune">Center Crop</div>
                        <p className="text-sm text-sage mt-1">
                          Crops from the center of the image, simple and fast
                        </p>
                      </div>
                    </label>

                    {/* Intelligent Letterbox */}
                    <label className={clsx(
                      "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      cropStrategy === "letterbox"
                        ? "bg-dusty-rose/20 border-dusty-rose"
                        : "bg-white border-sage/20 hover:border-dusty-rose/50"
                    )}>
                      <input
                        type="radio"
                        name="cropStrategy"
                        value="letterbox"
                        checked={cropStrategy === "letterbox"}
                        onChange={(e) => setCropStrategy(e.target.value as CropStrategy)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="font-semibold text-dune">Intelligent Letterbox</div>
                          <p className="text-sm text-sage mt-1">
                            Fits entire image without cropping, adds borders as needed
                          </p>
                        </div>

                        {cropStrategy === "letterbox" && (
                          <div className="flex gap-2 pl-2">
                            <button
                              onClick={() => setLetterboxStyle("blur")}
                              className={clsx(
                                "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                                letterboxStyle === "blur"
                                  ? "bg-dusty-rose border-dusty-rose text-cream"
                                  : "bg-white border-sage/30 text-sage hover:border-dusty-rose/50"
                              )}
                            >
                              Blur
                            </button>
                            <button
                              onClick={() => setLetterboxStyle("solid")}
                              className={clsx(
                                "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                                letterboxStyle === "solid"
                                  ? "bg-dusty-rose border-dusty-rose text-cream"
                                  : "bg-white border-sage/30 text-sage hover:border-dusty-rose/50"
                              )}
                            >
                              Solid
                            </button>
                            <button
                              onClick={() => setLetterboxStyle("extend")}
                              className={clsx(
                                "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                                letterboxStyle === "extend"
                                  ? "bg-dusty-rose border-dusty-rose text-cream"
                                  : "bg-white border-sage/30 text-sage hover:border-dusty-rose/50"
                              )}
                            >
                              Extend
                            </button>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Naming Convention */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-dune">Naming Convention</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNamingConvention("platform-size")}
                      className={clsx(
                        "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        namingConvention === "platform-size"
                          ? "bg-dusty-rose border-dusty-rose text-cream"
                          : "bg-white border-sage/30 text-sage hover:border-dusty-rose/50"
                      )}
                    >
                      Platform + Size
                    </button>
                    <button
                      onClick={() => setNamingConvention("platform-name")}
                      className={clsx(
                        "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        namingConvention === "platform-name"
                          ? "bg-dusty-rose border-dusty-rose text-cream"
                          : "bg-white border-sage/30 text-sage hover:border-dusty-rose/50"
                      )}
                    >
                      Platform + Name
                    </button>
                  </div>
                  <p className="text-xs text-sage">
                    Example: {namingConvention === "platform-size" ? "image_instagram_1080x1080.jpg" : "image_instagram_square.jpg"}
                  </p>
                </div>

                {/* Preview Summary */}
                <div className="bg-warm-sand/50 rounded-xl p-6 border border-sage/20">
                  <h3 className="text-lg font-semibold text-dune mb-4">Generation Summary</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-dusty-rose">{totalVariants}</div>
                      <div className="text-sm text-sage mt-1">Variants</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-dusty-rose">~{estimatedTime}s</div>
                      <div className="text-sm text-sage mt-1">Est. Time</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-dusty-rose">{estimatedSize.toFixed(1)} MB</div>
                      <div className="text-sm text-sage mt-1">Est. Size</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-8 py-6 border-t border-sage/20 bg-warm-sand/30">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full text-sage hover:bg-sage/10 transition-colors font-semibold"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handlePreviewFirst}
                    disabled={isGenerating || totalVariants === 0}
                    className={clsx(
                      "px-6 py-2.5 rounded-full font-semibold transition-all border-2",
                      isGenerating || totalVariants === 0
                        ? "bg-sage/20 text-sage/50 border-sage/20 cursor-not-allowed"
                        : "bg-white text-dusty-rose border-dusty-rose hover:bg-dusty-rose hover:text-cream"
                    )}
                  >
                    Preview First
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || totalVariants === 0}
                    className={clsx(
                      "px-8 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2",
                      isGenerating || totalVariants === 0
                        ? "bg-sage/20 text-sage/50 cursor-not-allowed"
                        : "bg-dusty-rose text-cream hover:bg-dusty-rose/90 shadow-lg hover:shadow-xl"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

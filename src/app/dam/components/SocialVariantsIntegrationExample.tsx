"use client"

/**
 * Social Variants Integration Example
 *
 * This file demonstrates how to integrate all the social variant components
 * into your DAM application. It shows the complete flow from generation to
 * preview to editing.
 *
 * Components used:
 * - SocialVariantGenerator: Modal for configuring and generating variants
 * - VariantPreviewGrid: Review and approve generated variants
 * - VariantEditor: Fine-tune individual variant crops
 * - SocialVariantCard: Display variant in asset grid
 * - PhotoLightboxVariantsTab: Show variants in lightbox
 * - AssetContextMenu: Right-click menu for variant actions
 */

import { useState, useCallback } from "react"
import { SocialVariantGenerator } from "./SocialVariantGenerator"
import { VariantPreviewGrid } from "./VariantPreviewGrid"
import { VariantEditor } from "./VariantEditor"
import { PhotoLightboxVariantsTab } from "./PhotoLightboxVariantsTab"
import { AssetContextMenu, AssetCardWithVariants } from "./AssetContextMenu"
import type {
  GeneratedVariant,
  SocialVariantAsset,
  CropData
} from "@/types/social-variants-ui"

/**
 * Example: Complete Social Variants Flow
 */
export function SocialVariantsIntegrationExample() {
  // State
  const [showGenerator, setShowGenerator] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [currentVariant, setCurrentVariant] = useState<GeneratedVariant | null>(null)
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([])
  const [savedVariants, setSavedVariants] = useState<SocialVariantAsset[]>([])

  // Example source asset
  const sourceAsset = {
    id: "asset-123",
    fileName: "brand-photo.jpg",
    filePath: "/uploads/brand-photo.jpg",
    width: 2000,
    height: 1500
  }

  // Step 1: Generate variants
  const handleGenerateVariants = useCallback((variants: GeneratedVariant[]) => {
    console.log("Generated variants:", variants)
    setGeneratedVariants(variants)
    setShowGenerator(false)
    setShowPreview(true)
  }, [])

  // Step 2: Approve variants
  const handleApproveVariants = useCallback((variantIds: string[]) => {
    const approved = generatedVariants.filter(v => variantIds.includes(v.id))

    // Convert to SocialVariantAsset format
    const savedAssets: SocialVariantAsset[] = approved.map(variant => ({
      id: `saved-${variant.id}`,
      fileName: `${sourceAsset.fileName.split('.')[0]}_${variant.platform}_${variant.variantType}.jpg`,
      filePath: variant.fullUrl || variant.previewUrl || sourceAsset.filePath,
      fileType: "image" as const,
      sourceAssetId: sourceAsset.id,
      sourceAssetPath: sourceAsset.filePath,
      platform: variant.platform,
      variantType: variant.variantType,
      displayName: variant.displayName,
      width: variant.width,
      height: variant.height,
      status: variant.status,
      qualityScore: variant.qualityScore,
      createdAt: variant.createdAt,
      uploadedAt: new Date(),
      exported: false
    }))

    setSavedVariants(prev => [...prev, ...savedAssets])
    setShowPreview(false)

    console.log("Saved variants:", savedAssets)
  }, [generatedVariants, sourceAsset])

  // Step 3: Reject/regenerate variants
  const handleRejectVariants = useCallback((variantIds: string[]) => {
    console.log("Rejecting variants:", variantIds)
    // In real implementation, this would trigger regeneration
  }, [])

  // Step 4: Adjust/edit variant
  const handleAdjustVariant = useCallback((variantId: string) => {
    const variant = generatedVariants.find(v => v.id === variantId)
    if (variant) {
      setCurrentVariant(variant)
      setShowEditor(true)
    }
  }, [generatedVariants])

  // Step 5: Save edited crop
  const handleSaveCrop = useCallback((adjustedCrop: CropData) => {
    if (!currentVariant) return

    console.log("Saving adjusted crop:", adjustedCrop)

    // Update the variant with new crop data
    setGeneratedVariants(prev =>
      prev.map(v =>
        v.id === currentVariant.id
          ? { ...v, cropData: adjustedCrop }
          : v
      )
    )

    setShowEditor(false)
    setCurrentVariant(null)
  }, [currentVariant])

  return (
    <div className="p-8 space-y-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-dune mb-4">
          Social Variants Integration Example
        </h1>
        <p className="text-sage mb-8">
          This example demonstrates the complete workflow for generating, previewing,
          editing, and managing social media variants.
        </p>

        {/* Example Asset Card with Context Menu */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-dune mb-4">
            1. Asset with Context Menu
          </h2>
          <p className="text-sm text-sage mb-4">
            Right-click on the asset below to access variant generation options.
          </p>

          <div className="w-64">
            <AssetCardWithVariants
              asset={sourceAsset}
              variantCount={savedVariants.length}
              onGenerateVariants={() => setShowGenerator(true)}
              onViewVariants={() => {
                console.log("Viewing variants:", savedVariants)
              }}
            >
              <div className="aspect-square bg-warm-sand/40 rounded-3xl overflow-hidden border-2 border-sage/20 hover:border-dusty-rose/50 transition-all">
                <img
                  src={sourceAsset.filePath}
                  alt={sourceAsset.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
            </AssetCardWithVariants>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setShowGenerator(true)}
            className="px-6 py-3 rounded-full bg-dusty-rose text-cream font-semibold hover:bg-dusty-rose/90 transition-all"
          >
            Open Generator
          </button>
          <button
            onClick={() => setShowPreview(true)}
            disabled={generatedVariants.length === 0}
            className="px-6 py-3 rounded-full bg-sage text-cream font-semibold hover:bg-sage/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Open Preview ({generatedVariants.length})
          </button>
          <button
            onClick={() => {
              if (generatedVariants.length > 0) {
                setCurrentVariant(generatedVariants[0])
                setShowEditor(true)
              }
            }}
            disabled={generatedVariants.length === 0}
            className="px-6 py-3 rounded-full bg-dune text-cream font-semibold hover:bg-dune/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Open Editor
          </button>
        </div>

        {/* Saved Variants Display */}
        {savedVariants.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-dune mb-4">
              2. Saved Variants ({savedVariants.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {savedVariants.map(variant => (
                <div key={variant.id} className="text-center">
                  <div className="aspect-square bg-warm-sand/40 rounded-xl overflow-hidden mb-2">
                    <img
                      src={variant.filePath}
                      alt={variant.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs text-sage">{variant.displayName}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integration Code Examples */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-semibold text-dune">
            Integration Guide
          </h2>

          <div className="bg-warm-sand/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-dune">
              Step 1: Add to AssetGrid
            </h3>
            <pre className="text-xs bg-dune/10 p-4 rounded-lg overflow-x-auto">
              {`import { AssetContextMenu } from './AssetContextMenu'

// In your AssetCard component:
<AssetContextMenu
  assetId={asset.id}
  hasVariants={variantCount > 0}
  onGenerateVariants={() => openGenerator(asset)}
  onViewVariants={() => openVariantsView(asset)}
>
  {/* Your existing asset card */}
</AssetContextMenu>`}
            </pre>
          </div>

          <div className="bg-warm-sand/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-dune">
              Step 2: Add to PhotoLightbox
            </h3>
            <pre className="text-xs bg-dune/10 p-4 rounded-lg overflow-x-auto">
              {`import { PhotoLightboxVariantsTab } from './PhotoLightboxVariantsTab'

// In your PhotoLightbox overlay:
<PhotoLightboxVariantsTab
  sourceAssetId={currentAsset.id}
  variants={getVariantsForAsset(currentAsset.id)}
  onGenerateMore={() => openGenerator(currentAsset)}
  onExportAll={() => exportAllVariants(currentAsset.id)}
  onVariantClick={(variant) => viewVariantFullSize(variant)}
/>`}
            </pre>
          </div>

          <div className="bg-warm-sand/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-dune">
              Step 3: Handle Generation Flow
            </h3>
            <pre className="text-xs bg-dune/10 p-4 rounded-lg overflow-x-auto">
              {`// 1. Open generator
const handleGenerateClick = () => {
  setSourceAsset(selectedAsset)
  setShowGenerator(true)
}

// 2. Process generated variants
const handleGenerate = (variants) => {
  setGeneratedVariants(variants)
  setShowGenerator(false)
  setShowPreview(true)
}

// 3. Save approved variants
const handleApprove = (variantIds) => {
  const approved = variants.filter(v => variantIds.includes(v.id))
  // Save to database/storage
  saveVariants(approved)
  setShowPreview(false)
}

// 4. Edit individual variant
const handleAdjust = (variantId) => {
  const variant = variants.find(v => v.id === variantId)
  setCurrentVariant(variant)
  setShowEditor(true)
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SocialVariantGenerator
        sourceAsset={sourceAsset}
        open={showGenerator}
        onClose={() => setShowGenerator(false)}
        onGenerate={handleGenerateVariants}
      />

      {showPreview && (
        <VariantPreviewGrid
          variants={generatedVariants}
          onApprove={handleApproveVariants}
          onReject={handleRejectVariants}
          onAdjust={handleAdjustVariant}
          onClose={() => setShowPreview(false)}
        />
      )}

      {currentVariant && (
        <VariantEditor
          variant={currentVariant}
          sourceImage={sourceAsset.filePath}
          open={showEditor}
          onClose={() => {
            setShowEditor(false)
            setCurrentVariant(null)
          }}
          onSave={handleSaveCrop}
        />
      )}
    </div>
  )
}

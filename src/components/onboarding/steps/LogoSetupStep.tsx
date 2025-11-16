/**
 * Logo Setup Step - Upload or use detected logo
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Image as ImageIcon, Check } from 'lucide-react'

interface LogoSetupStepProps {
  onNext: (data?: any) => void
  allData: any
}

export function LogoSetupStep({ onNext, allData }: LogoSetupStepProps) {
  const brandData = allData.brand?.brandData
  const [selectedLogo, setSelectedLogo] = useState<string | null>(brandData?.logoUrl || null)
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setUploadedLogo(result)
        setSelectedLogo(result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif text-dune mb-3">Add Your Logo</h2>
        <p className="text-sage">Your logo will appear in the top left of the interface</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Upload option */}
        <label className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-golden">
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          <Upload className="w-12 h-12 text-golden mx-auto mb-4" />
          <h3 className="text-lg font-medium text-dune mb-2">Upload Logo</h3>
          <p className="text-sm text-sage">Click to upload your logo file</p>
        </label>

        {/* Detected logo option */}
        {brandData?.logoUrl && (
          <button
            onClick={() => setSelectedLogo(brandData.logoUrl)}
            className={`bg-white/60 backdrop-blur-sm rounded-3xl p-8 hover:shadow-lg transition-all border-2 ${
              selectedLogo === brandData.logoUrl ? 'border-golden' : 'border-transparent'
            }`}
          >
            <ImageIcon className="w-12 h-12 text-golden mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dune mb-2">Detected Logo</h3>
            <p className="text-sm text-sage">Use the logo we found</p>
          </button>
        )}
      </div>

      {/* Logo preview */}
      {selectedLogo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 text-center mb-8"
        >
          <h3 className="text-lg font-medium text-dune mb-4">Logo Preview</h3>
          <div className="bg-warm-sand rounded-2xl p-8 mb-4 inline-block">
            <img src={selectedLogo} alt="Logo" className="max-w-[200px] max-h-[100px] object-contain" />
          </div>
          <p className="text-sm text-sage">This logo will appear in your interface</p>
        </motion.div>
      )}

      <button
        onClick={() => onNext({ logoUrl: selectedLogo })}
        className="w-full px-8 py-3 rounded-full bg-gradient-to-r from-dusty-rose to-golden text-white hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Check className="w-5 h-5" />
        {selectedLogo ? 'Continue with Logo' : 'Skip for Now'}
      </button>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, Image as ImageIcon, Settings, ExternalLink, Grid3x3 } from "lucide-react"
import Image from "next/image"

interface Asset {
  id: string
  fileName: string
  filePath: string
  width: number
  height: number
  altText: string | null
  caption: string | null
}

interface GridScrollerConfig {
  damTagFilter: string
  maxImages: number
  targetRowHeight: number
  rowPadding: number
  settings: {
    enableParallax: boolean
    scrollSpeed: number
    enableLazyLoad: boolean
    containerMaxWidth: number
  }
}

export default function GridScrollerManager() {
  const [config, setConfig] = useState<GridScrollerConfig>({
    damTagFilter: "website/grid-scroller",
    maxImages: 20,
    targetRowHeight: 300,
    rowPadding: 8,
    settings: {
      enableParallax: true,
      scrollSpeed: 0.5,
      enableLazyLoad: true,
      containerMaxWidth: 1400
    }
  })

  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGridScrollerAssets()
  }, [config.damTagFilter])

  const fetchGridScrollerAssets = async () => {
    setLoading(true)
    try {
      // TODO: Fetch assets from DAM with the specified tag
      const response = await fetch(`/api/dam/assets?tag=${config.damTagFilter}`)
      const data = await response.json()

      if (response.ok) {
        setSelectedAssets(data.assets || [])
      }
    } catch (error) {
      console.error("Error fetching grid scroller assets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/landing-v2/grid-scroller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        alert("Grid scroller settings saved successfully!")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving grid scroller config:", error)
      alert("Failed to save grid scroller settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-dune">Grid Scroller Manager</h2>
          <p className="text-sm text-dune/60 mt-1">Configure the photo grid with scroll animations</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dam"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-dune/10 text-dune border border-dune/30 rounded-full hover:bg-dune/20 transition-all font-light text-sm"
          >
            <span>Open DAM</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="col-span-1 space-y-6">
          {/* DAM Configuration */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4">DAM Integration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dune/80 mb-2">
                  DAM Tag Filter
                  <span className="block text-xs text-dune/50 mt-1">
                    Images with this tag will appear in the grid
                  </span>
                </label>
                <input
                  type="text"
                  value={config.damTagFilter}
                  onChange={(e) => setConfig({ ...config, damTagFilter: e.target.value })}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all font-mono text-sm"
                  placeholder="website/grid-scroller"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span>Maximum Images</span>
                  <span className="font-mono text-xs text-dune/60">{config.maxImages}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={config.maxImages}
                  onChange={(e) => setConfig({ ...config, maxImages: Number(e.target.value) })}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Layout Settings */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4 flex items-center gap-2">
              <Grid3x3 className="w-5 h-5" />
              Layout Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span>Row Height (px)</span>
                  <span className="font-mono text-xs text-dune/60">{config.targetRowHeight}px</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="500"
                  step="10"
                  value={config.targetRowHeight}
                  onChange={(e) => setConfig({ ...config, targetRowHeight: Number(e.target.value) })}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span>Row Padding (px)</span>
                  <span className="font-mono text-xs text-dune/60">{config.rowPadding}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={config.rowPadding}
                  onChange={(e) => setConfig({ ...config, rowPadding: Number(e.target.value) })}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                  <span>Container Max Width (px)</span>
                  <span className="font-mono text-xs text-dune/60">{config.settings.containerMaxWidth}px</span>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="2000"
                  step="100"
                  value={config.settings.containerMaxWidth}
                  onChange={(e) => setConfig({
                    ...config,
                    settings: { ...config.settings, containerMaxWidth: Number(e.target.value) }
                  })}
                  className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>

          {/* Animation Settings */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Animation Settings
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-dune/80">Enable Parallax</label>
                <button
                  onClick={() => setConfig({
                    ...config,
                    settings: { ...config.settings, enableParallax: !config.settings.enableParallax }
                  })}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    config.settings.enableParallax ? "bg-ocean-mist" : "bg-dune/20"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    config.settings.enableParallax ? "left-7" : "left-1"
                  }`} />
                </button>
              </div>

              {config.settings.enableParallax && (
                <div>
                  <label className="flex items-center justify-between text-sm text-dune/80 mb-2">
                    <span>Scroll Speed</span>
                    <span className="font-mono text-xs text-dune/60">{config.settings.scrollSpeed}</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={config.settings.scrollSpeed}
                    onChange={(e) => setConfig({
                      ...config,
                      settings: { ...config.settings, scrollSpeed: Number(e.target.value) }
                    })}
                    className="w-full h-2 bg-dune/10 rounded-full appearance-none cursor-pointer slider"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-sm text-dune/80">Lazy Load Images</label>
                <button
                  onClick={() => setConfig({
                    ...config,
                    settings: { ...config.settings, enableLazyLoad: !config.settings.enableLazyLoad }
                  })}
                  className={`relative w-12 h-6 rounded-full transition-all ${
                    config.settings.enableLazyLoad ? "bg-ocean-mist" : "bg-dune/20"
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    config.settings.enableLazyLoad ? "left-7" : "left-1"
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Image Grid Column */}
        <div className="col-span-2">
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-light text-dune">Selected Images</h3>
                <p className="text-xs text-dune/60 mt-1">
                  {selectedAssets.length} image{selectedAssets.length !== 1 ? "s" : ""} tagged with "{config.damTagFilter}"
                </p>
              </div>
              <button
                onClick={fetchGridScrollerAssets}
                className="px-4 py-2 bg-dusty-rose/10 text-dusty-rose border border-dusty-rose/30 rounded-full hover:bg-dusty-rose/20 transition-all font-light text-sm"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
              </div>
            ) : selectedAssets.length === 0 ? (
              <div className="text-center py-20">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-dune/20" />
                <p className="text-dune/60 mb-2">No images found with tag "{config.damTagFilter}"</p>
                <p className="text-sm text-dune/40">
                  Add this tag to images in the DAM to display them here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {selectedAssets.slice(0, config.maxImages).map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className="relative aspect-square bg-dune/5 rounded-xl overflow-hidden border border-sage/10 hover:border-dusty-rose/30 transition-all group"
                  >
                    <Image
                      src={asset.filePath}
                      alt={asset.altText || asset.fileName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dune/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-xs text-white font-light truncate">
                          {asset.fileName}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {selectedAssets.length > config.maxImages && (
              <div className="mt-4 p-3 bg-golden/10 border border-golden/20 rounded-xl">
                <p className="text-xs text-dune/70">
                  <strong>Note:</strong> Showing {config.maxImages} of {selectedAssets.length} images.
                  Increase the "Maximum Images" setting to show more.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

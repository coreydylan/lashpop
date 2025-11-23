"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, Code, Eye, FileText, Image as ImageIcon } from "lucide-react"

interface FounderLetterContent {
  heading: string
  subheading: string
  htmlContent: string
  textContent: string
  imageUrl: string
  imageAssetId: string | null
  svgPath: string
  altText: string
}

export default function FounderLetterEditor() {
  const [content, setContent] = useState<FounderLetterContent>({
    heading: "A Letter from Our Founder",
    subheading: "Emily's Story",
    htmlContent: `<p>Welcome to Lashpop! I'm thrilled to share our story with you.</p>
<p>Our journey began with a simple vision: to create a space where beauty meets artistry, where every client feels valued and empowered.</p>
<p>Over the years, we've grown into Newport Beach's premier lash studio, but our core values remain the same - exceptional service, artistic excellence, and genuine care for every client who walks through our doors.</p>
<p>Thank you for being part of our story.</p>
<p className="mt-4 font-serif italic">— Emily</p>`,
    textContent: "",
    imageUrl: "/lashpop-images/emily-arch.png",
    imageAssetId: null,
    svgPath: "/founder-letter.svg",
    altText: "Emily, Founder of Lashpop"
  })

  const [activeTab, setActiveTab] = useState<"html" | "preview">("html")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // TODO: Fetch existing content from API
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/admin/landing-v2/founder-letter")
      if (response.ok) {
        const data = await response.json()
        if (data.content) {
          setContent(data.content)
        }
      }
    } catch (error) {
      console.error("Error fetching founder letter content:", error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/landing-v2/founder-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      })

      if (response.ok) {
        alert("Founder letter saved successfully!")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving founder letter:", error)
      alert("Failed to save founder letter")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-dune">Founder Letter Editor</h2>
          <p className="text-sm text-dune/60 mt-1">Edit the founder&apos;s message and story section</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-ocean-mist/10 text-ocean-mist border border-ocean-mist/30 rounded-full hover:bg-ocean-mist/20 transition-all font-light disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Editor */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4">Section Info</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dune/80 mb-2">Heading</label>
                <input
                  type="text"
                  value={content.heading}
                  onChange={(e) => setContent({ ...content, heading: e.target.value })}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all"
                  placeholder="A Letter from Our Founder"
                />
              </div>

              <div>
                <label className="block text-sm text-dune/80 mb-2">Subheading</label>
                <input
                  type="text"
                  value={content.subheading}
                  onChange={(e) => setContent({ ...content, subheading: e.target.value })}
                  className="w-full px-4 py-2 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all"
                  placeholder="Emily's Story"
                />
              </div>
            </div>
          </div>

          {/* HTML Content Editor */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light text-dune flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Letter Content
              </h3>

              {/* Tab Switcher */}
              <div className="flex items-center gap-1 p-1 bg-dune/10 rounded-full">
                <button
                  onClick={() => setActiveTab("html")}
                  className={`px-3 py-1.5 rounded-full text-xs font-light transition-all ${
                    activeTab === "html"
                      ? "bg-white text-dune shadow-sm"
                      : "text-dune/60 hover:text-dune"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Code className="w-3 h-3" />
                    <span>HTML</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-full text-xs font-light transition-all ${
                    activeTab === "preview"
                      ? "bg-white text-dune shadow-sm"
                      : "text-dune/60 hover:text-dune"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3 h-3" />
                    <span>Preview</span>
                  </div>
                </button>
              </div>
            </div>

            {activeTab === "html" ? (
              <div>
                <textarea
                  value={content.htmlContent}
                  onChange={(e) => setContent({ ...content, htmlContent: e.target.value })}
                  rows={16}
                  className="w-full px-4 py-3 bg-cream/50 border border-sage/20 rounded-xl focus:border-dusty-rose/40 focus:outline-none transition-all resize-none font-mono text-sm"
                  placeholder="<p>Your HTML content here...</p>"
                  spellCheck={false}
                />
                <p className="text-xs text-dune/50 mt-2">
                  You can use HTML tags and Tailwind classes for styling
                </p>
              </div>
            ) : (
              <div
                className="prose prose-sm max-w-none bg-cream/50 border border-sage/20 rounded-xl p-6 min-h-[400px]"
                dangerouslySetInnerHTML={{ __html: content.htmlContent }}
              />
            )}
          </div>
        </div>

        {/* Right Column - Media */}
        <div className="space-y-6">
          {/* Arch Image */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Arch Image
            </h3>

            <div className="relative w-full aspect-square bg-dune/5 rounded-2xl overflow-hidden mb-4">
              {content.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.imageUrl}
                  alt={content.altText}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-dune/40">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No image selected</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-dune/80 mb-2">Image URL</label>
                <input
                  type="text"
                  value={content.imageUrl}
                  onChange={(e) => setContent({ ...content, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-cream/50 border border-sage/20 rounded-lg text-sm focus:border-dusty-rose/40 focus:outline-none transition-all font-mono"
                  placeholder="/path/to/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm text-dune/80 mb-2">Alt Text</label>
                <input
                  type="text"
                  value={content.altText}
                  onChange={(e) => setContent({ ...content, altText: e.target.value })}
                  className="w-full px-3 py-2 bg-cream/50 border border-sage/20 rounded-lg text-sm focus:border-dusty-rose/40 focus:outline-none transition-all"
                  placeholder="Description for accessibility"
                />
              </div>

              <button
                onClick={() => {
                  // TODO: Open DAM picker
                  alert("DAM integration coming soon")
                }}
                className="w-full px-4 py-2 bg-dusty-rose/10 text-dusty-rose border border-dusty-rose/30 rounded-full hover:bg-dusty-rose/20 transition-all font-light text-sm"
              >
                Choose from DAM
              </button>
            </div>
          </div>

          {/* SVG Graphic */}
          <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-light text-dune mb-4">SVG Graphic</h3>

            <div className="relative w-full h-32 bg-dune/5 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
              {content.svgPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={content.svgPath}
                  alt="Founder letter graphic"
                  className="max-h-full"
                />
              ) : (
                <div className="text-center text-dune/40">
                  <FileText className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">No SVG selected</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-dune/80 mb-2">SVG Path</label>
              <input
                type="text"
                value={content.svgPath}
                onChange={(e) => setContent({ ...content, svgPath: e.target.value })}
                className="w-full px-3 py-2 bg-cream/50 border border-sage/20 rounded-lg text-sm focus:border-dusty-rose/40 focus:outline-none transition-all font-mono"
                placeholder="/founder-letter.svg"
              />
            </div>
          </div>

          {/* Preview Card */}
          <div className="glass border border-golden/20 rounded-2xl p-4 bg-golden/10">
            <p className="text-sm text-dune/70">
              <strong>Tip:</strong> Use the HTML editor to write your letter content.
              You can use basic HTML tags and Tailwind CSS classes for formatting.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

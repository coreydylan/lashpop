"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, Eye, EyeOff, GripVertical, Save } from "lucide-react"

interface Review {
  id: string
  reviewerName: string
  reviewText: string
  rating: number
  source: string
  reviewDate: Date | null
  subject: string | null
}

interface ReviewDisplay {
  id: string
  reviewId: string
  displayOrder: number
  isVisible: boolean
  isFeatured: boolean
  review?: Review
}

export default function ReviewsManager() {
  const [allReviews, setAllReviews] = useState<Review[]>([])
  const [selectedReviews, setSelectedReviews] = useState<ReviewDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const [allReviewsRes, selectedRes] = await Promise.all([
        fetch("/api/admin/landing-v2/reviews/all"),
        fetch("/api/admin/landing-v2/reviews/selected")
      ])

      if (allReviewsRes.ok && selectedRes.ok) {
        const allData = await allReviewsRes.json()
        const selectedData = await selectedRes.json()

        setAllReviews(allData.reviews || [])
        setSelectedReviews(selectedData.selectedReviews || [])
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleReviewSelection = (reviewId: string) => {
    const isSelected = selectedReviews.some(r => r.reviewId === reviewId)

    if (isSelected) {
      setSelectedReviews(selectedReviews.filter(r => r.reviewId !== reviewId))
    } else {
      const review = allReviews.find(r => r.id === reviewId)
      if (review) {
        setSelectedReviews([
          ...selectedReviews,
          {
            id: `temp-${Date.now()}`,
            reviewId,
            displayOrder: selectedReviews.length,
            isVisible: true,
            isFeatured: false,
            review
          }
        ])
      }
    }
  }

  const toggleVisibility = (displayId: string) => {
    setSelectedReviews(selectedReviews.map(r =>
      r.id === displayId ? { ...r, isVisible: !r.isVisible } : r
    ))
  }

  const toggleFeatured = (displayId: string) => {
    setSelectedReviews(selectedReviews.map(r =>
      r.id === displayId ? { ...r, isFeatured: !r.isFeatured } : r
    ))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === index) return

    const newSelectedReviews = [...selectedReviews]
    const draggedItem = newSelectedReviews[draggedIndex]
    newSelectedReviews.splice(draggedIndex, 1)
    newSelectedReviews.splice(index, 0, draggedItem)

    // Update display orders
    const reordered = newSelectedReviews.map((r, i) => ({ ...r, displayOrder: i }))
    setSelectedReviews(reordered)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/landing-v2/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedReviews })
      })

      if (response.ok) {
        alert("Review selections saved successfully!")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      console.error("Error saving review selections:", error)
      alert("Failed to save review selections")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="glass border border-sage/20 rounded-3xl p-12 shadow-xl flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-dune">Reviews Manager</h2>
          <p className="text-sm text-dune/60 mt-1">Select and order reviews for the homepage</p>
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-dune mb-1">{allReviews.length}</div>
          <div className="text-xs text-dune/60">Total Reviews</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-ocean-mist mb-1">{selectedReviews.length}</div>
          <div className="text-xs text-dune/60">Selected</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-golden mb-1">
            {selectedReviews.filter(r => r.isVisible).length}
          </div>
          <div className="text-xs text-dune/60">Visible</div>
        </div>
        <div className="glass border border-sage/20 rounded-2xl p-4 shadow-lg">
          <div className="text-2xl font-light text-terracotta mb-1">
            {selectedReviews.filter(r => r.isFeatured).length}
          </div>
          <div className="text-xs text-dune/60">Featured</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* All Reviews Column */}
        <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-light text-dune mb-4">All Reviews</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {allReviews.map((review) => {
              const isSelected = selectedReviews.some(r => r.reviewId === review.id)

              return (
                <div
                  key={review.id}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-ocean-mist/10 border-ocean-mist/30"
                      : "bg-cream/50 border-sage/10 hover:border-dusty-rose/20"
                  }`}
                  onClick={() => toggleReviewSelection(review.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-dune text-sm">{review.reviewerName}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? "fill-golden text-golden" : "text-dune/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`px-2 py-0.5 rounded-full text-xs ${
                        review.source === "google"
                          ? "bg-blue-100 text-blue-600"
                          : review.source === "yelp"
                          ? "bg-red-100 text-red-600"
                          : "bg-purple-100 text-purple-600"
                      }`}>
                        {review.source}
                      </div>
                      {isSelected && (
                        <div className="px-2 py-0.5 bg-ocean-mist/20 text-ocean-mist rounded-full text-xs font-semibold">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-dune/70 line-clamp-2">
                    {review.reviewText}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Reviews Column (Draggable) */}
        <div className="glass border border-sage/20 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-light text-dune mb-4">
            Selected for Homepage ({selectedReviews.length})
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {selectedReviews.length === 0 ? (
              <div className="text-center py-12 text-dune/60">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No reviews selected</p>
                <p className="text-xs mt-1">Click reviews from the left to add them</p>
              </div>
            ) : (
              selectedReviews
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((displayReview, index) => {
                  const review = displayReview.review || allReviews.find(r => r.id === displayReview.reviewId)
                  if (!review) return null

                  return (
                    <motion.div
                      key={displayReview.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`p-3 rounded-xl border transition-all cursor-move ${
                        !displayReview.isVisible
                          ? "bg-dune/5 border-dune/10 opacity-50"
                          : displayReview.isFeatured
                          ? "bg-golden/10 border-golden/30"
                          : "bg-cream/50 border-sage/10 hover:border-dusty-rose/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-4 h-4 text-dune/40 flex-shrink-0 mt-1 cursor-move" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-dune text-sm">{review.reviewerName}</span>
                                {displayReview.isFeatured && (
                                  <div className="px-2 py-0.5 bg-golden/30 text-golden rounded-full text-xs font-semibold uppercase tracking-wide border border-golden/40">
                                    Featured
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < review.rating ? "fill-golden text-golden" : "text-dune/20"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-xs ${
                              review.source === "google"
                                ? "bg-blue-100 text-blue-600"
                                : review.source === "yelp"
                                ? "bg-red-100 text-red-600"
                                : "bg-purple-100 text-purple-600"
                            }`}>
                              {review.source}
                            </div>
                          </div>
                          <p className="text-xs text-dune/70 line-clamp-2 mb-2">
                            {review.reviewText}
                          </p>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleVisibility(displayReview.id)
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-light transition-all ${
                                displayReview.isVisible
                                  ? "bg-ocean-mist/10 text-ocean-mist"
                                  : "bg-dune/10 text-dune/60"
                              }`}
                            >
                              {displayReview.isVisible ? (
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> Visible
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <EyeOff className="w-3 h-3" /> Hidden
                                </span>
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFeatured(displayReview.id)
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-light transition-all ${
                                displayReview.isFeatured
                                  ? "bg-golden/20 text-golden"
                                  : "bg-dune/10 text-dune/60"
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3" /> {displayReview.isFeatured ? "Featured" : "Feature"}
                              </span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleReviewSelection(review.id)
                              }}
                              className="ml-auto px-2 py-1 rounded-lg text-xs font-light bg-terracotta/10 text-terracotta hover:bg-terracotta/20 transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
            )}
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="glass border border-golden/20 rounded-2xl p-4 bg-golden/10">
        <p className="text-sm text-dune/70">
          <strong>Pro Tip:</strong> Drag reviews in the right column to reorder them.
          Featured reviews will be highlighted on the homepage. Use the visibility toggle to temporarily hide reviews without removing them from your selection.
        </p>
      </div>
    </div>
  )
}

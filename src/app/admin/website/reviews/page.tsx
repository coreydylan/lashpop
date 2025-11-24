"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, Reorder } from 'framer-motion'
import { 
  Star, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Save, 
  Check, 
  AlertCircle,
  GripVertical,
  Calendar,
  Quote,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Review {
  id: string
  source: string
  sourceUrl: string
  reviewerName: string
  subject: string | null
  reviewText: string
  rating: number
  reviewDate: string | null
  isSelected: boolean
  displayOrder: number
}

type FilterSource = 'all' | 'google' | 'yelp' | 'vagaro'

export default function ReviewsManagerPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [filterSource, setFilterSource] = useState<FilterSource>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedReview, setExpandedReview] = useState<string | null>(null)
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/website/reviews')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched reviews data:', { 
          totalReviews: data.reviews?.length, 
          selectedIds: data.selectedIds 
        })
        
        const allReviews = data.reviews || []
        const selected = data.selectedIds || []
        
        // Mark selected reviews and separate them
        const marked = allReviews.map((r: Review) => ({
          ...r,
          isSelected: selected.includes(r.id)
        }))
        
        // Separate selected and unselected
        const selectedList = marked
          .filter((r: Review) => r.isSelected)
          .sort((a: Review, b: Review) => a.displayOrder - b.displayOrder)
        const unselectedList = marked.filter((r: Review) => !r.isSelected)
        
        console.log('Processed reviews:', { 
          selected: selectedList.length, 
          unselected: unselectedList.length 
        })
        
        setSelectedReviews(selectedList)
        setReviews(unselectedList)
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch reviews:', errorData)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (review: Review) => {
    if (review.isSelected) {
      // Remove from selected
      setSelectedReviews(prev => prev.filter(r => r.id !== review.id))
      setReviews(prev => [...prev, { ...review, isSelected: false }])
    } else {
      // Add to selected
      setReviews(prev => prev.filter(r => r.id !== review.id))
      setSelectedReviews(prev => [...prev, { ...review, isSelected: true, displayOrder: prev.length }])
    }
    setHasChanges(true)
  }

  const handleReorderSelected = (newOrder: Review[]) => {
    setSelectedReviews(newOrder.map((r, i) => ({ ...r, displayOrder: i })))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const selectedIds = selectedReviews.map((r, index) => ({
        id: r.id,
        displayOrder: index
      }))

      console.log('Saving reviews:', selectedIds)

      const response = await fetch('/api/admin/website/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedReviews: selectedIds })
      })

      const data = await response.json()
      console.log('Save response:', data)

      if (response.ok && data.success) {
        setSaved(true)
        setHasChanges(false)
        setTimeout(() => setSaved(false), 2000)
      } else {
        console.error('Save failed:', data)
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving review settings:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSource = filterSource === 'all' || review.source.toLowerCase() === filterSource
    const matchesSearch = searchQuery === '' || 
      review.reviewerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.reviewText.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSource && matchesSearch
  })

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-golden fill-golden' : 'text-sage/30'}`}
        />
      ))}
    </div>
  )

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'google': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'yelp': return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'vagaro': return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
      default: return 'bg-sage/10 text-dune/60 border-sage/20'
    }
  }

  const ReviewCard = ({ review, isInSelected = false }: { review: Review, isInSelected?: boolean }) => (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Drag Handle (only for selected) */}
        {isInSelected && (
          <div className="cursor-grab active:cursor-grabbing text-dune/30 hover:text-dune/50 mt-1 touch-none">
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        {/* Order Number (only for selected) */}
        {isInSelected && (
          <div className="w-7 h-7 rounded-full bg-golden/20 flex items-center justify-center text-xs text-golden font-semibold flex-shrink-0">
            {review.displayOrder + 1}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-dune">{review.reviewerName}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full border ${getSourceColor(review.source)}`}>
              {review.source}
            </span>
            {renderStars(review.rating)}
          </div>
          
          <p className={`text-sm text-dune/70 ${expandedReview === review.id ? '' : 'line-clamp-2'}`}>
            &quot;{review.reviewText}&quot;
          </p>

          {review.reviewDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-dune/40">
              <Calendar className="w-3 h-3" />
              {new Date(review.reviewDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Expand/Collapse */}
          <button
            onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
            className="w-8 h-8 rounded-lg bg-sage/10 hover:bg-sage/20 flex items-center justify-center text-dune/50 transition-colors"
          >
            {expandedReview === review.id ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Selection Toggle */}
          <button
            onClick={() => toggleSelection(review)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              review.isSelected
                ? 'bg-golden/20 text-golden hover:bg-golden/30'
                : 'bg-sage/10 text-dune/40 hover:bg-sage/20 hover:text-dune/60'
            }`}
            title={review.isSelected ? 'Remove from homepage' : 'Add to homepage'}
          >
            {review.isSelected ? (
              <Eye className="w-5 h-5" />
            ) : (
              <EyeOff className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-golden/30 to-golden/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-golden" />
            </div>
            <div>
              <h1 className="h2 text-dune">Reviews</h1>
              <p className="text-sm text-dune/60">
                {selectedReviews.length} reviews selected for homepage
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchReviews}
              className="btn btn-secondary"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`btn ${saved ? 'btn-secondary bg-ocean-mist/20 border-ocean-mist/30' : 'btn-primary'} ${!hasChanges && !saved ? 'opacity-50' : ''}`}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : hasChanges ? 'Save Changes' : 'Saved'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-4 mb-6"
      >
        <div className="glass rounded-2xl p-4 border border-sage/20 text-center">
          <div className="text-2xl font-serif text-dune">{reviews.length + selectedReviews.length}</div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Total</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-golden/30 text-center">
          <div className="text-2xl font-serif text-golden">{selectedReviews.length}</div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Selected</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-sage/20 text-center">
          <div className="text-2xl font-serif text-dune">
            {[...reviews, ...selectedReviews].filter(r => r.rating === 5).length}
          </div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">5-Star</div>
        </div>
        <div className="glass rounded-2xl p-4 border border-sage/20 text-center">
          <div className="text-2xl font-serif text-dune">
            {new Set([...reviews, ...selectedReviews].map(r => r.source)).size}
          </div>
          <div className="text-xs text-dune/50 uppercase tracking-wider">Sources</div>
        </div>
      </motion.div>

      {/* Selected Reviews - Reorderable */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg text-dune flex items-center gap-2">
            <Quote className="w-5 h-5 text-golden" />
            Homepage Reviews
          </h2>
          <span className="text-xs text-dune/50">Drag to reorder</span>
        </div>
        
        <div className="glass rounded-3xl border border-golden/20 overflow-hidden">
          {selectedReviews.length === 0 ? (
            <div className="p-8 text-center">
              <Star className="w-10 h-10 text-dune/20 mx-auto mb-3" />
              <p className="text-dune/50 text-sm">No reviews selected yet</p>
              <p className="text-dune/40 text-xs mt-1">Click the eye icon on reviews below to add them</p>
            </div>
          ) : (
            <Reorder.Group 
              axis="y" 
              values={selectedReviews} 
              onReorder={handleReorderSelected}
              className="divide-y divide-golden/10"
            >
              {selectedReviews.map((review) => (
                <Reorder.Item
                  key={review.id}
                  value={review}
                  className="bg-golden/5 hover:bg-golden/10 transition-colors"
                >
                  <ReviewCard review={review} isInSelected />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      </motion.div>

      {/* All Reviews */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h2 className="font-serif text-lg text-dune">All Reviews</h2>
          
          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dune/40" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-cream/50 border border-sage/20 rounded-xl text-sm focus:outline-none focus:border-dusty-rose/50 w-40"
              />
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1 bg-cream/50 border border-sage/20 rounded-xl p-1">
              <Filter className="w-4 h-4 text-dune/40 ml-2" />
              {(['all', 'google', 'yelp', 'vagaro'] as FilterSource[]).map((source) => (
                <button
                  key={source}
                  onClick={() => setFilterSource(source)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterSource === source
                      ? 'bg-white shadow-sm text-dune'
                      : 'text-dune/50 hover:text-dune'
                  }`}
                >
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="glass rounded-3xl border border-sage/20 overflow-hidden">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-10 h-10 text-dune/20 mx-auto mb-3" />
              <p className="text-dune/50 text-sm">No reviews found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-dusty-rose text-xs mt-2 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-sage/10">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-cream/30 hover:bg-cream/50 transition-colors">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredReviews.length > 0 && (
          <p className="text-xs text-dune/40 mt-3 text-center">
            Showing {filteredReviews.length} of {reviews.length} unselected reviews
          </p>
        )}
      </motion.div>
    </div>
  )
}


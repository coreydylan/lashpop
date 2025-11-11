'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { StarIcon, MoonIcon, SunIcon, WaveIcon } from '../icons/DesertIcons'
import { ChevronDown } from 'lucide-react'

interface Service {
  id: string
  mainCategory: string
  subCategory: string
  title: string
  subtitle: string
  description: string
  duration: string
  price: string
  image: string
  color: string
  displayOrder: number
}

interface ServicesSectionClientProps {
  services: Service[]
  mainCategories: string[]
}

const getIconForService = (id: string) => {
  // Support base slug and variations (e.g., classic, classic-fill, classic-mini)
  if (id.startsWith('classic')) return <MoonIcon className="w-8 h-8" />
  if (id.startsWith('angel') || id.startsWith('wet')) return <WaveIcon className="w-8 h-8" />
  if (id.startsWith('hybrid')) return <StarIcon className="w-8 h-8" />
  if (id.startsWith('volume')) return <SunIcon className="w-8 h-8" />
  if (id === 'lift') return <WaveIcon className="w-8 h-8" />
  return <StarIcon className="w-8 h-8" />
}

export function ServicesSectionClient({ services, mainCategories }: ServicesSectionClientProps) {
  const [hoveredService, setHoveredService] = useState<string | null>(null)
  const [selectedMainCategories, setSelectedMainCategories] = useState<Set<string>>(new Set())
  const [selectedSubCategories, setSelectedSubCategories] = useState<Set<string>>(new Set())
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedService, setHighlightedService] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  // Get available subcategories based on selected main categories
  const availableSubCategories = useMemo(() => {
    if (selectedMainCategories.size === 0) return []

    const subCats = new Set<string>()
    services.forEach(service => {
      if (selectedMainCategories.has(service.mainCategory) && service.subCategory) {
        subCats.add(service.subCategory)
      }
    })
    return Array.from(subCats)
  }, [services, selectedMainCategories])

  // Filter services based on selected categories
  const filteredServices = useMemo(() => {
    if (selectedMainCategories.size === 0 && selectedSubCategories.size === 0) {
      return services
    }

    return services.filter(service => {
      const mainCategoryMatch = selectedMainCategories.size === 0 || selectedMainCategories.has(service.mainCategory)
      const subCategoryMatch = selectedSubCategories.size === 0 || selectedSubCategories.has(service.subCategory)
      return mainCategoryMatch && subCategoryMatch
    })
  }, [services, selectedMainCategories, selectedSubCategories])

  // Group services by main category and subcategory
  const groupedServices = useMemo(() => {
    const groups: Record<string, Record<string, Service[]>> = {}

    filteredServices.forEach(service => {
      if (!groups[service.mainCategory]) {
        groups[service.mainCategory] = {}
      }
      const subCat = service.subCategory || 'Other'
      if (!groups[service.mainCategory][subCat]) {
        groups[service.mainCategory][subCat] = []
      }
      groups[service.mainCategory][subCat].push(service)
    })

    // Sort services within each group by displayOrder
    Object.values(groups).forEach(subGroups => {
      Object.values(subGroups).forEach(serviceList => {
        serviceList.sort((a, b) => a.displayOrder - b.displayOrder)
      })
    })

    return groups
  }, [filteredServices])

  // Listen for quiz completion events
  useEffect(() => {
    const handleQuizComplete = (event: CustomEvent) => {
      const { selectedCategories, lashStyle } = event.detail

      // Set selected main categories based on quiz results
      if (selectedCategories && selectedCategories.length > 0) {
        setSelectedMainCategories(new Set(selectedCategories))
      }

      // Highlight the recommended lash style if one was selected
      if (lashStyle) {
        setHighlightedService(lashStyle)

        // Auto-scroll to the highlighted service after a short delay
        setTimeout(() => {
          const element = document.getElementById(`service-${lashStyle}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 500)
      }
    }

    window.addEventListener('quiz-complete', handleQuizComplete as EventListener)
    return () => {
      window.removeEventListener('quiz-complete', handleQuizComplete as EventListener)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const toggleMainCategory = (category: string) => {
    const newSet = new Set(selectedMainCategories)
    if (newSet.has(category)) {
      newSet.delete(category)
      // Clear subcategories when main category is deselected
      const subCatsToRemove = services
        .filter(s => s.mainCategory === category && s.subCategory)
        .map(s => s.subCategory)
      const newSubSet = new Set(selectedSubCategories)
      subCatsToRemove.forEach(subCat => newSubSet.delete(subCat))
      setSelectedSubCategories(newSubSet)
    } else {
      newSet.add(category)
    }
    setSelectedMainCategories(newSet)
  }

  const toggleSubCategory = (category: string) => {
    const newSet = new Set(selectedSubCategories)
    if (newSet.has(category)) {
      newSet.delete(category)
    } else {
      newSet.add(category)
    }
    setSelectedSubCategories(newSet)
  }

  const toggleDescription = (serviceId: string) => {
    const newSet = new Set(expandedDescriptions)
    if (newSet.has(serviceId)) {
      newSet.delete(serviceId)
    } else {
      newSet.add(serviceId)
    }
    setExpandedDescriptions(newSet)
  }

  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (description.length <= maxLength) return description
    return description.slice(0, maxLength).trim() + '...'
  }

  const clearAllFilters = () => {
    setSelectedMainCategories(new Set())
    setSelectedSubCategories(new Set())
  }

  return (
    <section className="relative py-[var(--space-xl)] bg-gradient-to-b from-transparent via-warm-sand/5 to-cream">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-md)]"
        >
          <h2 className="h2 text-dune mb-4">Our Services</h2>
          <p className="body-lg text-dune/70 max-w-2xl mx-auto">
            Enhance your natural beauty with our premium lash and beauty services
          </p>
        </motion.div>

        {/* Filter Dropdown */}
        <div className="flex justify-center mb-8">
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-2 text-dune font-medium"
            >
              <span>Filter Services</span>
              {selectedMainCategories.size > 0 && (
                <span className="px-2 py-1 bg-sage/20 rounded-full text-xs">
                  {selectedMainCategories.size + selectedSubCategories.size}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </motion.button>

            {/* Dropdown Content */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[400px] max-h-[500px] overflow-y-auto bg-white rounded-2xl shadow-xl p-6 z-50"
                >
                  {/* Main Categories */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-dune/60 uppercase tracking-wide mb-3">
                      Main Categories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {mainCategories.map(category => (
                        <button
                          key={category}
                          onClick={() => toggleMainCategory(category)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedMainCategories.has(category)
                              ? 'bg-sage text-white'
                              : 'bg-sage/10 text-dune hover:bg-sage/20'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subcategories (if main categories selected) */}
                  {availableSubCategories.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-dune/60 uppercase tracking-wide mb-3">
                        Subcategories
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {availableSubCategories.map(category => (
                          <button
                            key={category}
                            onClick={() => toggleSubCategory(category)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              selectedSubCategories.has(category)
                                ? 'bg-terracotta text-white'
                                : 'bg-terracotta/10 text-dune hover:bg-terracotta/20'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-sage/10">
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-dune/60 hover:text-dune transition-colors"
                    >
                      Clear all
                    </button>
                    <div className="text-sm text-dune/60">
                      {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Service Cards Display */}
        <div ref={cardsRef} className="space-y-16">
          {Object.entries(groupedServices).map(([mainCategory, subGroups]) => (
            <div key={mainCategory}>
              {/* Main Category Header */}
              {(selectedMainCategories.size === 0 || selectedMainCategories.size > 1) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-8"
                >
                  <h3 className="h3 text-dune mb-2">{mainCategory}</h3>
                  <div className="w-24 h-1 bg-gradient-to-r from-sage to-ocean-mist mx-auto rounded-full" />
                </motion.div>
              )}

              {/* Subcategory Groups */}
              {Object.entries(subGroups).map(([subCategory, categoryServices]) => (
                <div key={`${mainCategory}-${subCategory}`} className="mb-12 last:mb-0">
                  {/* Subcategory Header */}
                  {subCategory !== 'Other' && selectedSubCategories.size === 0 && (
                    <h4 className="text-xl font-light text-terracotta text-center mb-6">
                      {subCategory}
                    </h4>
                  )}

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryServices.map((service, index) => (
                      <motion.div
                        key={service.id}
                        id={`service-${service.id}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        onMouseEnter={() => setHoveredService(service.id)}
                        onMouseLeave={() => setHoveredService(null)}
                        className={`group relative ${
                          highlightedService === service.id
                            ? 'ring-2 ring-terracotta ring-offset-2'
                            : ''
                        }`}
                      >
                        <div className="bg-white rounded-2xl p-6 h-full flex flex-col shadow-md hover:shadow-xl transition-all duration-300">
                          {/* Icon */}
                          <motion.div
                            animate={{
                              scale: hoveredService === service.id ? 1.1 : 1,
                              rotate: hoveredService === service.id ? 360 : 0
                            }}
                            transition={{ duration: 0.5 }}
                            className={`text-${service.color} mb-3`}
                          >
                            {getIconForService(service.id)}
                          </motion.div>

                          {/* Content */}
                          <h3 className="text-lg font-medium text-dune mb-1">{service.title}</h3>
                          {service.subtitle && (
                            <p className="text-xs text-terracotta mb-3">{service.subtitle}</p>
                          )}

                          {/* Description */}
                          <div className="text-sm text-dune/70 mb-4 flex-grow">
                            <p>
                              {expandedDescriptions.has(service.id)
                                ? service.description
                                : truncateDescription(service.description)
                              }
                            </p>
                            {service.description.length > 150 && (
                              <button
                                onClick={() => toggleDescription(service.id)}
                                className="text-sage hover:text-ocean-mist text-xs font-medium mt-2 transition-colors"
                              >
                                {expandedDescriptions.has(service.id) ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </div>

                          {/* Details */}
                          <div className="space-y-2 pt-4 border-t border-sage/10">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-dune/60">Duration</span>
                              <span className="text-sm font-light">{service.duration}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-dune/60">Starting at</span>
                              <span className="text-lg font-light text-terracotta">{service.price}</span>
                            </div>
                          </div>

                          {/* Hidden image on hover (if available) */}
                          {service.image && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{
                                opacity: hoveredService === service.id ? 1 : 0
                              }}
                              transition={{ duration: 0.3 }}
                              className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                            >
                              <Image
                                src={service.image}
                                alt={service.title}
                                fill
                                className="object-cover opacity-10"
                              />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-[var(--space-lg)]"
        >
          <p className="body-lg text-dune/70 mb-6">
            Ready to enhance your natural beauty?
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary"
          >
            Book Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

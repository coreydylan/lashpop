'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { StarIcon, MoonIcon, SunIcon, WaveIcon } from '../icons/DesertIcons'
import { X } from 'lucide-react'

interface Service {
  id: string
  category: string
  title: string
  subtitle: string
  description: string
  duration: string
  price: string
  image: string
  color: string
}

interface ServicesSectionClientProps {
  services: Service[]
}

const getIconForService = (id: string) => {
  switch(id) {
    case 'classic': return <MoonIcon className="w-8 h-8" />
    case 'hybrid': return <StarIcon className="w-8 h-8" />
    case 'volume': return <SunIcon className="w-8 h-8" />
    case 'lift': return <WaveIcon className="w-8 h-8" />
    default: return <StarIcon className="w-8 h-8" />
  }
}

export function ServicesSectionClient({ services }: ServicesSectionClientProps) {
  const [hoveredService, setHoveredService] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [highlightedService, setHighlightedService] = useState<string | null>(null)

  // Listen for quiz completion events
  useEffect(() => {
    const handleQuizComplete = (event: CustomEvent) => {
      const { selectedCategories, lashStyle } = event.detail

      // Set active filters based on selected categories
      setActiveFilters(selectedCategories)

      // Highlight the recommended lash style if one was selected
      if (lashStyle) {
        setHighlightedService(lashStyle)
      }
    }

    window.addEventListener('service-quiz-complete', handleQuizComplete as EventListener)
    return () => {
      window.removeEventListener('service-quiz-complete', handleQuizComplete as EventListener)
    }
  }, [])

  // Filter services based on active filters
  const filteredServices = activeFilters.length > 0
    ? services.filter(service => activeFilters.includes(service.category))
    : services

  const toggleFilter = (category: string) => {
    setActiveFilters(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const clearFilters = () => {
    setActiveFilters([])
    setHighlightedService(null)
  }

  return (
    <section className="relative pt-0 pb-[var(--space-xl)] bg-gradient-to-b from-transparent via-warm-sand/5 to-cream">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-[var(--space-lg)]"
        >
          <span className="caption text-terracotta">What We Offer</span>
          <h2 className="h2 text-dune mt-2">
            Our Services
          </h2>
          {highlightedService && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="body text-dune/70 mt-4"
            >
              Based on your preferences, we recommend <strong className="text-terracotta">{highlightedService}</strong> lashes
            </motion.p>
          )}
        </motion.div>

        {/* Filter Chips */}
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 justify-center mb-8"
          >
            {activeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className="flex items-center gap-2 px-4 py-2 bg-sage/20 text-sage rounded-full text-sm font-medium hover:bg-sage/30 transition-colors"
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-dune/60 hover:text-dune text-sm font-medium transition-colors"
            >
              Clear all
            </button>
          </motion.div>
        )}

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredServices.map((service, index) => {
            const isHighlighted = highlightedService === service.id
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredService(service.id)}
                onMouseLeave={() => setHoveredService(null)}
                className="group relative"
              >
                <div className="relative h-full">
                  {/* Highlighted Badge */}
                  {isHighlighted && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10 px-4 py-1 bg-gradient-to-r from-sage to-ocean-mist text-white text-xs font-medium rounded-full shadow-lg"
                    >
                      ✨ Recommended for You
                    </motion.div>
                  )}

                  {/* Card */}
                  <div className={`
                    bg-cream arch-full p-8 h-full flex flex-col items-center text-center transition-all duration-500 hover:shadow-xl
                    ${isHighlighted ? 'ring-2 ring-sage shadow-xl' : ''}
                  `}>
                  {/* Icon */}
                  <motion.div
                    animate={{
                      scale: hoveredService === service.id ? 1.1 : 1,
                      rotate: hoveredService === service.id ? 360 : 0
                    }}
                    transition={{ duration: 0.5 }}
                    className={`text-${service.color} mb-4`}
                  >
                    {getIconForService(service.id)}
                  </motion.div>
                  
                  {/* Content */}
                  <h3 className="h3 text-dune mb-2">{service.title}</h3>
                  <p className="caption text-terracotta mb-4">{service.subtitle}</p>
                  <p className="body text-dune/70 mb-6 flex-grow">
                    {service.description}
                  </p>
                  
                  {/* Details */}
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between items-center py-2 border-t border-sage/10">
                      <span className="caption text-dune/60">Duration</span>
                      <span className="text-sm font-light">{service.duration}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-sage/10">
                      <span className="caption text-dune/60">Starting at</span>
                      <span className="text-lg font-light text-terracotta">{service.price}</span>
                    </div>
                  </div>
                  
                  {/* Hidden image on hover */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: hoveredService === service.id ? 1 : 0,
                      scale: hoveredService === service.id ? 1 : 0.8
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 arch-full overflow-hidden pointer-events-none"
                  >
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover opacity-10"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )
        })}
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
          <button className="btn btn-primary">
            Learn More
          </button>
        </motion.div>
      </div>
    </section>
  )
}
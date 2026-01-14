'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useServiceBrowser } from '../ServiceBrowserContext'
import { SubcategoryTabs } from '../components/SubcategoryTabs'
import { ServiceCard } from '../components/ServiceCard'

export function BrowseView() {
  const { state, actions, services } = useServiceBrowser()
  const { categorySlug, activeSubcategory } = state

  // Filter services by category
  const categoryServices = useMemo(() => {
    return services.filter(s => s.categorySlug === categorySlug)
  }, [services, categorySlug])

  // Build subcategories from services, sorted by displayOrder
  const subcategories = useMemo(() => {
    const subcatMap = new Map<string, { id: string; name: string; slug: string; displayOrder: number }>()
    categoryServices.forEach((service, index) => {
      // Ensure we have valid, non-empty subcategory data
      const slug = service.subcategorySlug?.trim()
      const name = service.subcategoryName?.trim()
      if (slug && name) {
        if (!subcatMap.has(slug)) {
          subcatMap.set(slug, {
            id: slug || `subcat-${index}`, // Fallback to ensure unique ID
            name: name,
            slug: slug,
            displayOrder: service.subcategoryDisplayOrder ?? 999,
          })
        }
      }
    })
    // Sort by displayOrder
    return Array.from(subcatMap.values()).sort((a, b) => a.displayOrder - b.displayOrder)
  }, [categoryServices])

  // Filter by active subcategory
  const filteredServices = useMemo(() => {
    if (!activeSubcategory) return categoryServices
    return categoryServices.filter(s => s.subcategorySlug === activeSubcategory)
  }, [categoryServices, activeSubcategory])

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="p-4 md:p-6"
    >
      {/* Subcategory Tabs */}
      {subcategories.length > 1 && (
        <div className="mb-4">
          <SubcategoryTabs
            subcategories={subcategories}
            activeSubcategory={activeSubcategory}
            onSelect={actions.setActiveSubcategory}
          />
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {filteredServices.map((service, index) => (
          <ServiceCard
            key={service.id || `service-${index}`}
            service={service}
            index={index}
            onClick={() => actions.selectService(service)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sage font-sans">No services found in this category.</p>
        </div>
      )}
    </motion.div>
  )
}

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

  // Filter by active subcategory and sort by subcategory order, then service order
  const filteredServices = useMemo(() => {
    let filtered = activeSubcategory
      ? categoryServices.filter(s => s.subcategorySlug === activeSubcategory)
      : categoryServices

    // Sort by: 1) subcategory display order, 2) service display order
    // Services without a subcategory go to the end
    return [...filtered].sort((a, b) => {
      const aSubcatOrder = a.subcategoryDisplayOrder ?? 999
      const bSubcatOrder = b.subcategoryDisplayOrder ?? 999

      if (aSubcatOrder !== bSubcatOrder) {
        return aSubcatOrder - bSubcatOrder
      }

      // Within same subcategory, sort by service display order
      const aOrder = a.displayOrder ?? 999
      const bOrder = b.displayOrder ?? 999
      return aOrder - bOrder
    })
  }, [categoryServices, activeSubcategory])

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Subcategory Tabs - Sticky on mobile */}
      {subcategories.length > 1 && (
        <div className="sticky top-0 z-10 bg-ivory/95 backdrop-blur-sm px-4 pt-4 pb-3 md:relative md:bg-transparent md:backdrop-blur-none md:px-6 md:pt-6 md:pb-0 md:mb-4">
          <SubcategoryTabs
            subcategories={subcategories}
            activeSubcategory={activeSubcategory}
            onSelect={actions.setActiveSubcategory}
          />
        </div>
      )}

      {/* Services Grid */}
      <div className={`px-4 pb-4 md:px-6 md:pb-6 ${subcategories.length > 1 ? 'pt-2 md:pt-0' : 'pt-4 md:pt-6'}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {filteredServices.map((service, index) => (
            <ServiceCard
              key={service.id || service.slug || `service-${index}`}
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
      </div>
    </motion.div>
  )
}

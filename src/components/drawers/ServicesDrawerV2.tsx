"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles, Check } from 'lucide-react';
import DrawerContainer from './DrawerContainer';
import { useDrawer } from './DrawerContext';
import { StarIcon, MoonIcon, SunIcon, WaveIcon } from '../icons/DesertIcons';

interface Service {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string;
  durationMinutes: number;
  priceStarting: number;
  imageUrl: string | null;
  color: string | null;
  displayOrder: number;
  categoryName: string | null;
  categorySlug: string | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
}

interface Category {
  name: string;
  slug: string;
  count: number;
  subcategories: Subcategory[];
}

interface Subcategory {
  name: string;
  slug: string;
  count: number;
}

interface ServicesDrawerV2Props {
  services: Service[];
}

const getIconForService = (slug: string) => {
  if (slug.includes('classic')) return <MoonIcon className="w-6 h-6" />;
  if (slug.includes('angel') || slug.includes('wet')) return <WaveIcon className="w-6 h-6" />;
  if (slug.includes('hybrid')) return <StarIcon className="w-6 h-6" />;
  if (slug.includes('volume')) return <SunIcon className="w-6 h-6" />;
  return <Sparkles className="w-6 h-6" />;
};

const getPriceDisplay = (priceInCents: number) => {
  return `$${(priceInCents / 100).toFixed(0)}+`;
};

export default function ServicesDrawerV2({ services }: ServicesDrawerV2Props) {
  const { quizResults } = useDrawer();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [showMobileCategoryPicker, setShowMobileCategoryPicker] = useState(false);

  // Build category hierarchy from services
  const categoryHierarchy = useMemo(() => {
    const hierarchyMap = new Map<string, Category>();

    services.forEach(service => {
      if (!service.categorySlug || !service.categoryName) return;

      if (!hierarchyMap.has(service.categorySlug)) {
        hierarchyMap.set(service.categorySlug, {
          name: service.categoryName,
          slug: service.categorySlug,
          count: 0,
          subcategories: []
        });
      }

      const category = hierarchyMap.get(service.categorySlug)!;
      category.count++;

      if (service.subcategorySlug && service.subcategoryName) {
        const existingSubcat = category.subcategories.find(s => s.slug === service.subcategorySlug);
        if (existingSubcat) {
          existingSubcat.count++;
        } else {
          category.subcategories.push({
            name: service.subcategoryName,
            slug: service.subcategorySlug,
            count: 1
          });
        }
      }
    });

    return Array.from(hierarchyMap.values());
  }, [services]);

  // Initialize from quiz results
  useEffect(() => {
    if (quizResults) {
      const categorySet = new Set<string>();
      quizResults.serviceCategory.forEach(cat => {
        if (cat === 'classic' || cat === 'volume' || cat === 'mega' || cat === 'hybrid') {
          categorySet.add('lashes');
        }
        if (cat === 'lift') {
          categorySet.add('lashes');
        }
      });
      if (categorySet.size > 0) {
        setSelectedCategories(categorySet);
      }
    }
  }, [quizResults]);

  // Get available subcategories based on selected categories
  const availableSubcategories = useMemo(() => {
    if (selectedCategories.size === 0) return [];

    const subcats: Subcategory[] = [];
    categoryHierarchy.forEach(category => {
      if (selectedCategories.has(category.slug)) {
        subcats.push(...category.subcategories);
      }
    });
    return subcats;
  }, [categoryHierarchy, selectedCategories]);

  // Filter services
  const filteredServices = useMemo(() => {
    if (selectedCategories.size === 0) return services;

    return services.filter(service => {
      const categoryMatch = selectedCategories.has(service.categorySlug || '');
      const subcategoryMatch = selectedSubcategories.size === 0 ||
                              selectedSubcategories.has(service.subcategorySlug || '');
      return categoryMatch && subcategoryMatch;
    });
  }, [services, selectedCategories, selectedSubcategories]);

  // Group services by subcategory
  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      const key = service.subcategorySlug || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(service);
    });
    return groups;
  }, [filteredServices]);

  const toggleCategory = (slug: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(slug)) {
      newSet.delete(slug);
      // Remove subcategories from this category
      const category = categoryHierarchy.find(c => c.slug === slug);
      if (category) {
        const newSubcats = new Set(selectedSubcategories);
        category.subcategories.forEach(s => newSubcats.delete(s.slug));
        setSelectedSubcategories(newSubcats);
      }
    } else {
      newSet.add(slug);
    }
    setSelectedCategories(newSet);
  };

  const toggleSubcategory = (slug: string) => {
    const newSet = new Set(selectedSubcategories);
    if (newSet.has(slug)) {
      newSet.delete(slug);
    } else {
      newSet.add(slug);
    }
    setSelectedSubcategories(newSet);
  };

  const clearAllFilters = () => {
    setSelectedCategories(new Set());
    setSelectedSubcategories(new Set());
  };

  // Docked content with category picker
  const dockedContent = (
    <div className="w-full">
      {/* Desktop: Horizontal category pills */}
      <div className="hidden md:flex items-center gap-3 w-full">
        <div className="flex items-center gap-2 shrink-0">
          <Sparkles className="w-5 h-5 text-sage" />
          <span className="text-sm font-medium text-sage">Categories:</span>
        </div>

        <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide">
          {categoryHierarchy.map(category => (
            <button
              key={category.slug}
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.slug);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategories.has(category.slug)
                  ? 'bg-sage text-cream'
                  : 'bg-sage/10 text-dune hover:bg-sage/20'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-dune/70">
            {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
          </span>
          {selectedCategories.size > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-xs text-terracotta hover:text-dusty-rose transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mobile: Compact dropdown */}
      <div className="flex md:hidden items-center justify-between w-full">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMobileCategoryPicker(!showMobileCategoryPicker);
          }}
          className="flex items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-sage" />
          <div className="text-left">
            <p className="text-sm font-medium text-sage">
              {selectedCategories.size > 0
                ? `${selectedCategories.size} ${selectedCategories.size === 1 ? 'category' : 'categories'}`
                : 'All categories'}
            </p>
            <p className="text-xs text-dune/70">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ChevronRight className={`w-4 h-4 text-sage transition-transform ${showMobileCategoryPicker ? 'rotate-90' : ''}`} />
        </button>
        {selectedCategories.size > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearAllFilters();
            }}
            className="text-xs text-terracotta"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  return (
    <DrawerContainer
      name="services"
      title="Our Services"
      dockedContent={dockedContent}
      icon={<Sparkles className="w-5 h-5" />}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Mobile Category Picker */}
        <AnimatePresence>
          {showMobileCategoryPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-soft rounded-3xl p-6 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {categoryHierarchy.map(category => (
                  <button
                    key={category.slug}
                    onClick={() => {
                      toggleCategory(category.slug);
                      setShowMobileCategoryPicker(false);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategories.has(category.slug)
                        ? 'bg-sage text-cream'
                        : 'bg-sage/10 text-dune'
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subcategory Filter Panel (shown only when categories selected) */}
        <AnimatePresence>
          {availableSubcategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-soft rounded-3xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-terracotta/20 text-terracotta flex items-center justify-center text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-dune">Refine by Type</h3>
                <span className="text-sm text-dune/50 ml-2">(optional)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSubcategories.map(subcat => (
                  <motion.button
                    key={subcat.slug}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSubcategory(subcat.slug)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedSubcategories.has(subcat.slug)
                        ? 'bg-terracotta text-cream'
                        : 'bg-terracotta/10 text-dune hover:bg-terracotta/20'
                    }`}
                  >
                    {subcat.name} ({subcat.count})
                  </motion.button>
                ))}
              </div>
              {selectedSubcategories.size > 0 && (
                <div className="mt-4 pt-4 border-t border-sage/10 flex justify-between items-center">
                  <p className="text-sm text-dune/70">
                    {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} match your filters
                  </p>
                  <button
                    onClick={() => setSelectedSubcategories(new Set())}
                    className="text-sm font-medium text-terracotta hover:text-dusty-rose transition-colors"
                  >
                    Clear subcategories
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Services Display */}
        <div className="space-y-12">
          {Object.entries(groupedServices).map(([subcatSlug, subcatServices]) => {
            const subcatName = subcatServices[0]?.subcategoryName || 'Other';

            return (
              <div key={subcatSlug}>
                {/* Subcategory Header */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 mb-6"
                >
                  <ChevronRight className="w-5 h-5 text-sage" />
                  <h3 className="text-2xl font-light text-dune">{subcatName}</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-sage/20 to-transparent" />
                </motion.div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subcatServices.map((service, index) => (
                    <motion.div
                      key={service.slug}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      onMouseEnter={() => setHoveredService(service.slug)}
                      onMouseLeave={() => setHoveredService(null)}
                      className="group relative"
                    >
                      <div className="glass h-full rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                        {/* Icon */}
                        <motion.div
                          animate={{
                            scale: hoveredService === service.slug ? 1.1 : 1,
                            rotate: hoveredService === service.slug ? 360 : 0
                          }}
                          transition={{ duration: 0.6 }}
                          className={`text-${service.color || 'sage'} mb-4`}
                        >
                          {getIconForService(service.slug)}
                        </motion.div>

                        {/* Content */}
                        <h4 className="text-lg font-medium text-dune mb-2">
                          {service.name}
                        </h4>
                        {service.subtitle && (
                          <p className="text-sm text-terracotta mb-3 italic">
                            {service.subtitle}
                          </p>
                        )}
                        <p className="text-sm text-dune/70 mb-4 line-clamp-3">
                          {service.description}
                        </p>

                        {/* Details */}
                        <div className="space-y-2 mb-4 pt-4 border-t border-sage/10">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-dune/60">Duration</span>
                            <span className="text-sm font-medium">{service.durationMinutes} min</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-dune/60">Starting at</span>
                            <span className="text-lg font-light text-terracotta">
                              {getPriceDisplay(service.priceStarting)}
                            </span>
                          </div>
                        </div>

                        {/* Book Button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full btn btn-primary"
                        >
                          Book Now
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-lg text-dune/70 mb-4">No services match your filters</p>
            <button
              onClick={clearAllFilters}
              className="btn btn-secondary"
            >
              Clear filters
            </button>
          </motion.div>
        )}
      </div>
    </DrawerContainer>
  );
}

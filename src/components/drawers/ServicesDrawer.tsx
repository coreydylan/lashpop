"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Package, X } from 'lucide-react';
import DrawerContainer from './DrawerContainer';
import { useDrawer } from './DrawerContext';
import { StarIcon, MoonIcon, SunIcon, WaveIcon } from '../icons/DesertIcons';

interface Service {
  id: string;
  mainCategory: string;
  subCategory: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  price: string;
  image: string;
  color: string;
  displayOrder: number;
}

interface ServicesDrawerProps {
  services: Service[];
  mainCategories: string[];
}

const getIconForService = (id: string) => {
  if (id.startsWith('classic')) return <MoonIcon className="w-8 h-8" />;
  if (id.startsWith('angel') || id.startsWith('wet')) return <WaveIcon className="w-8 h-8" />;
  if (id.startsWith('hybrid')) return <StarIcon className="w-8 h-8" />;
  if (id.startsWith('volume')) return <SunIcon className="w-8 h-8" />;
  if (id === 'lift') return <WaveIcon className="w-8 h-8" />;
  return <StarIcon className="w-8 h-8" />;
};

export default function ServicesDrawer({ services, mainCategories }: ServicesDrawerProps) {
  const { quizResults } = useDrawer();
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [selectedMainCategories, setSelectedMainCategories] = useState<Set<string>>(new Set());
  const [selectedSubCategories, setSelectedSubCategories] = useState<Set<string>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Initialize filters from quiz results
  React.useEffect(() => {
    if (quizResults) {
      const filters = new Set<string>();

      quizResults.serviceCategory.forEach(cat => {
        if (cat === 'classic') filters.add('Classic Lashes');
        if (cat === 'volume') filters.add('Volume Lashes');
        if (cat === 'mega') filters.add('Mega Volume');
        if (cat === 'lift') filters.add('Lash Lift');
      });

      if (filters.size > 0) {
        setSelectedMainCategories(filters);
      }
    }
  }, [quizResults]);

  // Get available subcategories based on selected main categories
  const availableSubCategories = useMemo(() => {
    if (selectedMainCategories.size === 0) return [];

    const subCats = new Set<string>();
    services.forEach(service => {
      if (selectedMainCategories.has(service.mainCategory) && service.subCategory) {
        subCats.add(service.subCategory);
      }
    });
    return Array.from(subCats);
  }, [services, selectedMainCategories]);

  // Filter services based on selected categories
  const filteredServices = useMemo(() => {
    if (selectedMainCategories.size === 0 && selectedSubCategories.size === 0) {
      return services;
    }

    return services.filter(service => {
      const mainCategoryMatch = selectedMainCategories.size === 0 || selectedMainCategories.has(service.mainCategory);
      const subCategoryMatch = selectedSubCategories.size === 0 || selectedSubCategories.has(service.subCategory);
      return mainCategoryMatch && subCategoryMatch;
    });
  }, [services, selectedMainCategories, selectedSubCategories]);

  // Group services by main category and subcategory
  const groupedServices = useMemo(() => {
    const groups: Record<string, Record<string, Service[]>> = {};

    filteredServices.forEach(service => {
      if (!groups[service.mainCategory]) {
        groups[service.mainCategory] = {};
      }
      const subCat = service.subCategory || 'Other';
      if (!groups[service.mainCategory][subCat]) {
        groups[service.mainCategory][subCat] = [];
      }
      groups[service.mainCategory][subCat].push(service);
    });

    // Sort services within each group by displayOrder
    Object.values(groups).forEach(subGroups => {
      Object.values(subGroups).forEach(serviceList => {
        serviceList.sort((a, b) => a.displayOrder - b.displayOrder);
      });
    });

    return groups;
  }, [filteredServices]);

  const toggleMainCategory = (category: string) => {
    const newSet = new Set(selectedMainCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
      const subCatsToRemove = services
        .filter(s => s.mainCategory === category && s.subCategory)
        .map(s => s.subCategory);
      const newSubSet = new Set(selectedSubCategories);
      subCatsToRemove.forEach(subCat => newSubSet.delete(subCat));
      setSelectedSubCategories(newSubSet);
    } else {
      newSet.add(category);
    }
    setSelectedMainCategories(newSet);
  };

  const toggleSubCategory = (category: string) => {
    const newSet = new Set(selectedSubCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setSelectedSubCategories(newSet);
  };

  const toggleDescription = (serviceId: string) => {
    const newSet = new Set(expandedDescriptions);
    if (newSet.has(serviceId)) {
      newSet.delete(serviceId);
    } else {
      newSet.add(serviceId);
    }
    setExpandedDescriptions(newSet);
  };

  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength).trim() + '...';
  };

  const clearAllFilters = () => {
    setSelectedMainCategories(new Set());
    setSelectedSubCategories(new Set());
  };

  // Beautiful docked content
  const dockedContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-full bg-ocean-mist/20">
          <Package className="w-5 h-5 text-sage" />
        </div>
        <div>
          <p className="caption text-sage">
            {selectedMainCategories.size > 0 ? `${selectedMainCategories.size} categories selected` : 'Browse all services'}
          </p>
          <p className="text-lg font-light text-dune">
            {filteredServices.length} Service{filteredServices.length !== 1 ? 's' : ''} Available
          </p>
        </div>
      </div>
      {selectedMainCategories.size > 0 && (
        <button
          onClick={clearAllFilters}
          className="text-sm text-terracotta hover:text-dusty-rose transition-colors"
          style={{ fontWeight: 400, letterSpacing: '0.05em' }}
        >
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <DrawerContainer
      name="services"
      title="Our Services"
      dockedContent={dockedContent}
      icon={<Package className="w-5 h-5" />}
    >
      <div className="max-w-7xl mx-auto">
        {/* Filter Dropdown */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-6 py-3 glass rounded-full shadow-lg flex items-center gap-2 text-dune font-medium"
            >
              <span className="caption">Filter Services</span>
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
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[400px] max-h-[500px] overflow-y-auto glass rounded-2xl shadow-xl p-6 z-50"
                >
                  {/* Main Categories */}
                  <div className="mb-6">
                    <h4 className="caption text-sage mb-3">Main Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {mainCategories.map(category => (
                        <button
                          key={category}
                          onClick={() => toggleMainCategory(category)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedMainCategories.has(category)
                              ? 'bg-sage text-cream'
                              : 'bg-sage/10 text-dune hover:bg-sage/20'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subcategories */}
                  {availableSubCategories.length > 0 && (
                    <div className="mb-6">
                      <h4 className="caption text-terracotta mb-3">Subcategories</h4>
                      <div className="flex flex-wrap gap-2">
                        {availableSubCategories.map(category => (
                          <button
                            key={category}
                            onClick={() => toggleSubCategory(category)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              selectedSubCategories.has(category)
                                ? 'bg-terracotta text-cream'
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
        <div className="space-y-12">
          {Object.entries(groupedServices).map(([mainCategory, subGroups]) => (
            <div key={mainCategory}>
              {/* Main Category Header */}
              {(selectedMainCategories.size === 0 || selectedMainCategories.size > 1) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-6"
                >
                  <h3 className="h3 text-dune mb-2">{mainCategory}</h3>
                  <div className="w-24 h-1 bg-gradient-to-r from-sage to-ocean-mist mx-auto rounded-full" />
                </motion.div>
              )}

              {/* Subcategory Groups */}
              {Object.entries(subGroups).map(([subCategory, categoryServices]) => (
                <div key={`${mainCategory}-${subCategory}`} className="mb-8 last:mb-0">
                  {/* Subcategory Header */}
                  {subCategory !== 'Other' && selectedSubCategories.size === 0 && (
                    <h4 className="text-xl font-light text-terracotta text-center mb-4">
                      {subCategory}
                    </h4>
                  )}

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryServices.map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6, delay: index * 0.05 }}
                        onMouseEnter={() => setHoveredService(service.id)}
                        onMouseLeave={() => setHoveredService(null)}
                        className="group relative"
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

                          {/* Book Button */}
                          <button className="btn btn-primary w-full mt-4">
                            Book Now
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </DrawerContainer>
  );
}
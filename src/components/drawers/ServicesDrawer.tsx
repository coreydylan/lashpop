"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Clock,
  DollarSign,
  Star,
  ChevronRight,
  Package,
  Eye,
  Sparkles,
  Heart,
  Palette,
} from 'lucide-react';
import DrawerContainer from './DrawerContainer';
import { useDrawer } from './DrawerContext';

// Service types
interface Service {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  tags: string[];
}

// Mock services data - in production this would come from your database
const mockServices: Service[] = [
  {
    id: '1',
    name: 'Natural Volume Full Set',
    category: 'lashes',
    subcategory: 'volume',
    description: '2-3D lightweight volume for everyday elegance',
    duration: '90-120',
    price: 175,
    rating: 4.9,
    reviews: 127,
    tags: ['natural', 'volume', 'first_timer'],
  },
  {
    id: '2',
    name: 'Wispy Hybrid Set',
    category: 'lashes',
    subcategory: 'hybrid',
    description: 'Perfect blend of classic and volume techniques',
    duration: '120',
    price: 195,
    rating: 4.8,
    reviews: 98,
    tags: ['natural', 'everyday', 'volume'],
  },
  {
    id: '3',
    name: 'Mega Volume Full Set',
    category: 'lashes',
    subcategory: 'mega',
    description: 'Maximum drama with 6D-10D fans',
    duration: '150-180',
    price: 295,
    rating: 5.0,
    reviews: 89,
    tags: ['dramatic', 'special', 'mega'],
  },
  {
    id: '4',
    name: 'Classic Full Set',
    category: 'lashes',
    subcategory: 'classic',
    description: 'Timeless elegance with one-to-one application',
    duration: '90',
    price: 145,
    rating: 4.7,
    reviews: 156,
    tags: ['natural', 'classic', 'first_timer'],
  },
  {
    id: '5',
    name: 'Baby Botox',
    category: 'injectables',
    subcategory: 'botox',
    description: 'Subtle, preventative treatment for fine lines',
    duration: '30',
    price: 295,
    rating: 5.0,
    reviews: 89,
    tags: ['natural', 'preventative', 'botox'],
  },
  {
    id: '6',
    name: 'Lash Lift & Tint',
    category: 'lashes',
    subcategory: 'lift',
    description: 'Natural lash enhancement without extensions',
    duration: '60',
    price: 95,
    rating: 4.9,
    reviews: 203,
    tags: ['natural', 'lift', 'low_maintenance'],
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  lashes: <Eye className="w-5 h-5" />,
  injectables: <Sparkles className="w-5 h-5" />,
  skincare: <Heart className="w-5 h-5" />,
  brows: <Palette className="w-5 h-5" />,
};

interface FilterTag {
  id: string;
  label: string;
  type: 'category' | 'style' | 'custom';
}

export default function ServicesDrawer() {
  const { quizResults, drawerStates } = useDrawer();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterTag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Initialize filters from quiz results
  useEffect(() => {
    if (quizResults && drawerStates.services === 'expanded') {
      const filters: FilterTag[] = [];

      // Add service category filters
      quizResults.serviceCategory.forEach(cat => {
        if (cat === 'classic') filters.push({ id: 'classic', label: 'Classic Lashes', type: 'category' });
        if (cat === 'volume') filters.push({ id: 'volume', label: 'Volume Lashes', type: 'category' });
        if (cat === 'mega') filters.push({ id: 'mega', label: 'Mega Volume', type: 'category' });
        if (cat === 'lift') filters.push({ id: 'lift', label: 'Lash Lift', type: 'category' });
      });

      // Add style filter
      if (quizResults.style === 'natural') {
        filters.push({ id: 'natural', label: 'Natural Look', type: 'style' });
      } else if (quizResults.style === 'dramatic') {
        filters.push({ id: 'dramatic', label: 'Dramatic Look', type: 'style' });
      } else if (quizResults.style === 'everyday') {
        filters.push({ id: 'everyday', label: 'Everyday Glam', type: 'style' });
      }

      setActiveFilters(filters);
    }
  }, [quizResults, drawerStates.services]);

  // Smart title function - removes redundant category words
  const getSmartTitle = (service: Service) => {
    if (!selectedCategory) return service.name;

    let smartTitle = service.name;
    const categoryWords = selectedCategory.toLowerCase().split(' ');

    categoryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      smartTitle = smartTitle.replace(regex, '').trim();
    });

    // Clean up extra spaces and return
    return smartTitle.replace(/\s+/g, ' ').trim() || service.name;
  };

  // Filter services based on active filters and search
  const filteredServices = useMemo(() => {
    let filtered = [...mockServices];

    // Apply category filters
    const categoryFilters = activeFilters.filter(f => f.type === 'category');
    if (categoryFilters.length > 0) {
      filtered = filtered.filter(service =>
        categoryFilters.some(filter =>
          service.subcategory === filter.id || service.tags.includes(filter.id)
        )
      );
    }

    // Apply style filters
    const styleFilters = activeFilters.filter(f => f.type === 'style');
    if (styleFilters.length > 0) {
      filtered = filtered.filter(service =>
        styleFilters.some(filter => service.tags.includes(filter.id))
      );
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply selected category
    if (selectedCategory) {
      filtered = filtered.filter(service =>
        service.subcategory === selectedCategory.toLowerCase()
      );
    }

    return filtered;
  }, [activeFilters, searchQuery, selectedCategory]);

  // Group services by perfect match vs partial match
  const { perfectMatches, partialMatches } = useMemo(() => {
    if (activeFilters.length === 0) {
      return { perfectMatches: filteredServices, partialMatches: [] };
    }

    const perfect: Service[] = [];
    const partial: Service[] = [];

    filteredServices.forEach(service => {
      const matchCount = activeFilters.filter(filter =>
        service.tags.includes(filter.id) || service.subcategory === filter.id
      ).length;

      if (matchCount === activeFilters.length) {
        perfect.push(service);
      } else if (matchCount > 0) {
        partial.push(service);
      }
    });

    return { perfectMatches: perfect, partialMatches: partial };
  }, [filteredServices, activeFilters]);

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSelectedCategory(null);
  };

  // Docked content
  const dockedContent = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Package className="w-5 h-5 text-[#C4A484]" />
        <div>
          <p className="font-medium text-gray-900">
            {filteredServices.length} Services Available
          </p>
          <p className="text-sm text-gray-600">
            {activeFilters.length > 0
              ? `Filtered by ${activeFilters.map(f => f.label).join(', ')}`
              : 'Browse all services'}
          </p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );

  return (
    <DrawerContainer
      name="services"
      title="Our Services"
      dockedContent={dockedContent}
      className="border-t-4 border-[#D4A574]"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4A484]/20 focus:border-[#C4A484]"
          />
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(filter => (
              <motion.div
                key={filter.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#C4A484]/10 text-[#C4A484] rounded-full text-sm"
              >
                {filter.type === 'category' && categoryIcons.lashes}
                <span>{filter.label}</span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="hover:bg-[#C4A484]/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Categories */}
        {!selectedCategory && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(categoryIcons).map(([category, icon]) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#C4A484] hover:bg-[#C4A484]/5 transition-all group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-[#C4A484] group-hover:scale-110 transition-transform">
                      {icon}
                    </div>
                    <span className="font-medium text-gray-900 capitalize">{category}</span>
                    <span className="text-xs text-gray-600">
                      {mockServices.filter(s => s.category === category).length} services
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Breadcrumb for selected category */}
        {selectedCategory && (
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-[#C4A484] hover:text-[#D4A574] transition-colors"
            >
              All Services
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900 capitalize">{selectedCategory}</span>
          </div>
        )}

        {/* Services List */}
        <div className="space-y-4">
          {perfectMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Perfect Matches ({perfectMatches.length})
              </h3>
              <div className="grid gap-3">
                {perfectMatches.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    smartTitle={getSmartTitle(service)}
                  />
                ))}
              </div>
            </div>
          )}

          {partialMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Other Options ({partialMatches.length})
              </h3>
              <div className="grid gap-3">
                {partialMatches.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    smartTitle={getSmartTitle(service)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredServices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No services found matching your criteria</p>
              <button
                onClick={clearAllFilters}
                className="mt-2 text-[#C4A484] hover:text-[#D4A574] transition-colors"
              >
                Clear filters and try again
              </button>
            </div>
          )}
        </div>
      </div>
    </DrawerContainer>
  );
}

// Service Card Component
function ServiceCard({ service, smartTitle }: { service: Service; smartTitle: string }) {
  return (
    <motion.div
      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-1">{smartTitle}</h4>
          <p className="text-sm text-gray-600">{service.description}</p>
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wide px-2 py-1 bg-gray-100 rounded">
          {service.category}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{service.duration} min</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          <span>${service.price}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span>{service.rating} ({service.reviews})</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button className="text-sm text-[#C4A484] hover:text-[#D4A574] transition-colors">
          View Details
        </button>
        <button className="px-4 py-2 bg-[#C4A484] text-white rounded-lg hover:bg-[#D4A574] transition-colors group-hover:scale-105">
          Book Now →
        </button>
      </div>
    </motion.div>
  );
}
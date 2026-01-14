'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PanelWrapper } from '../PanelWrapper';
import { useCascadingPanels } from '@/contexts/CascadingPanelContext';
import type { PanelStackItem } from '@/types/cascading-panels';

interface BookNowPanelProps {
  panel: PanelStackItem;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  subcategories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

// Icon and color mapping for categories
const CATEGORY_STYLING: Record<string, { icon: string; color: string }> = {
  lashes: { icon: '✨', color: 'from-dusty-rose/20 to-pink-100' },
  brows: { icon: '🎀', color: 'from-warm-sand/20 to-amber-100' },
  waxing: { icon: '💫', color: 'from-sage/20 to-green-100' },
  facials: { icon: '🌸', color: 'from-ocean-mist/20 to-blue-100' },
  // Add more as needed
};

export function CategoryPickerPanel({ panel }: BookNowPanelProps) {
  const { state, actions } = useCascadingPanels();

  // Build category hierarchy from services
  const categories = useMemo(() => {
    const categoryMap = new Map<string, Category>();

    state.services.forEach(service => {
      if (!service.categorySlug || !service.categoryName) return;

      if (!categoryMap.has(service.categorySlug)) {
        const styling = CATEGORY_STYLING[service.categorySlug] || {
          icon: '✨',
          color: 'from-sage/20 to-gray-100'
        };

        categoryMap.set(service.categorySlug, {
          id: service.categorySlug,
          name: service.categoryName,
          slug: service.categorySlug,
          icon: styling.icon,
          color: styling.color,
          subcategories: [],
        });
      }

      const category = categoryMap.get(service.categorySlug)!;

      // Add subcategory if it exists and isn't already in the list
      if (service.subcategorySlug && service.subcategoryName) {
        const existingSubcat = category.subcategories.find(
          s => s.slug === service.subcategorySlug
        );
        if (!existingSubcat) {
          category.subcategories.push({
            id: service.subcategorySlug,
            name: service.subcategoryName,
            slug: service.subcategorySlug,
          });
        }
      }
    });

    return Array.from(categoryMap.values());
  }, [state.services]);

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    actions.toggleCategory(categoryId, categoryName);

    // Check if this category already has a subcategory panel open
    const existingPanel = state.panels.find(
      p => p.type === 'subcategory-services' && p.data.categoryId === categoryId
    );

    if (!existingPanel) {
      // Find category data
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      // Open subcategory panel for this category with real data
      actions.openPanel(
        'subcategory-services',
        {
          categoryId,
          categoryName,
          subcategories: category.subcategories,
          services: state.services.filter(s => s.categorySlug === categoryId),
        },
        { parentId: panel.id }
      );
    } else {
      // Close the existing panel
      actions.closePanel(existingPanel.id, true);
    }
  };

  const isSelected = (categoryId: string) => {
    return state.categorySelections.some(c => c.categoryId === categoryId);
  };

  return (
    <PanelWrapper
      panel={panel}
      title="Choose Your Services"
      subtitle="Select one or more categories"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category, index) => {
          const selected = isSelected(category.id);

          return (
            <motion.button
              key={category.id || `category-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category.id, category.name)}
              className={`relative p-6 rounded-2xl transition-all ${
                selected
                  ? 'bg-gradient-to-br from-dusty-rose/30 to-warm-sand/30 ring-2 ring-dusty-rose shadow-lg'
                  : 'bg-gradient-to-br ' + category.color + ' hover:shadow-md'
              }`}
            >
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-dusty-rose flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              <div className="text-4xl mb-3">{category.icon}</div>
              <h4 className="font-medium text-dune">{category.name}</h4>
            </motion.button>
          );
        })}
      </div>

      {state.categorySelections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-xl bg-sage/10 border border-sage/20"
        >
          <p className="text-sm text-sage">
            <strong>{state.categorySelections.length}</strong> {state.categorySelections.length === 1 ? 'category' : 'categories'} selected
          </p>
        </motion.div>
      )}
    </PanelWrapper>
  );
}

'use client';

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import type { Panel, CategoryPickerPanelData } from '@/types/panel-stack';

interface CategoryPickerPanelProps {
  panel: Panel;
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
  serviceCount: number;
}

// Icon and color mapping for categories
const CATEGORY_STYLING: Record<string, { icon: string; color: string }> = {
  lashes: { icon: '✨', color: 'from-dusty-rose/20 to-pink-100' },
  brows: { icon: '🎀', color: 'from-warm-sand/20 to-amber-100' },
  waxing: { icon: '💫', color: 'from-sage/20 to-green-100' },
  facials: { icon: '🌸', color: 'from-ocean-mist/20 to-blue-100' },
  nails: { icon: '💅', color: 'from-terracotta/20 to-rose-100' },
};

export function CategoryPickerPanel({ panel }: CategoryPickerPanelProps) {
  const { state, actions } = usePanelStack();
  const data = panel.data as CategoryPickerPanelData;

  // Build category hierarchy from services
  const categories = useMemo(() => {
    const categoryMap = new Map<string, Category>();

    state.services.forEach(service => {
      if (!service.categorySlug || !service.categoryName) return;

      if (!categoryMap.has(service.categorySlug)) {
        const styling = CATEGORY_STYLING[service.categorySlug] || {
          icon: '✨',
          color: 'from-sage/20 to-gray-100',
        };

        categoryMap.set(service.categorySlug, {
          id: service.categorySlug,
          name: service.categoryName,
          slug: service.categorySlug,
          icon: styling.icon,
          color: styling.color,
          subcategories: [],
          serviceCount: 0,
        });
      }

      const category = categoryMap.get(service.categorySlug)!;
      category.serviceCount++;

      // Add subcategory if exists and not already in list
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

  // Update panel summary based on selections
  useEffect(() => {
    if (state.categorySelections.length === 0) {
      actions.updatePanelSummary(panel.id, 'Choose services');
    } else {
      const names = state.categorySelections.map(c => c.categoryName).join(', ');
      actions.updatePanelSummary(
        panel.id,
        `${state.categorySelections.length} selected · ${names}`
      );
    }
  }, [state.categorySelections, panel.id, actions]);

  const handleCategoryClick = (category: Category) => {
    const isSelected = state.categorySelections.some(c => c.categoryId === category.id);

    if (isSelected) {
      // Deselect: close the service panel for this category
      actions.deselectCategory(category.id);

      // Find and close the service panel
      const servicePanel = state.panels.find(
        p => p.type === 'service-panel' && p.data.categoryId === category.id
      );
      if (servicePanel) {
        actions.closePanel(servicePanel.id);
      }
    } else {
      // Select: add category and open service panel
      actions.selectCategory(category.id, category.name);

      // Determine if this is the first selection
      const isFirstSelection = state.categorySelections.length === 0;

      // Open service panel
      const panelId = actions.openPanel(
        'service-panel',
        {
          categoryId: category.id,
          categoryName: category.name,
          subcategories: category.subcategories,
          services: state.services.filter(s => s.categorySlug === category.id),
        },
        {
          parentId: panel.id,
          autoExpand: isFirstSelection, // First selection expands, others dock
          scrollToTop: isFirstSelection,
        }
      );

      // Add badge to new panels after first
      if (!isFirstSelection) {
        actions.updatePanelData(panelId, { badge: 'new' });
      }

      // Auto-dock category picker after first selection
      if (isFirstSelection) {
        setTimeout(() => {
          actions.dockPanel(panel.id);
        }, 300);
      }
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {categories.map((category, index) => {
          const selected = isSelected(category.id);

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCategoryClick(category)}
              className={`
                relative p-4 md:p-6 rounded-2xl transition-all
                ${
                  selected
                    ? 'bg-gradient-to-br from-dusty-rose/30 to-warm-sand/30 ring-2 ring-dusty-rose shadow-lg'
                    : 'bg-gradient-to-br ' + category.color + ' hover:shadow-md'
                }
              `}
            >
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-dusty-rose flex items-center justify-center"
                >
                  <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                </motion.div>
              )}

              <div className="text-3xl md:text-4xl mb-2 md:mb-3">{category.icon}</div>
              <h4 className="font-medium text-dune text-sm md:text-base">{category.name}</h4>
              <p className="text-xs text-sage mt-1">{category.serviceCount} services</p>
            </motion.button>
          );
        })}
      </div>

      {state.categorySelections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-sage/10 border border-sage/20"
        >
          <p className="text-xs md:text-sm text-sage">
            <strong>{state.categorySelections.length}</strong>{' '}
            {state.categorySelections.length === 1 ? 'category' : 'categories'} selected
          </p>
        </motion.div>
      )}
    </PanelWrapper>
  );
}

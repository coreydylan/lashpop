'use client';

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { getCategoryColors } from '@/lib/category-colors';
import { getCategoryIcon } from '@/components/icons/CategoryIcons';
import type { Panel, CategoryPickerPanelData } from '@/types/panel-stack';

interface CategoryPickerPanelProps {
  panel: Panel;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  colors: {
    primary: string;
    light: string;
    medium: string;
    ring: string;
  };
  subcategories: {
    id: string;
    name: string;
    slug: string;
  }[];
  serviceCount: number;
}

export function CategoryPickerPanel({ panel }: CategoryPickerPanelProps) {
  const { state, actions } = usePanelStack();
  const data = panel.data as CategoryPickerPanelData;

  // Build category hierarchy from services
  const categories = useMemo(() => {
    const categoryMap = new Map<string, Category>();

    state.services.forEach(service => {
      if (!service.categorySlug || !service.categoryName) return;

      if (!categoryMap.has(service.categorySlug)) {
        const colors = getCategoryColors(service.categorySlug);

        categoryMap.set(service.categorySlug, {
          id: service.categorySlug,
          name: service.categoryName,
          slug: service.categorySlug,
          iconName: colors.iconName,
          colors: {
            primary: colors.primary,
            light: colors.light,
            medium: colors.medium,
            ring: colors.ring,
          },
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

  // No need for panel summary updates since this is now a static bar

  const handleCategoryClick = (category: Category) => {
    const isAlreadySelected = state.categorySelections.some(c => c.categoryId === category.id);

    if (isAlreadySelected) {
      // Already selected - just deselect it (toggle off behavior)
      actions.deselectCategory(category.id);

      // Find and close the service panel
      const servicePanel = state.panels.find(
        p => p.type === 'service-panel' && p.data.categoryId === category.id
      );
      if (servicePanel) {
        actions.closePanel(servicePanel.id);
      }
    } else {
      // New selection - First clear ALL other selections (Single select mode)
      
      // 1. Deselect all currently selected categories
      state.categorySelections.forEach(selection => {
        actions.deselectCategory(selection.categoryId);
        
        // Find and close their panels
        const panelToClose = state.panels.find(
          p => p.type === 'service-panel' && p.data.categoryId === selection.categoryId
        );
        if (panelToClose) {
          actions.closePanel(panelToClose.id);
        }
      });

      // 2. Select the new category
      actions.selectCategory(category.id, category.name);

      // 3. Open service panel for the new category
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
          autoExpand: true, // Always expand since it's the only one
          scrollToTop: true,
        }
      );

      // Auto-dock category picker after selection
      setTimeout(() => {
        actions.dockPanel(panel.id);
      }, 300);
    }
  };

  const isSelected = (categoryId: string) => {
    return state.categorySelections.some(c => c.categoryId === categoryId);
  };

  return (
    <div className="bg-ivory border-b border-sage/10 px-4 py-2 md:px-6 md:py-4">
      {/* Mobile: horizontal scroll with inline X */}
      <div className="md:hidden">
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-hide">
          {categories.map((category, index) => {
            const selected = isSelected(category.id);

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(category)}
                className={`
                  relative px-2.5 py-1 rounded-full font-medium
                  transition-all duration-200 flex items-center gap-1
                  flex-shrink-0 text-[11px]
                  ${
                    selected
                      ? 'text-white shadow-md transform scale-105'
                      : 'border hover:scale-105'
                  }
                `}
                style={{
                  backgroundColor: selected ? category.colors.primary : category.colors.light,
                  borderColor: selected ? 'transparent' : category.colors.medium,
                  color: selected ? 'white' : category.colors.primary,
                  boxShadow: selected ? `0 2px 10px ${category.colors.ring}` : 'none',
                }}
              >
                {/* Category Name */}
                <span className="whitespace-nowrap">{category.name}</span>
              </motion.button>
            );
          })}

          {/* Close X at the end of scroll */}
          <button
            onClick={() => actions.closePanel(panel.id)}
            className="flex-shrink-0 px-3 flex items-center justify-center transition-colors"
            aria-label="Close category picker"
          >
            <X className="w-4 h-4 text-sage/60 hover:text-dune transition-colors" />
          </button>
        </div>
      </div>

      {/* Desktop: original layout with separate button */}
      <div className="hidden md:flex items-start gap-3">
        <div className="flex-1">
          <div className="flex gap-3 flex-wrap p-1">
            {categories.map((category, index) => {
              const selected = isSelected(category.id);

              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCategoryClick(category)}
                  className={`
                    relative px-4 py-2.5 rounded-full font-medium
                    transition-all duration-200 flex items-center gap-2
                    ${
                      selected
                        ? 'text-white shadow-lg transform scale-105'
                        : 'border hover:scale-105'
                    }
                  `}
                  style={{
                    backgroundColor: selected ? category.colors.primary : category.colors.light,
                    borderColor: selected ? 'transparent' : category.colors.medium,
                    color: selected ? 'white' : category.colors.primary,
                    boxShadow: selected ? `0 4px 20px ${category.colors.ring}` : 'none',
                  }}
                >
                  {/* Category Name */}
                  <span className="text-sm whitespace-nowrap">{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Close Button - Desktop */}
        <button
          onClick={() => actions.closePanel(panel.id)}
          className="flex-shrink-0 w-7 h-7 rounded-full hover:bg-sage/10 flex items-center justify-center transition-colors group"
          aria-label="Close category picker"
        >
          <X className="w-5 h-5 text-sage group-hover:text-dune transition-colors" />
        </button>
      </div>
    </div>
  );
}

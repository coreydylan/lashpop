'use client';

import React, { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { PanelWrapper } from '../PanelWrapper';
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
      title="Choose Services"
      subtitle={state.categorySelections.length > 0
        ? `${state.categorySelections.length} selected`
        : "What can we help you with today?"}
    >
      {/* Category Chips Bar */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {categories.map((category, index) => {
          const selected = isSelected(category.id);
          const IconComponent = getCategoryIcon(category.iconName);

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
                relative px-4 py-2.5 md:px-5 md:py-3 rounded-full font-medium
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
              {/* Icon */}
              <IconComponent className="w-4 h-4 md:w-5 md:h-5" />

              {/* Category Name */}
              <span className="text-sm md:text-base">{category.name}</span>

              {/* Service Count Badge (unselected only) */}
              {!selected && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                  style={{
                    backgroundColor: category.colors.medium,
                    color: category.colors.primary,
                  }}
                >
                  {category.serviceCount}
                </span>
              )}

              {/* Check Icon (selected only) */}
              {selected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-1"
                >
                  <Check className="w-4 h-4" />
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Helper Text */}
      {state.categorySelections.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-xs md:text-sm text-sage/70 text-center"
        >
          Select one or more categories to view services
        </motion.p>
      )}
    </PanelWrapper>
  );
}

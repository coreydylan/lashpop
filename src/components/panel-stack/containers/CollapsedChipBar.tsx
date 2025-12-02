'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { getCategoryColors } from '@/lib/category-colors';
import { getCategoryIcon } from '@/components/icons/CategoryIcons';

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
  serviceCount: number;
}

interface CollapsedChipBarProps {
  onCategorySelect: (category: Category) => void;
  onDiscoverSelect: () => void;
  showDragIndicator?: boolean;
}

/**
 * CollapsedChipBar - Compact horizontal chip bar for collapsed bottom sheet
 *
 * Features:
 * - Horizontal scrollable category chips
 * - "Discover" chip for quiz access
 * - Compact design (~28px height chips)
 * - Clean edge-to-edge aesthetic
 */
export function CollapsedChipBar({
  onCategorySelect,
  onDiscoverSelect,
  showDragIndicator = false,
}: CollapsedChipBarProps) {
  const { state } = usePanelStack();

  // Build category list from services
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
          serviceCount: 0,
        });
      }

      const category = categoryMap.get(service.categorySlug)!;
      category.serviceCount++;
    });

    return Array.from(categoryMap.values());
  }, [state.services]);

  const isSelected = (categoryId: string) => {
    return state.categorySelections.some(c => c.categoryId === categoryId);
  };

  return (
    <div className="bg-cream/98 backdrop-blur-md">
      {/* Tiny drag indicator - only visible after user interaction */}
      {showDragIndicator && (
        <div className="flex justify-center pt-2 pb-1">
          <motion.div
            className="w-8 h-0.5 bg-sage/30 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          />
        </div>
      )}

      {/* Chip scroll container */}
      <div
        className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{
          paddingTop: showDragIndicator ? '0' : '0.5rem',
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
        }}
      >
        {/* Discover chip - first position */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDiscoverSelect}
          className="flex-shrink-0 px-3 py-1.5 rounded-full font-medium
            text-[11px] flex items-center gap-1.5
            bg-gradient-to-r from-dusty-rose to-dusty-rose/80
            text-white shadow-sm"
        >
          <Sparkles className="w-3 h-3" />
          <span className="whitespace-nowrap">Discover</span>
        </motion.button>

        {/* Category chips */}
        {categories.map((category, index) => {
          const selected = isSelected(category.id);
          const IconComponent = getCategoryIcon(category.iconName);

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (index + 1) * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategorySelect(category)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-full font-medium
                text-[11px] flex items-center gap-1.5
                transition-all duration-150
                ${
                  selected
                    ? 'text-white shadow-sm'
                    : 'border'
                }
              `}
              style={{
                backgroundColor: selected ? category.colors.primary : category.colors.light,
                borderColor: selected ? 'transparent' : category.colors.medium,
                color: selected ? 'white' : category.colors.primary,
              }}
            >
              <IconComponent className="w-3 h-3 flex-shrink-0" />
              <span className="whitespace-nowrap">{category.name}</span>
              {selected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0"
                >
                  <Check className="w-2.5 h-2.5" />
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

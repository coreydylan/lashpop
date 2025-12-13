'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { getCategoryColors } from '@/lib/category-colors';

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
  showDragIndicator?: boolean; // Show drag indicator (for collapsed state, false for persistent top)
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
  showDragIndicator = true,
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
      {/* Drag indicator - only show in collapsed state */}
      {showDragIndicator && (
        <div className="flex justify-center pt-3 pb-1">
          <motion.div
            className="w-10 h-1 bg-dusty-rose/50 rounded-full"
            initial={{ opacity: 0, scaleX: 0.5 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
          />
        </div>
      )}

      {/* Chip scroll container - horizontal scroll doesn't block vertical swipe */}
      <div
        className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide"
        style={{
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          // Allow horizontal scroll but don't capture vertical
          touchAction: 'pan-x',
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

        {/* Category chips - text only, no icons */}
        {categories.map((category, index) => {
          const selected = isSelected(category.id);

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
                text-[11px] flex items-center gap-1
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

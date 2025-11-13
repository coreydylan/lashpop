'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import { PanelWrapper } from '../PanelWrapper';
import { useCascadingPanels } from '@/contexts/CascadingPanelContext';
import type { PanelStackItem } from '@/types/cascading-panels';

interface BookNowPanelProps {
  panel: PanelStackItem;
}

export function BookNowPanel({ panel }: BookNowPanelProps) {
  const { actions } = useCascadingPanels();

  const handleGetStarted = () => {
    // Open the category picker panel
    actions.openPanel('category-picker', {}, { parentId: panel.id });
  };

  return (
    <PanelWrapper
      panel={panel}
      title="Book Your Appointment"
      subtitle="Let's find the perfect service for you"
    >
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-dusty-rose/20 to-warm-sand/20 mb-6"
        >
          <Sparkles className="w-10 h-10 text-dusty-rose" />
        </motion.div>

        <h4 className="text-2xl font-serif text-dune mb-3">
          What would you like to book today?
        </h4>
        <p className="text-sage mb-8 max-w-md mx-auto">
          Select from our range of services including lashes, brows, waxing, and more.
          We&apos;ll help you find the perfect treatment and artist.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGetStarted}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-dusty-rose to-[rgb(255,192,203)] text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
        >
          <Calendar className="w-5 h-5" />
          Get Started
        </motion.button>
      </div>
    </PanelWrapper>
  );
}

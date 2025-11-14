'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, DollarSign } from 'lucide-react';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import { VagaroBookingWidget } from '@/components/VagaroBookingWidget';
import type { Panel, SchedulePanelData } from '@/types/panel-stack';

interface SchedulePanelProps {
  panel: Panel;
}

export function SchedulePanel({ panel }: SchedulePanelProps) {
  const { actions } = usePanelStack();
  const data = panel.data as SchedulePanelData;
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  // Update panel summary when docked
  useEffect(() => {
    const summary = `${data.service.name}`;
    actions.updatePanelSummary(panel.id, summary);
  }, [data, panel.id, actions]);

  return (
    <PanelWrapper
      panel={panel}
      title="Select Your Time"
      subtitle={data.service.name}
    >
      <div className="space-y-4">
        {/* Booking Summary Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 py-3 px-4 rounded-xl bg-gradient-to-r from-sage/5 to-ocean-mist/5 border border-sage/10"
        >
          <div className="flex-1">
            <p className="text-xs text-dune/60 mb-0.5">Booking</p>
            <p className="font-medium text-dune">{data.service.name}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {data.service.durationMinutes && (
              <div className="flex items-center gap-1.5 text-dune/70">
                <Clock className="w-4 h-4" />
                <span>{data.service.durationMinutes} min</span>
              </div>
            )}
            {data.service.priceStarting && (
              <div className="flex items-center gap-1.5 font-medium text-terracotta">
                <DollarSign className="w-4 h-4" />
                <span>{(data.service.priceStarting / 100).toFixed(0)}+</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Widget Container - Full Width/Height */}
        <div className="relative -mx-4 -mb-4 md:-mx-6 md:-mb-6">
          {/* Loading Overlay */}
          {!isWidgetLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-10 glass flex items-center justify-center min-h-[500px]"
            >
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-3" />
                <p className="text-sm text-dune/60">Loading scheduling...</p>
              </div>
            </motion.div>
          )}

          {/* Vagaro Widget - Fills Remaining Panel Space */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-full"
          >
            <VagaroBookingWidget
              businessId={process.env.NEXT_PUBLIC_VAGARO_BUSINESS_ID}
              serviceId={data.service.vagaroServiceId || undefined}
              className="w-full min-h-[500px]"
            />
          </motion.div>
        </div>
      </div>
    </PanelWrapper>
  );
}

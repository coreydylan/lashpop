'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { PanelWrapper } from '../PanelWrapper';
import { usePanelStack } from '@/contexts/PanelStackContext';
import type { Panel, ServicePanelData } from '@/types/panel-stack';

interface ServicePanelProps {
  panel: Panel;
}

export function ServicePanel({ panel }: ServicePanelProps) {
  const { state, actions } = usePanelStack();
  const data = panel.data as ServicePanelData;
  const [activeTab, setActiveTab] = useState(data.subcategories[0]?.id || '');

  // Filter services by active subcategory
  const filteredServices = useMemo(() => {
    if (!activeTab || data.subcategories.length === 0) return data.services;
    return data.services.filter(service => service.subcategorySlug === activeTab);
  }, [activeTab, data.services, data.subcategories]);

  // Update panel summary based on selections
  useEffect(() => {
    const activeSubcat = data.subcategories.find(s => s.id === activeTab);
    const summary = activeSubcat
      ? `${activeSubcat.name} · ${filteredServices.length} services`
      : `${data.services.length} services`;
    actions.updatePanelSummary(panel.id, summary);
  }, [activeTab, filteredServices.length, data.subcategories, data.services.length, panel.id, actions]);

  const handleServiceClick = (service: any) => {
    actions.openPanel(
      'service-detail',
      {
        service,
        fromPage: false,
      },
      { parentId: panel.id }
    );
  };

  // Swipe handlers for switching between service panels (mobile)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (panel.state === 'docked' && panel.swipeEnabled) {
        actions.expandNextServicePanel();
      }
    },
    onSwipedRight: () => {
      if (panel.state === 'docked' && panel.swipeEnabled) {
        actions.expandPreviousServicePanel();
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: false,
  });

  return (
    <div {...swipeHandlers}>
      <PanelWrapper
        panel={panel}
        title={data.categoryName}
        subtitle={`${filteredServices.length} services available`}
      >
        {/* Subcategory Tabs */}
        {data.subcategories.length > 0 && (
          <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {data.subcategories.map(subcat => (
              <button
                key={subcat.id}
                onClick={() => setActiveTab(subcat.id)}
                className={`
                  px-3 py-1.5 md:px-4 md:py-2 rounded-full whitespace-nowrap transition-all text-sm md:text-base
                  ${
                    activeTab === subcat.id
                      ? 'bg-dusty-rose text-white shadow-md'
                      : 'bg-sage/10 text-sage hover:bg-sage/20'
                  }
                `}
              >
                {subcat.name}
              </button>
            ))}
          </div>
        )}

        {/* Service Cards - Horizontal Scroll */}
        <div className="relative">
          {/* Scroll indicators (desktop only) */}
          <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10">
            <div className="w-8 h-8 rounded-full bg-cream/80 backdrop-blur flex items-center justify-center shadow-lg">
              <ChevronLeft className="w-5 h-5 text-sage" />
            </div>
          </div>
          <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10">
            <div className="w-8 h-8 rounded-full bg-cream/80 backdrop-blur flex items-center justify-center shadow-lg">
              <ChevronRight className="w-5 h-5 text-sage" />
            </div>
          </div>

          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {filteredServices.map((service, index) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleServiceClick(service)}
                className="flex-shrink-0 w-56 md:w-64 p-3 md:p-4 rounded-xl glass hover:shadow-lg transition-all text-left"
              >
                {/* Service image placeholder */}
                <div className="aspect-video bg-warm-sand/20 rounded-lg mb-2 md:mb-3" />

                {/* Service name */}
                <h4 className="font-medium text-dune mb-1 md:mb-2 text-sm md:text-base truncate">
                  {service.name}
                </h4>

                {/* Service subtitle */}
                {service.subtitle && (
                  <p className="text-xs text-sage/80 mb-2 line-clamp-1">{service.subtitle}</p>
                )}

                {/* Price and duration */}
                <div className="flex items-center justify-between text-xs md:text-sm text-sage">
                  <span className="font-medium">${(service.priceStarting / 100).toFixed(0)}+</span>
                  <span>{service.durationMinutes} min</span>
                </div>

                {/* View details indicator */}
                <div className="mt-2 md:mt-3 flex items-center text-xs md:text-sm text-dusty-rose">
                  View Details
                  <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filteredServices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sage">No services found in this category.</p>
          </div>
        )}
      </PanelWrapper>
    </div>
  );
}

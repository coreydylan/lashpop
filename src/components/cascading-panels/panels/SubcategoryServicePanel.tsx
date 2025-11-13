'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { PanelWrapper } from '../PanelWrapper';
import { useCascadingPanels } from '@/contexts/CascadingPanelContext';
import type { PanelStackItem, SubcategoryServicePanelData } from '@/types/cascading-panels';

interface SubcategoryServicePanelProps {
  panel: PanelStackItem;
}

export function SubcategoryServicePanel({ panel }: SubcategoryServicePanelProps) {
  const { actions } = useCascadingPanels();
  const data = panel.data as SubcategoryServicePanelData;
  const [activeTab, setActiveTab] = useState(data.subcategories[0]?.id);

  // Filter services by active subcategory
  const filteredServices = useMemo(() => {
    if (!activeTab) return data.services;
    return data.services.filter(service => service.subcategorySlug === activeTab);
  }, [activeTab, data.services]);

  const handleServiceClick = (service: any) => {
    actions.openPanel('service-detail', { service }, { parentId: panel.id });
  };

  return (
    <PanelWrapper
      panel={panel}
      title={data.categoryName}
      subtitle={`${filteredServices.length} services available`}
      showCollapseToggle
    >
      {/* Subcategory Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {data.subcategories.map(subcat => (
          <button
            key={subcat.id}
            onClick={() => setActiveTab(subcat.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              activeTab === subcat.id
                ? 'bg-dusty-rose text-white'
                : 'bg-sage/10 text-sage hover:bg-sage/20'
            }`}
          >
            {subcat.name}
          </button>
        ))}
      </div>

      {/* Service Cards - Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
        {filteredServices.map((service, index) => (
          <motion.button
            key={service.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleServiceClick(service)}
            className="flex-shrink-0 w-64 p-4 rounded-xl glass hover:shadow-lg transition-all text-left"
          >
            <div className="aspect-video bg-warm-sand/20 rounded-lg mb-3" />
            <h4 className="font-medium text-dune mb-2">{service.name}</h4>
            <div className="flex items-center justify-between text-sm text-sage">
              <span>${(service.priceStarting / 100).toFixed(0)}+</span>
              <span>{service.durationMinutes} min</span>
            </div>
            <div className="mt-3 flex items-center text-sm text-dusty-rose">
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </motion.button>
        ))}
      </div>
    </PanelWrapper>
  );
}

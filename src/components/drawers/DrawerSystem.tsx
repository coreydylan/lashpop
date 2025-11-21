"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DiscoverDrawer from './DiscoverDrawer';
import { useDrawer } from './DrawerContext';

interface Service {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string;
  durationMinutes: number;
  priceStarting: number;
  imageUrl: string | null;
  color: string | null;
  displayOrder: number;
  categoryName: string | null;
  categorySlug: string | null;
  subcategoryName: string | null;
  subcategorySlug: string | null;
}

interface DrawerSystemProps {
  services: Service[];
}

export default function DrawerSystem({ services }: DrawerSystemProps) {
  const { activeDrawer, drawerStates } = useDrawer();

  // Check if any drawer is expanded
  const hasExpandedDrawer = drawerStates.discover === 'expanded' || drawerStates.services === 'expanded';

  return (
    <>
      {/* Beautiful gradient overlay when drawer is expanded */}
      <AnimatePresence>
        {hasExpandedDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-30 pointer-events-none"
          >
            {/* Soft gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-dune/10 via-transparent to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply blur to page content when drawer is expanded */}
      {hasExpandedDrawer && (
        <style jsx global>{`
          .page-content {
            filter: blur(6px);
            transform: scale(0.98);
            transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
          }
        `}</style>
      )}

      {/* Drawer Components */}
      <DiscoverDrawer />
    </>
  );
}
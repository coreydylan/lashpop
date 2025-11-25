'use client';

import { useEffect, useState } from 'react';
import { TopPanelContainer } from './containers/TopPanelContainer';
import { BottomSheetContainer } from './containers/BottomSheetContainer';
import { AutoDockOnScroll } from './AutoDockOnScroll';

interface PanelStackRendererProps {
  /** Force a specific render mode (for testing/overrides) */
  forceMode?: 'top' | 'bottom';
  /** Breakpoint for switching between top and bottom modes (default: 768) */
  breakpoint?: number;
  /** Disable AutoDockOnScroll behavior */
  disableAutoDock?: boolean;
}

export function PanelStackRenderer({
  forceMode,
  breakpoint = 768,
  disableAutoDock = false
}: PanelStackRendererProps) {
  const [renderMode, setRenderMode] = useState<'top' | 'bottom'>('top');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (forceMode) {
      setRenderMode(forceMode);
      return;
    }

    const checkMode = () => {
      setRenderMode(window.innerWidth < breakpoint ? 'bottom' : 'top');
    };

    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, [forceMode, breakpoint]);

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  if (renderMode === 'bottom') {
    return <BottomSheetContainer />;
  }

  return (
    <>
      <TopPanelContainer />
      {!disableAutoDock && <AutoDockOnScroll />}
    </>
  );
}

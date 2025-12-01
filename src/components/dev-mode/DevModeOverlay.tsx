'use client';

/**
 * Dev Mode Overlay
 *
 * Floating panel that provides development tools when dev mode is enabled.
 * Features: Event monitor, Crop adjuster GUI, shared status bar
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Activity,
  Crop,
  ChevronDown,
  ChevronUp,
  Bug,
  Eye,
  EyeOff,
  Radio,
} from 'lucide-react';
import { useDevMode } from '@/contexts/DevModeContext';
import { useVagaroWidget } from '@/contexts/VagaroWidgetContext';
import { VagaroEventMonitor } from './VagaroEventMonitor';
import { CropAdjuster } from './CropAdjuster';
import { CROP_CONFIG, type BookingFlowStep } from '@/lib/vagaro-events';

// Step labels for display
const STEP_LABELS: Record<BookingFlowStep, string> = {
  idle: 'Idle',
  widget_loaded: 'Widget Loaded',
  service_selected: 'Service Selected',
  calendar_view: 'Calendar View',
  login_view: 'Login View',
  form_view: 'Form View',
  payment_view: 'Payment View',
  completed: 'Completed',
};

// Step colors
const STEP_COLORS: Record<BookingFlowStep, string> = {
  idle: 'bg-stone-500',
  widget_loaded: 'bg-blue-500',
  service_selected: 'bg-green-500',
  calendar_view: 'bg-amber-500',
  login_view: 'bg-purple-500',
  form_view: 'bg-cyan-500',
  payment_view: 'bg-orange-500',
  completed: 'bg-emerald-500',
};

export function DevModeOverlay() {
  const { state, actions } = useDevMode();
  const { state: widgetState } = useVagaroWidget();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!state.isEnabled) {
    return null;
  }

  // Determine active step (simulated takes priority)
  const activeStep = state.simulatedStep || widgetState.currentStep;
  const isSimulating = !!state.simulatedStep;
  const currentCrop = state.cropOverrides[activeStep] || CROP_CONFIG[activeStep];

  // Floating indicator when panel is closed
  if (!state.isPanelOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={actions.openPanel}
        className="fixed bottom-6 right-6 z-[9999] w-12 h-12 bg-dusty-rose text-white rounded-full shadow-lg flex items-center justify-center"
        title="Open Dev Mode Panel"
      >
        <Bug className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[9999] bg-stone-900 text-stone-100 rounded-lg shadow-2xl overflow-hidden"
        style={{
          bottom: 20,
          right: 20,
          width: isMinimized ? 320 : 420,
          maxHeight: isMinimized ? 48 : '85vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-stone-800 border-b border-stone-700">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-dusty-rose" />
            <span className="text-sm font-medium">Dev Mode</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Live Preview Toggle */}
            <button
              onClick={() => actions.setLivePreview(!state.isLivePreview)}
              className={`p-1.5 rounded transition-colors ${
                state.isLivePreview
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
              title={state.isLivePreview ? 'Live Preview On' : 'Live Preview Off'}
            >
              {state.isLivePreview ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>

            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-stone-400 hover:text-stone-200 rounded transition-colors"
            >
              {isMinimized ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={actions.closePanel}
              className="p-1.5 text-stone-400 hover:text-stone-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex flex-col" style={{ maxHeight: 'calc(85vh - 44px)' }}>
            {/* ============================================ */}
            {/* SHARED STATUS BAR - Shows current state */}
            {/* ============================================ */}
            <div className="px-4 py-3 bg-gradient-to-r from-stone-800 to-stone-800/50 border-b border-stone-700">
              {/* Current Step */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${STEP_COLORS[activeStep]} ${!isSimulating ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-medium">{STEP_LABELS[activeStep]}</span>
                  {isSimulating && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-400 rounded font-medium">
                      PREVIEW
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <Radio className={`w-3 h-3 ${widgetState.isLoaded ? 'text-green-400' : 'text-stone-600'}`} />
                  {widgetState.isLoaded ? 'Widget Ready' : 'Waiting...'}
                </div>
              </div>

              {/* Step Progress Bar */}
              <div className="flex items-center gap-0.5 mb-2">
                {Object.keys(STEP_LABELS).map((step, index) => {
                  const steps = Object.keys(STEP_LABELS);
                  const currentIndex = steps.indexOf(activeStep);
                  const isActive = index === currentIndex;
                  const isPast = index < currentIndex;

                  return (
                    <div
                      key={step}
                      className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                        isActive
                          ? isSimulating ? 'bg-cyan-500' : 'bg-dusty-rose'
                          : isPast
                          ? isSimulating ? 'bg-cyan-500/40' : 'bg-dusty-rose/40'
                          : 'bg-stone-700'
                      }`}
                      title={STEP_LABELS[step as BookingFlowStep]}
                    />
                  );
                })}
              </div>

              {/* Current Crop Values - Quick View */}
              <div className="flex items-center gap-4 text-[11px] text-stone-400">
                <span>
                  Crop: <span className="text-stone-300 font-mono">{currentCrop.marginTop}px</span>
                </span>
                <span>
                  Height: <span className="text-stone-300 font-mono">{currentCrop.minHeight}px</span>
                </span>
                <span>
                  Mask: <span className="text-stone-300 font-mono">{currentCrop.maskHeight}px</span>
                </span>
                {state.cropOverrides[activeStep] && (
                  <span className="text-amber-400">Modified</span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-700">
              <button
                onClick={() => actions.setActiveTab('events')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors ${
                  state.activeTab === 'events'
                    ? 'text-dusty-rose border-b-2 border-dusty-rose bg-stone-800/50'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                Events
                {state.events.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-dusty-rose/20 text-dusty-rose rounded">
                    {state.events.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => actions.setActiveTab('crops')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors ${
                  state.activeTab === 'crops'
                    ? 'text-dusty-rose border-b-2 border-dusty-rose bg-stone-800/50'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Crop className="w-4 h-4" />
                Crops
                {Object.keys(state.cropOverrides).length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded">
                    {Object.keys(state.cropOverrides).length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {state.activeTab === 'events' && <VagaroEventMonitor />}
              {state.activeTab === 'crops' && <CropAdjuster />}
            </div>

            {/* Footer */}
            <div className="px-4 py-1.5 border-t border-stone-700 bg-stone-800/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-stone-500">
                  Click logo 5x to toggle
                </span>
                <button
                  onClick={actions.disable}
                  className="text-[10px] text-stone-500 hover:text-red-400 transition-colors"
                >
                  Disable
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

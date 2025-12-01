'use client';

/**
 * Crop Adjuster
 *
 * GUI for adjusting Vagaro widget crop settings per booking flow step.
 * Changes apply live to the actual widget on the page.
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  Maximize2,
  AlertCircle,
} from 'lucide-react';
import { useDevMode } from '@/contexts/DevModeContext';
import {
  CROP_CONFIG,
  type BookingFlowStep,
  type CropSettings,
} from '@/lib/vagaro-events';

// Step display info
const STEP_INFO: Record<BookingFlowStep, { label: string; icon: string }> = {
  idle: { label: 'Idle', icon: '⏸' },
  widget_loaded: { label: 'Widget Loaded', icon: '✓' },
  service_selected: { label: 'Service Selected', icon: '🎯' },
  calendar_view: { label: 'Calendar', icon: '📅' },
  login_view: { label: 'Login', icon: '🔐' },
  form_view: { label: 'Form', icon: '📝' },
  payment_view: { label: 'Payment', icon: '💳' },
  completed: { label: 'Complete', icon: '🎉' },
};

const STEPS = Object.keys(STEP_INFO) as BookingFlowStep[];

interface QuickAdjustProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  icon: React.ReactNode;
}

function QuickAdjust({ label, value, onChange, step = 10, icon }: QuickAdjustProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-stone-400 w-20">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <button
        onClick={() => onChange(value - step)}
        className="p-1 text-stone-400 hover:text-white hover:bg-stone-700 rounded transition-colors"
      >
        <ArrowDown className="w-3 h-3" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 px-2 py-1 text-xs text-center bg-stone-800 border border-stone-600 rounded focus:outline-none focus:border-dusty-rose font-mono"
      />
      <button
        onClick={() => onChange(value + step)}
        className="p-1 text-stone-400 hover:text-white hover:bg-stone-700 rounded transition-colors"
      >
        <ArrowUp className="w-3 h-3" />
      </button>
    </div>
  );
}

export function CropAdjuster() {
  const { state, actions } = useDevMode();
  const [copied, setCopied] = useState(false);

  // Use the context's simulated step
  const activeStep = state.simulatedStep || 'idle';

  const handleCopyConfig = async () => {
    const config = actions.exportCropConfig();
    await navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSettingsForStep = (step: BookingFlowStep): CropSettings => {
    return state.cropOverrides[step] || CROP_CONFIG[step];
  };

  const hasOverride = (step: BookingFlowStep): boolean => {
    return step in state.cropOverrides;
  };

  const updateSetting = (
    step: BookingFlowStep,
    key: keyof CropSettings,
    value: number
  ) => {
    const current = getSettingsForStep(step);
    const newSettings = {
      ...current,
      [key]: value,
    };
    console.log('[CropAdjuster] Setting crop override:', {
      step,
      key,
      value,
      newSettings,
    });
    actions.setCropOverride(step, newSettings);
  };

  const currentSettings = getSettingsForStep(activeStep);

  // Debug log when state changes
  console.log('[CropAdjuster] Render:', {
    activeStep,
    simulatedStep: state.simulatedStep,
    isLivePreview: state.isLivePreview,
    cropOverrides: state.cropOverrides,
    currentSettings,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-700 bg-stone-800/30">
        <span className="text-xs text-stone-400">
          {Object.keys(state.cropOverrides).length} modified
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={actions.resetAllCropOverrides}
            className="flex items-center gap-1 px-2 py-1 text-xs text-stone-400 hover:text-white bg-stone-700/50 hover:bg-stone-700 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={handleCopyConfig}
            className="flex items-center gap-1 px-2 py-1 text-xs text-stone-400 hover:text-white bg-stone-700/50 hover:bg-stone-700 rounded transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Export
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step Selector - Horizontal Pills */}
      <div className="px-4 py-3 border-b border-stone-700">
        <div className="text-[10px] text-stone-500 uppercase tracking-wider mb-2">
          Select Step to Adjust
        </div>
        <div className="flex flex-wrap gap-1">
          {STEPS.map((step) => {
            const info = STEP_INFO[step];
            const isActive = activeStep === step;
            const isModified = hasOverride(step);

            return (
              <button
                key={step}
                onClick={() => actions.setSimulatedStep(step)}
                className={`px-2 py-1 text-xs rounded-full transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-white'
                    : isModified
                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-stone-700/50 text-stone-400 hover:bg-stone-700'
                }`}
              >
                <span className="mr-1">{info.icon}</span>
                {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Editor */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {/* Step Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{STEP_INFO[activeStep].icon}</span>
              <span className="font-medium">{STEP_INFO[activeStep].label}</span>
            </div>
            {hasOverride(activeStep) && (
              <button
                onClick={() => actions.resetCropOverride(activeStep)}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Crop Controls */}
          <div className="space-y-3 p-3 bg-stone-800/50 rounded-lg">
            <QuickAdjust
              label="Crop"
              value={currentSettings.marginTop}
              onChange={(v) => updateSetting(activeStep, 'marginTop', v)}
              step={10}
              icon={<ArrowUp className="w-3 h-3" />}
            />
            <QuickAdjust
              label="Height"
              value={currentSettings.minHeight}
              onChange={(v) => updateSetting(activeStep, 'minHeight', v)}
              step={25}
              icon={<Maximize2 className="w-3 h-3" />}
            />
            <QuickAdjust
              label="Mask"
              value={currentSettings.maskHeight}
              onChange={(v) => updateSetting(activeStep, 'maskHeight', v)}
              step={5}
              icon={<div className="w-3 h-3 bg-gradient-to-b from-stone-400 to-transparent rounded-sm" />}
            />
          </div>

          {/* Instructions */}
          <div className="p-3 bg-stone-800/30 rounded-lg border border-stone-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-stone-400 space-y-1">
                <p>
                  <span className="text-cyan-400">Live preview:</span> Open a service booking panel to see changes in real-time.
                </p>
                <p>
                  <span className="text-amber-400">Tip:</span> Select a step above to preview that specific crop setting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

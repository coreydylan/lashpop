'use client';

/**
 * Vagaro Event Monitor
 *
 * Real-time display of Vagaro widget postMessage events.
 * Shows event stream and event details.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ChevronRight, Circle, Bug } from 'lucide-react';
import { useDevMode, DevModeEvent } from '@/contexts/DevModeContext';
import {
  subscribeToVagaroEvent,
  isVagaroEventListenerActive,
  getSubscriberCount,
  type VagaroEvent,
} from '@/lib/vagaro-events';

// Raw message type for debugging ALL postMessages
interface RawPostMessage {
  id: string;
  origin: string;
  data: unknown;
  receivedAt: Date;
  isVagaroLike: boolean;
}

// Event type colors
const EVENT_COLORS: Record<string, string> = {
  WidgetLoaded: 'bg-blue-500',
  BookNowClicked: 'bg-green-500',
  TimeSlotClicked: 'bg-amber-500',
  CustomerLogin: 'bg-purple-500',
  FormViewed: 'bg-cyan-500',
  FormResponseSubmitted: 'bg-cyan-600',
  CreditCardCaptureViewed: 'bg-orange-500',
  BookingCompleted: 'bg-emerald-500',
  TabClicked: 'bg-stone-500',
  ServiceSearched: 'bg-indigo-500',
  GiftCardApplied: 'bg-pink-500',
  PromoCodeApplied: 'bg-rose-500',
  ProductAddedToCart: 'bg-violet-500',
  ProductRemovedFromCart: 'bg-red-500',
};

export function VagaroEventMonitor() {
  const { state: devState, actions: devActions } = useDevMode();
  const [selectedEvent, setSelectedEvent] = useState<DevModeEvent | null>(null);
  const [listenerStatus, setListenerStatus] = useState({
    active: false,
    subscribers: 0,
  });
  const [showRawMessages, setShowRawMessages] = useState(false);
  const [rawMessages, setRawMessages] = useState<RawPostMessage[]>([]);
  const [selectedRawMessage, setSelectedRawMessage] = useState<RawPostMessage | null>(null);

  // Update listener status periodically
  useEffect(() => {
    const updateStatus = () => {
      setListenerStatus({
        active: isVagaroEventListenerActive(),
        subscribers: getSubscriberCount(),
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to Vagaro events and log them
  useEffect(() => {
    const unsubscribe = subscribeToVagaroEvent('*', (event: VagaroEvent) => {
      devActions.logEvent(event);
    });

    return () => {
      unsubscribe();
    };
  }, [devActions]);

  // Debug: Add a global listener to catch ALL postMessages and show in UI
  useEffect(() => {
    const debugListener = (event: MessageEvent) => {
      // Capture ALL postMessages - no filtering at all
      const isVagaroOrigin = event.origin === 'https://www.vagaro.com';
      const isVagaroLike = isVagaroOrigin || (event.data && typeof event.data === 'object' && 'eventName' in event.data);

      // Only add to UI list if it's not a framework message
      const isFramework = event.data?.type?.startsWith?.('webpack') ||
                          event.data?.type?.startsWith?.('next') ||
                          event.data?.source?.includes?.('react-devtools');

      if (!isFramework && event.data && typeof event.data === 'object') {
        const rawMsg: RawPostMessage = {
          id: `raw-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          origin: event.origin,
          data: event.data,
          receivedAt: new Date(),
          isVagaroLike,
        };

        setRawMessages(prev => [rawMsg, ...prev].slice(0, 50));
      }
    };

    window.addEventListener('message', debugListener);

    return () => {
      window.removeEventListener('message', debugListener);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3 as const,
      hour12: false,
    } as Intl.DateTimeFormatOptions);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Listener Status & Raw Toggle */}
      <div className="px-4 py-2 bg-stone-800/30 border-b border-stone-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${listenerStatus.active ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs text-stone-400">
            {listenerStatus.subscribers} subscriber(s)
          </span>
        </div>
        <button
          onClick={() => setShowRawMessages(!showRawMessages)}
          className={`flex items-center gap-1 text-xs transition-colors ${
            showRawMessages ? 'text-amber-400' : 'text-stone-500 hover:text-stone-300'
          }`}
        >
          <Bug className="w-3 h-3" />
          Raw ({rawMessages.length})
        </button>
      </div>

      {/* Raw Messages View (Debug) */}
      {showRawMessages && (
        <div className="border-b border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center justify-between px-4 py-2 border-b border-amber-500/20">
            <span className="text-xs text-amber-400 font-medium">
              Raw postMessages
            </span>
            <button
              onClick={() => setRawMessages([])}
              className="text-xs text-amber-400/60 hover:text-amber-400"
            >
              Clear
            </button>
          </div>
          <div className="max-h-[150px] overflow-y-auto">
            {rawMessages.length === 0 ? (
              <div className="px-4 py-3 text-xs text-amber-400/50 text-center">
                No postMessages captured yet
              </div>
            ) : (
              rawMessages.slice(0, 10).map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedRawMessage(selectedRawMessage?.id === msg.id ? null : msg)}
                  className={`px-4 py-1.5 border-b border-amber-500/10 cursor-pointer text-xs ${
                    msg.isVagaroLike ? 'bg-green-950/20' : ''
                  } ${selectedRawMessage?.id === msg.id ? 'bg-amber-900/30' : 'hover:bg-amber-900/20'}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${msg.isVagaroLike ? 'bg-green-400' : 'bg-amber-400'}`} />
                    <span className="text-amber-300 truncate flex-1 font-mono text-[10px]">
                      {msg.origin.replace('https://', '')}
                    </span>
                    <span className="text-amber-400/50 text-[10px]">
                      {formatTime(msg.receivedAt)}
                    </span>
                  </div>
                  {selectedRawMessage?.id === msg.id && (
                    <pre className="mt-2 text-[9px] bg-black/30 rounded p-2 overflow-x-auto text-amber-200 max-h-[100px] overflow-y-auto">
                      {JSON.stringify(msg.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Event List Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-stone-700">
        <span className="text-xs text-stone-400">
          {devState.events.length} events
        </span>
        <button
          onClick={devActions.clearEvents}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Event List */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: '300px' }}>
        {devState.events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-stone-500">
            <Circle className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-sm">No events yet</span>
            <span className="text-xs mt-1 text-stone-600">Interact with the Vagaro widget</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {devState.events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() =>
                  setSelectedEvent(selectedEvent?.id === event.id ? null : event)
                }
                className={`px-4 py-2 border-b border-stone-800 cursor-pointer transition-colors ${
                  selectedEvent?.id === event.id
                    ? 'bg-stone-800'
                    : 'hover:bg-stone-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Event indicator */}
                  <div
                    className={`w-2 h-2 rounded-full ${
                      EVENT_COLORS[event.eventName] || 'bg-stone-500'
                    }`}
                  />

                  {/* Event name */}
                  <span className="flex-1 text-sm font-mono">
                    {event.eventName}
                  </span>

                  {/* Time */}
                  <span className="text-xs text-stone-500">
                    {formatTime(event.receivedAt)}
                  </span>

                  {/* Expand indicator */}
                  <ChevronRight
                    className={`w-4 h-4 text-stone-500 transition-transform ${
                      selectedEvent?.id === event.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {selectedEvent?.id === event.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 pt-2 border-t border-stone-700">
                        <div className="text-xs text-stone-500 mb-1">
                          Timestamp: {formatTimestamp(event.timestamp)}
                        </div>
                        {event.data && Object.keys(event.data).length > 0 ? (
                          <pre className="text-xs bg-stone-900 rounded p-2 overflow-x-auto">
                            <code className="text-green-400">
                              {JSON.stringify(event.data, null, 2)}
                            </code>
                          </pre>
                        ) : (
                          <div className="text-xs text-stone-600 italic">
                            No data payload
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

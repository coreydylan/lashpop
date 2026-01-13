'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FindYourLookModal } from './FindYourLookModal';

interface FindYourLookContextValue {
  isOpen: boolean;
  openQuiz: () => void;
  closeQuiz: () => void;
}

const FindYourLookContext = createContext<FindYourLookContextValue | null>(null);

export function useFindYourLook() {
  const context = useContext(FindYourLookContext);
  if (!context) {
    throw new Error('useFindYourLook must be used within a FindYourLookProvider');
  }
  return context;
}

interface FindYourLookProviderProps {
  children: ReactNode;
  onBook?: (lashStyle: string) => void;
}

export function FindYourLookProvider({ children, onBook }: FindYourLookProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openQuiz = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeQuiz = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleBook = useCallback((lashStyle: string) => {
    // Default behavior: could open booking panel or navigate
    console.log('Book lash style:', lashStyle);
    if (onBook) {
      onBook(lashStyle);
    }
  }, [onBook]);

  return (
    <FindYourLookContext.Provider value={{ isOpen, openQuiz, closeQuiz }}>
      {children}
      <FindYourLookModal
        isOpen={isOpen}
        onClose={closeQuiz}
        onBook={handleBook}
      />
    </FindYourLookContext.Provider>
  );
}

export default FindYourLookProvider;

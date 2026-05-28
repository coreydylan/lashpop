'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FindYourLookModal } from './FindYourLookModal';
import type { QuizResultService } from '@/actions/quiz-photos';
import type { LashStyle } from './types';

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
  onBookService?: (service: QuizResultService, lashStyle: LashStyle) => void;
}

export function FindYourLookProvider({ children, onBookService }: FindYourLookProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openQuiz = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeQuiz = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <FindYourLookContext.Provider value={{ isOpen, openQuiz, closeQuiz }}>
      {children}
      <FindYourLookModal
        isOpen={isOpen}
        onClose={closeQuiz}
        onBookService={onBookService}
      />
    </FindYourLookContext.Provider>
  );
}

export default FindYourLookProvider;

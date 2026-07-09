'use client';
import { useState, useEffect } from 'react';
import type { AILanguage } from '@/lib/ai/language';

const STORAGE_KEY = 'ai-language';
const LANGUAGE_VALUES = new Set<AILanguage>(['vi', 'en', 'ja', 'ko']);

function getInitialLanguage(): AILanguage {
  if (typeof window === 'undefined') return 'vi';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return LANGUAGE_VALUES.has(stored as AILanguage) ? (stored as AILanguage) : 'vi';
}

export function useAILanguage() {
  const [language, setLanguageState] = useState<AILanguage>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: AILanguage) => {
    setLanguageState(lang);
  };

  return [language, setLanguage] as const;
}

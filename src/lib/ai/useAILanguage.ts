'use client';
import { useState, useEffect } from 'react';
import type { AILanguage } from '@/lib/ai/language';

const STORAGE_KEY = 'ai-language';

export function useAILanguage() {
  const [language, setLanguageState] = useState<AILanguage>('vi');

  useEffect(() => {
    setLanguageState((localStorage.getItem(STORAGE_KEY) as AILanguage) ?? 'vi');
  }, []);

  const setLanguage = (lang: AILanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  return [language, setLanguage] as const;
}

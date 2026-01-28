'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'no';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  languageLabel: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('erik-language') as Language;
    if (saved === 'en' || saved === 'no') {
      setLanguageState(saved);
    }

    // Listen for language changes from dropdown
    const handleLanguageChange = (e: CustomEvent) => {
      const newLang = e.detail as Language;
      if (newLang === 'en' || newLang === 'no') {
        setLanguageState(newLang);
      }
    };

    window.addEventListener('language-change', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('language-change', handleLanguageChange as EventListener);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('erik-language', lang);
  };

  const languageLabel = language === 'en' ? 'English' : 'Norsk';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languageLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

'use client';

import { useMemo, useState, useEffect } from 'react';

import { Globe } from 'lucide-react';

import { cn } from '../lib/utils';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../shadcn/dropdown-menu';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
];

export function SubMenuLanguageToggle() {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('erik-language');
    if (saved === 'en' || saved === 'no') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('erik-language', lang);
    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent('language-change', { detail: lang }));
  };

  const currentLanguage = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const MenuItems = useMemo(
    () =>
      LANGUAGES.map((lang) => {
        const isSelected = language === lang.code;

        return (
          <DropdownMenuItem
            className={cn('flex cursor-pointer items-center space-x-2', {
              'bg-muted': isSelected,
            })}
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        );
      }),
    [language],
  );

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger
          className={
            'hidden w-full items-center justify-between gap-x-3 lg:flex'
          }
        >
          <span className={'flex items-center space-x-2'}>
            <Globe className="h-5" />
            <span>Language</span>
          </span>
          <span className="text-xs text-muted-foreground">{currentLanguage?.flag}</span>
        </DropdownMenuSubTrigger>

        <DropdownMenuSubContent>{MenuItems}</DropdownMenuSubContent>
      </DropdownMenuSub>

      <div className={'lg:hidden'}>
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        {MenuItems}
      </div>
    </>
  );
}

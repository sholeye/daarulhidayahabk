/**
 * LanguageToggle - Simple button to switch between English and Arabic
 */

import React from 'react';
import { FiGlobe } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageToggle: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
      aria-label="Toggle language"
    >
      <FiGlobe className="w-4 h-4 text-foreground" />
      <span className="text-foreground">{language === 'en' ? 'عربي' : 'EN'}</span>
    </button>
  );
};

/**
 * IslamicValuesSection - Premium Islamic values section with i18n
 */

import React from 'react';
import { FiBook, FiFeather, FiHeart, FiShield } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

export const IslamicValuesSection: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const principles = [
    {
      icon: FiBook,
      title: t.quranSunnah,
      description: t.quranSunnahText,
    },
    {
      icon: FiHeart,
      title: t.ikhlas,
      description: t.ikhlasText,
    },
    {
      icon: FiShield,
      title: t.tarbiyyah,
      description: t.tarbiyyahText,
    },
    {
      icon: FiFeather,
      title: t.arabicMastery,
      description: t.arabicMasteryText,
    },
  ];

  return (
    <section 
      id="values" 
      dir={isRTL ? 'rtl' : 'ltr'}
      className="py-24 md:py-32 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden"
    >
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z' fill='none' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px',
        }} />
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t.islamicValuesTitle}
          </h2>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            {t.islamicValuesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {principles.map((principle, index) => (
            <div
              key={principle.title}
              className="group text-center p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <principle.icon className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-lg font-bold mb-3">{principle.title}</h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">{principle.description}</p>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="max-w-2xl mx-auto text-center animate-slide-up delay-500">
          <blockquote className="text-2xl md:text-3xl font-medium text-primary-foreground/90 leading-relaxed mb-4">
            {t.seekKnowledge}
          </blockquote>
          <p className="text-primary-foreground/60 text-sm">{t.prophetQuote}</p>
        </div>
      </div>
    </section>
  );
};
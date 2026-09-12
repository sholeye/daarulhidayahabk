/**
 * AboutSection - Premium about section with i18n
 */

import React from 'react';
import { FiTarget, FiHeart, FiBookOpen, FiStar } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

export const AboutSection: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const values = [
    {
      icon: FiTarget,
      title: t.ourMission,
      description: t.missionText,
    },
    {
      icon: FiHeart,
      title: t.ourValues,
      description: t.valuesText,
    },
    {
      icon: FiBookOpen,
      title: t.ourApproach,
      description: t.approachText,
    },
    {
      icon: FiStar,
      title: t.ourVision,
      description: t.visionText,
    },
  ];

  return (
    <section id="about" dir={isRTL ? 'rtl' : 'ltr'} className="py-20 md:py-28 bg-background relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-14 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {t.aboutTitle.split(' ')[0]} <span className="text-gradient-primary">{t.aboutTitle.split(' ').slice(1).join(' ') || t.schoolName}</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            {t.aboutDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6 max-w-5xl mx-auto">
          {values.map((value, index) => (
            <div
              key={value.title}
              className="group p-6 md:p-7 rounded-2xl bg-card border border-border card-premium animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <value.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Director Info */}
        <div className="mt-16 text-center animate-slide-up delay-500">
          <div className="inline-block max-w-lg w-full p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-border backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">{t.underDirection}</p>
            <h4 className="text-lg md:text-xl font-bold text-foreground mb-1">Abu Kathir AbdulHameed Olohunsola, MCPN</h4>
            <p className="text-sm text-primary font-medium">{t.director}, {t.schoolName}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

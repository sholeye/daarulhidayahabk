/**
 * HeroSection - Premium landing hero with stunning animations
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiBookOpen } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const HeroSection: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <section 
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative min-h-[85vh] flex items-center justify-center pt-28 pb-16 overflow-hidden"
    >
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Animated Decorative Elements */}
      <div className="absolute top-1/4 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-secondary/15 rounded-full blur-3xl animate-float delay-300" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      
      {/* Islamic Pattern Overlay */}
      <div className="absolute inset-0 islamic-pattern opacity-30" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-bounce-in backdrop-blur-sm">
            <FiBookOpen className="w-4 h-4" />
            <span>{t.establishedEducation}</span>
          </div>

          {/* Main Heading with Gradient */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6 animate-slide-up">
            <span className="text-gradient-primary">{t.schoolName}</span>
            <span className="block text-3xl md:text-4xl lg:text-5xl mt-3 font-semibold text-foreground/80">
              {t.schoolSubtitle}
            </span>
          </h1>

          {/* Motto */}
          <div className="mb-6 animate-slide-up delay-100">
            <p className="text-lg md:text-xl text-muted-foreground italic">
              {t.englishMotto}
            </p>
          </div>

          {/* Description */}
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto mb-10 animate-slide-up delay-200 leading-relaxed">
            {t.heroDescription}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-300">
            <Link to="/contact">
              <Button variant="hero" size="xl" className="btn-glow group">
                {t.enrollChild}
                <FiArrowRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
              </Button>
            </Link>
            <Link to="/curriculum">
              <Button variant="outline" size="xl" className="border-2 hover:bg-primary/5">
                {t.viewCurriculum}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

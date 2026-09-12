import React from 'react';
import { FiBook, FiMonitor, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export const ProgramsSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="programs" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.specialPrograms.split(' ')[0]} <span className="text-gradient-primary">{t.specialPrograms.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {t.programsSubtitle}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Single Combined Program Card */}
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-soft">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-5 md:p-6 text-primary-foreground">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                    <FiBook className="w-5 h-5" />
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                    <FiMonitor className="w-5 h-5" />
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary-foreground/20 text-xs font-medium">
                  {t.ongoingLabel}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-1">{t.tahfizProgram} + {t.itProgram}</h3>
              <p className="text-primary-foreground/70 text-sm">{t.tahfizProgramAr} + {t.itProgramAr}</p>
            </div>

            {/* Content */}
            <div className="p-5 md:p-6">
              <p className="text-muted-foreground mb-5 text-sm md:text-base">
                {t.tahfizItCombinedDesc}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                {/* Tahfiz Features */}
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                    <FiBook className="w-4 h-4 text-primary" />
                    {t.tahfizProgram}
                  </h4>
                  <ul className="space-y-1.5">
                    {[t.structuredMemorization, t.tajweedTraining, t.regularRevision, t.certifiedCompletion].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* IT Features */}
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                    <FiMonitor className="w-4 h-4 text-secondary" />
                    {t.itProgram}
                  </h4>
                  <ul className="space-y-1.5">
                    {[t.htmlStructure, t.cssStyling, t.responsiveDesign, t.handsOnProjects].map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <Link to="/contact">
                <Button variant="outline" size="sm" className="w-full hover:bg-primary hover:text-primary-foreground transition-colors">
                  {t.learnMore} <FiArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

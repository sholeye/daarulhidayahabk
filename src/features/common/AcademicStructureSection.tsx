import React from 'react';
import { FiChevronRight } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSharedData } from '@/contexts/SharedDataContext';

export const AcademicStructureSection: React.FC = () => {
  const { t } = useLanguage();
  const { schoolClasses } = useSharedData();
  const preparatoryClasses = schoolClasses.filter(c => c.level === 'preparatory');
  const primaryClasses = schoolClasses.filter(c => c.level === 'primary');

  return (
    <section id="structure" className="py-16 md:py-20 bg-muted/30 islamic-pattern">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t.academicStructure.split(' ')[0]} <span className="text-gradient-primary">{t.academicStructure.split(' ').slice(1).join(' ')}</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            {t.academicStructureSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl p-5 md:p-6 border border-border shadow-soft">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">P</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{t.preparatoryLevel}</h3>
                <p className="text-sm text-muted-foreground">{t.preparatoryDesc}</p>
              </div>
            </div>
            <div className="space-y-2">
              {preparatoryClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-3">
                    <FiChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">{cls.nameArabic}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-2xl p-5 md:p-6 border border-border shadow-soft">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                <span className="text-secondary font-bold">I</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{t.primaryLevel}</h3>
                <p className="text-sm text-muted-foreground">{t.primaryDesc}</p>
              </div>
            </div>
            <div className="space-y-2">
              {primaryClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-3">
                    <FiChevronRight className="w-4 h-4 text-secondary group-hover:translate-x-1 transition-transform" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">{cls.nameArabic}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { Navbar } from '@/features/common/Navbar';
import { Footer } from '@/features/common/Footer';
import { CurriculumSection } from '@/features/common/CurriculumSection';
import { AcademicStructureSection } from '@/features/common/AcademicStructureSection';
import { ProgramsSection } from '@/features/common/ProgramsSection';
import { ContactCTASection } from '@/features/common/ContactCTASection';
import { useLanguage } from '@/contexts/LanguageContext';

const Curriculum: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-14 md:py-16 bg-muted/30 islamic-pattern">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t.curriculumTitle.split(' ')[0]} <span className="text-gradient-primary">{t.curriculumTitle.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                {t.curriculumSubtitle}
              </p>
            </div>
          </div>
        </section>

        <AcademicStructureSection />
        <CurriculumSection />
        <ProgramsSection />
        <ContactCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Curriculum;

import React from 'react';
import { Navbar } from '@/features/common/Navbar';
import { Footer } from '@/features/common/Footer';
import { AboutSection } from '@/features/common/AboutSection';
import { ContactCTASection } from '@/features/common/ContactCTASection';
import { FiBookOpen, FiHeart, FiUsers, FiAward } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

const About: React.FC = () => {
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
                {t.aboutTitle.split(' ')[0]} <span className="text-gradient-primary">{t.aboutTitle.split(' ').slice(1).join(' ') || t.schoolName}</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-3">
                {t.aboutDescription}
              </p>
              <p className="text-lg italic text-primary">
                {t.englishMotto}
              </p>
            </div>
          </div>
        </section>

        {/* History & Background */}
        <section className="py-14 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">{t.ourStory}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-3 text-sm md:text-base">
                    {t.ourStoryText1}
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    {t.ourStoryText2}
                  </p>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-3">{t.ourApproach}</h2>
                  <p className="text-muted-foreground leading-relaxed mb-3 text-sm md:text-base">
                    {t.ourApproachIntro}
                  </p>
                  <ul className="space-y-2.5">
                    <li className="flex items-start gap-3">
                      <FiBookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm">{t.approachQuran}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiHeart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm">{t.approachCharacter}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiUsers className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm">{t.approachModern}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FiAward className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-sm">{t.approachIT}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AboutSection />
        <ContactCTASection />
      </main>
      <Footer />
    </div>
  );
};

export default About;

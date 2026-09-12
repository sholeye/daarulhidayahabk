/**
 * Quiz Portal Page - Dynamic from database
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiArrowRight } from 'react-icons/fi';
import { Navbar } from '@/features/common/Navbar';
import { Footer } from '@/features/common/Footer';
import { QuizLeaderboard } from '@/features/quiz/QuizLeaderboard';
import { QuizUpcoming } from '@/features/quiz/QuizUpcoming';
import { QuizPastResults } from '@/features/quiz/QuizPastResults';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchQuizHouses } from '@/services/quizService';
import type { House } from '@/types/quiz';

const houseGradients: Record<string, string> = {
  AbuBakr: 'from-emerald-500 to-emerald-700',
  Umar: 'from-blue-500 to-blue-700',
  Uthman: 'from-amber-500 to-amber-700',
  Ali: 'from-rose-500 to-rose-700',
};

const Quiz: React.FC = () => {
  const { t } = useLanguage();
  const [houses, setHouses] = useState<House[]>([]);

  useEffect(() => {
    fetchQuizHouses().then(setHouses).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <section className="relative py-14 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute inset-0 islamic-pattern opacity-30" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-5"><FiAward className="w-4 h-4" /><span>{t.everySunday}</span></div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                {t.quizCompetition.split(' ').slice(0, 2).join(' ')}{' '}
                <span className="text-gradient-primary">{t.quizCompetition.split(' ').slice(2).join(' ')}</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">{t.quizSubtitle}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
              {houses.map((house, index) => (
                <div key={house.name} className={`rounded-xl bg-gradient-to-br ${houseGradients[house.name] || 'from-primary to-primary/80'} p-4 text-white shadow-md hover:scale-[1.03] transition-transform duration-300`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-lg font-bold">{house.name.charAt(0)}</div>
                    <span className="text-white/70 text-xs font-medium">#{index + 1}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-0.5">{house.name}</h3>
                  <p className="text-white/70 text-xs mb-2">{house.nameArabic}</p>
                  <div className="flex justify-between items-end">
                    <div><span className="text-xl font-bold">{house.totalScore}</span><span className="text-white/70 text-xs ml-1">{t.pts}</span></div>
                    <span className="text-white/70 text-xs">{house.competitionsWon} {t.wins}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <QuizLeaderboard />
        <QuizUpcoming />
        <QuizPastResults />

        <section className="py-12 md:py-16 bg-gradient-to-r from-primary to-primary/80">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-primary-foreground mb-3">{t.readyToCompete}</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto text-sm md:text-base">{t.readyToCompeteDesc}</p>
            <Link to="/#contact-cta" className="inline-flex items-center gap-2 px-5 py-2.5 bg-background text-primary font-semibold rounded-xl hover:bg-background/90 transition-colors shadow-lg text-sm">{t.contactUs}<FiArrowRight className="w-4 h-4" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Quiz;

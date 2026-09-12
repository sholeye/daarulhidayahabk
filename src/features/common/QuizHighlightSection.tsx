/**
 * QuizHighlightSection - Dynamic from database
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiCalendar, FiUsers, FiArrowRight } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchHouseLeaderboard, fetchQuizCompetitions } from '@/services/quizService';
import type { LeaderboardEntry, QuizCompetition } from '@/types/quiz';
import { formatDate } from '@/utils/helpers';

const houseColors: Record<string, string> = {
  AbuBakr: 'bg-emerald-500', Umar: 'bg-blue-500', Uthman: 'bg-amber-500', Ali: 'bg-rose-500',
};

export const QuizHighlightSection: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [topHouses, setTopHouses] = useState<LeaderboardEntry[]>([]);
  const [upcoming, setUpcoming] = useState<QuizCompetition | null>(null);

  useEffect(() => {
    fetchHouseLeaderboard().then(h => setTopHouses(h.slice(0, 4))).catch(() => {});
    fetchQuizCompetitions().then(c => setUpcoming(c.find(x => x.status === 'upcoming') || null)).catch(() => {});
  }, []);

  return (
    <section id="quiz" className="py-16 md:py-24 bg-muted/30 islamic-pattern">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-5"><FiAward className="w-4 h-4" /><span>Every Sunday</span></div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t.quizCompetition.split(' ')[0]}{' '}<span className="text-gradient-secondary">{t.quizCompetition.split(' ').slice(1).join(' ')}</span></h2>
          <p className="text-muted-foreground text-base md:text-lg">{t.quizSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-primary-foreground">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center"><FiUsers className="w-5 h-5" /></div><div><h3 className="text-lg font-bold">{t.houses}</h3><p className="text-primary-foreground/70 text-sm">{t.leaderboard}</p></div></div>
            </div>
            <div className="p-4 space-y-3">
              {topHouses.length === 0 && <p className="text-center text-muted-foreground py-4">No data yet</p>}
              {topHouses.map((house, index) => (
                <div key={house.house} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-secondary text-secondary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>{index + 1}</div>
                  <div className={`w-9 h-9 rounded-full ${houseColors[house.house]} flex items-center justify-center text-white font-bold text-sm`}>{house.house.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-foreground text-sm">{house.house}</p><p className="text-xs text-muted-foreground">{house.houseArabic}</p></div>
                  <div className={`text-${isRTL ? 'left' : 'right'}`}><p className="font-bold text-primary text-sm">{house.totalScore}</p><p className="text-xs text-muted-foreground">{house.competitionsWon} {t.wins}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl bg-card border border-border shadow-soft p-5">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><FiCalendar className="w-5 h-5 text-secondary" /></div><div><h3 className="font-bold text-foreground">{t.upcomingCompetition}</h3><p className="text-sm text-muted-foreground">{upcoming?.title || 'No upcoming competition'}</p></div></div>
              {upcoming && (
                <>
                  <div className="p-4 rounded-xl bg-muted/50 mb-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm text-muted-foreground">Date & Time</p><p className="font-semibold text-foreground">{formatDate(upcoming.scheduledDate)}</p><p className="text-sm text-primary">{upcoming.scheduledTime}</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-muted/30"><p className="text-xl font-bold text-foreground">4</p><p className="text-xs text-muted-foreground">{t.houses}</p></div>
                    <div className="p-3 rounded-lg bg-muted/30"><p className="text-xl font-bold text-foreground">{upcoming.repsPerHouse}</p><p className="text-xs text-muted-foreground">{t.repsPerHouse}</p></div>
                  </div>
                </>
              )}
            </div>
            <Link to="/quiz" className="block"><Button variant="hero" size="xl" className="w-full group">{t.viewResults}<FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></Button></Link>
          </div>
        </div>
      </div>
    </section>
  );
};

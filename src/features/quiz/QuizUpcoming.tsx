/**
 * QuizUpcoming - Dynamic upcoming competition from database
 */

import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiUsers, FiPlay, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchQuizCompetitions, fetchQuizHouses } from '@/services/quizService';
import { formatDate } from '@/utils/helpers';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineLoader } from '@/components/ui/page-loader';
import type { QuizCompetition, House } from '@/types/quiz';

const houseColors: Record<string, string> = {
  AbuBakr: 'bg-emerald-500', Umar: 'bg-blue-500', Uthman: 'bg-amber-500', Ali: 'bg-rose-500',
};

export const QuizUpcoming: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loginCode, setLoginCode] = useState('');
  const [isQuizTime, setIsQuizTime] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [competition, setCompetition] = useState<QuizCompetition | null>(null);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchQuizCompetitions(), fetchQuizHouses()])
      .then(([comps, h]) => {
        // Prefer live, then upcoming
        const live = comps.find(c => c.status === 'live');
        const upcoming = comps.find(c => c.status === 'upcoming');
        setCompetition(live || upcoming || null);
        setHouses(h);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!competition) return;

    const checkTime = () => {
      if (competition.status === 'live') {
        setIsQuizTime(true);
        setTimeRemaining(t.quizIsLive);
        return;
      }

      const now = new Date();
      const [hours, minutes] = competition.scheduledTime.split(':').map(Number);
      const scheduledDate = new Date(competition.scheduledDate);
      scheduledDate.setHours(hours, minutes, 0, 0);
      const diff = scheduledDate.getTime() - now.getTime();

      if (diff <= 5 * 60 * 1000 && diff > -2 * 60 * 60 * 1000) {
        setIsQuizTime(true);
        setTimeRemaining(t.quizIsLive);
      } else if (diff > 0) {
        setIsQuizTime(false);
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setTimeRemaining(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
      } else {
        setIsQuizTime(false);
        setTimeRemaining(t.competitionEnded);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 30000);
    return () => clearInterval(interval);
  }, [competition, t]);

  const canStartQuiz = isQuizTime || competition?.status === 'live';

  const handleLogin = () => {
    const cleaned = loginCode.trim();
    if (!cleaned) return;
    if (canStartQuiz) {
      navigate(`/quiz/take?code=${encodeURIComponent(cleaned)}`);
    }
  };

  if (loading) return <div className="py-12"><InlineLoader /></div>;

  if (!competition) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><FiAlertCircle className="w-7 h-7 text-muted-foreground" /></div>
            <p className="text-muted-foreground">{t.noUpcoming}</p>
          </div>
        </div>
      </section>
    );
  }

  const repsByHouse = houses.reduce((acc, house) => {
    acc[house.name] = competition.representatives.filter(r => r.house === house.name);
    return acc;
  }, {} as Record<string, typeof competition.representatives>);

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t.upcomingCompetition}</h2>
          <p className="text-muted-foreground text-sm md:text-base">{competition.title}</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="rounded-2xl bg-card border border-border shadow-soft p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><FiCalendar className="w-6 h-6 text-primary" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t.scheduledFor}</p>
                      <p className="text-lg font-bold text-foreground">{formatDate(competition.scheduledDate)}</p>
                      <p className="text-primary font-medium text-sm">{competition.scheduledTime}</p>
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${canStartQuiz ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                    <FiClock className="w-3.5 h-3.5" /><span>{timeRemaining}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-xl bg-muted/50"><p className="text-2xl font-bold text-foreground">4</p><p className="text-xs text-muted-foreground">{t.houses}</p></div>
                  <div className="text-center p-3 rounded-xl bg-muted/50"><p className="text-2xl font-bold text-foreground">{competition.repsPerHouse}</p><p className="text-xs text-muted-foreground">{t.repsPerHouse}</p></div>
                </div>
              </div>

              <div className="rounded-2xl bg-card border border-border shadow-soft p-5">
                <div className="flex items-center gap-2 mb-5"><FiUsers className="w-5 h-5 text-primary" /><h3 className="text-base font-bold text-foreground">{t.representatives}</h3></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {houses.map(house => (
                    <div key={house.name} className="p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-2 mb-2"><div className={`w-3.5 h-3.5 rounded-full ${houseColors[house.name]}`} /><span className="font-semibold text-xs text-foreground">{house.name}</span></div>
                      <div className="space-y-1">
                        {(repsByHouse[house.name] || []).map(rep => (<p key={rep.id} className="text-xs text-muted-foreground truncate">{rep.name}</p>))}
                        {(!repsByHouse[house.name] || repsByHouse[house.name].length === 0) && <p className="text-xs text-muted-foreground italic">No reps assigned</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border shadow-soft p-5 h-fit lg:sticky lg:top-24">
              <div className="text-center mb-5">
                <div className={`w-16 h-16 rounded-xl mx-auto mb-3 flex items-center justify-center ${canStartQuiz ? 'bg-primary/10' : 'bg-muted'}`}>
                  {canStartQuiz ? <FiPlay className="w-8 h-8 text-primary" /> : <FiLock className="w-8 h-8 text-muted-foreground" />}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">{t.representativeLogin}</h3>
                <p className="text-xs text-muted-foreground">{canStartQuiz ? t.enterLoginCode : t.loginAvailableAtTime}</p>
              </div>
              <div className="space-y-3">
                <Input type="text" placeholder="XX-0000-000" value={loginCode} onChange={(e) => setLoginCode(e.target.value.toUpperCase())} disabled={!canStartQuiz} className="text-center font-mono text-base h-11" />
                <Button className="w-full h-11" disabled={!canStartQuiz || !loginCode.trim()} onClick={handleLogin}>{canStartQuiz ? t.startQuiz : t.notAvailableYet}</Button>
              </div>
              {!canStartQuiz && <p className="text-xs text-center text-muted-foreground mt-3">{t.quizButtonEnabled}</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

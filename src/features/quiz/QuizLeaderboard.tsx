/**
 * QuizLeaderboard - Dynamic house and student rankings from database
 */

import React, { useState, useEffect } from 'react';
import { FiAward, FiTrendingUp } from 'react-icons/fi';
import { fetchHouseLeaderboard, fetchStudentLeaderboard } from '@/services/quizService';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineLoader } from '@/components/ui/page-loader';
import type { LeaderboardEntry, StudentLeaderEntry } from '@/types/quiz';

const houseColors: Record<string, { bg: string; text: string; border: string }> = {
  AbuBakr: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20' },
  Umar: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' },
  Uthman: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' },
  Ali: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/20' },
};

const houseBgColors: Record<string, string> = {
  AbuBakr: 'bg-emerald-500', Umar: 'bg-blue-500', Uthman: 'bg-amber-500', Ali: 'bg-rose-500',
};

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  const styles = {
    1: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30',
    2: 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/30',
    3: 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-600/30',
  }[rank] || 'bg-muted text-muted-foreground';
  return <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${styles}`}>{rank}</div>;
};

export const QuizLeaderboard: React.FC = () => {
  const { t } = useLanguage();
  const [houseBoard, setHouseBoard] = useState<LeaderboardEntry[]>([]);
  const [studentBoard, setStudentBoard] = useState<StudentLeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchHouseLeaderboard(), fetchStudentLeaderboard()])
      .then(([h, s]) => { setHouseBoard(h); setStudentBoard(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16"><InlineLoader /></div>;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t.leaderboard}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Track the competition standings and see who's leading the race</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* House Leaderboard */}
          <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><FiAward className="w-6 h-6 text-primary" /></div>
                <div><h3 className="text-xl font-bold text-foreground">{t.houseStandings}</h3><p className="text-sm text-muted-foreground">{t.overallRankings}</p></div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {houseBoard.length === 0 && <p className="text-center text-muted-foreground py-8">No competition data yet</p>}
              {houseBoard.map((house, index) => (
                <div key={house.house} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:shadow-soft ${index === 0 ? `${houseColors[house.house]?.bg} ${houseColors[house.house]?.border} border` : 'bg-muted/30 hover:bg-muted/50'}`}>
                  <RankBadge rank={index + 1} />
                  <div className={`w-12 h-12 rounded-xl ${houseBgColors[house.house]} flex items-center justify-center text-white font-bold text-lg shadow-md`}>{house.house.charAt(0)}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-foreground">{house.house}</p><p className="text-sm text-muted-foreground">{house.houseArabic}</p></div>
                  <div className="text-right"><p className="text-2xl font-bold text-primary">{house.totalScore}</p><p className="text-xs text-muted-foreground">{house.competitionsWon} {t.wins}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Leaderboard */}
          <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border bg-gradient-to-r from-secondary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center"><FiTrendingUp className="w-6 h-6 text-secondary" /></div>
                <div><h3 className="text-xl font-bold text-foreground">{t.topStudents}</h3><p className="text-sm text-muted-foreground">{t.individualRankings}</p></div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {studentBoard.length === 0 && <p className="text-center text-muted-foreground py-8">No quiz results yet</p>}
              {studentBoard.map((student, index) => (
                <div key={`${student.name}-${student.house}`} className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:shadow-soft ${index === 0 ? 'bg-secondary/5 border border-secondary/20' : 'bg-muted/30 hover:bg-muted/50'}`}>
                  <RankBadge rank={index + 1} />
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center font-bold text-lg text-foreground border border-border">{student.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-foreground">{student.name}</p><div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${houseBgColors[student.house]}`} /><span className="text-sm text-muted-foreground">{student.house}</span></div></div>
                  <div className="text-right"><p className="text-2xl font-bold text-secondary">{student.totalScore}</p><p className="text-xs text-muted-foreground">{student.competitionsParticipated} {t.quizzes}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

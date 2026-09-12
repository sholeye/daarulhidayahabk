/**
 * QuizTake - Epic Quiz Taking Experience (Database-driven)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiClock, FiFlag, FiArrowLeft, FiArrowRight, FiCheck, FiX, FiZap, FiAward, FiTarget, FiStar, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InlineLoader } from '@/components/ui/page-loader';
import { fetchQuizCompetitions, submitQuizAnswer, updateRepresentative } from '@/services/quizService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuizSounds } from '@/hooks/useQuizSounds';
import { useConfetti } from '@/hooks/useConfetti';
import type { HouseName, QuizQuestion, QuizCompetition } from '@/types/quiz';

const CIRCUMFERENCE = 2 * Math.PI * 34;

const houseThemes: Record<HouseName, { gradient: string; bg: string; ring: string; glow: string; text: string }> = {
  AbuBakr: { gradient: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-500', ring: 'ring-emerald-500/50', glow: 'shadow-emerald-500/30', text: 'text-emerald-500' },
  Umar: { gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-500', ring: 'ring-blue-500/50', glow: 'shadow-blue-500/30', text: 'text-blue-500' },
  Uthman: { gradient: 'from-amber-500 to-amber-700', bg: 'bg-amber-500', ring: 'ring-amber-500/50', glow: 'shadow-amber-500/30', text: 'text-amber-500' },
  Ali: { gradient: 'from-rose-500 to-rose-700', bg: 'bg-rose-500', ring: 'ring-rose-500/50', glow: 'shadow-rose-500/30', text: 'text-rose-500' },
};

const inferHouseFromCode = (code: string): HouseName => {
  const prefix = code.slice(0, 2).toUpperCase();
  if (prefix === 'AB') return 'AbuBakr';
  if (prefix === 'UM') return 'Umar';
  if (prefix === 'UT') return 'Uthman';
  if (prefix === 'AL') return 'Ali';
  return 'AbuBakr';
};

const normalize = (value: string) => value.trim().toLowerCase();

const AnimatedTimer: React.FC<{ timeLeft: number; maxTime: number; theme: typeof houseThemes[HouseName] }> = ({ timeLeft, maxTime, theme }) => {
  const fraction = maxTime > 0 ? timeLeft / maxTime : 0;
  const offset = CIRCUMFERENCE * (1 - fraction);
  const isUrgent = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  return (
    <div className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${isCritical ? 'scale-110' : ''}`}>
      <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="40" cy="40" r="34" fill="none" strokeWidth="5" className="stroke-muted" />
        <circle
          cx="40" cy="40" r="34" fill="none" strokeWidth="5"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-linear ${isCritical ? 'stroke-destructive' : isUrgent ? 'stroke-amber-500' : theme.text.replace('text-', 'stroke-')}`}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        <FiClock className={`w-3.5 h-3.5 mb-0.5 ${isCritical ? 'text-destructive' : 'text-muted-foreground'}`} />
        <span className={`text-2xl font-bold tabular-nums ${isCritical ? 'text-destructive animate-pulse' : isUrgent ? 'text-amber-500' : 'text-foreground'}`}>{timeLeft}</span>
      </div>
    </div>
  );
};

const ScorePopup: React.FC<{ points: number; isCorrect: boolean; show: boolean }> = ({ points, isCorrect, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.5 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -30, scale: 0.8 }}
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2 p-6 rounded-2xl ${isCorrect ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
        {isCorrect ? <FiCheck className="w-12 h-12" /> : <FiX className="w-12 h-12" />}
        <span className="text-3xl font-bold">{isCorrect ? `+${points}` : '0'} pts</span>
      </motion.div>
    )}
  </AnimatePresence>
);

export const QuizTake: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [params] = useSearchParams();
  const code = (params.get('code') || '').trim();

  const { playCorrect, playWrong, playUrgent, playComplete } = useQuizSounds();
  const { celebrateCorrect, celebrateCompletion } = useConfetti();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [competition, setCompetition] = useState<QuizCompetition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizCompetitions()
      .then(comps => {
        // Prefer live, then upcoming
        const live = comps.find(c => c.status === 'live');
        const upcoming = comps.find(c => c.status === 'upcoming');
        setCompetition(live || upcoming || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const rep = competition?.representatives.find(r => r.loginCode === code);
  const repHouse: HouseName = rep?.house ?? inferHouseFromCode(code);
  const repName = rep?.name ?? code;
  const theme = houseThemes[repHouse];

  const assignedQuestions = useMemo<QuizQuestion[]>(() => {
    if (!competition) return [];
    const ids = rep?.assignedQuestions?.length ? rep.assignedQuestions : competition.questions.map(q => q.id);
    const selected = ids.map(id => competition.questions.find(q => q.id === id)).filter(Boolean) as QuizQuestion[];
    return selected.length ? selected : competition.questions;
  }, [competition, rep]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; isCorrect: boolean; points: number }>>({});
  const [draft, setDraft] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; points: number } | null>(null);

  const indexRef = useRef(index);
  useEffect(() => { indexRef.current = index; }, [index]);

  const current = assignedQuestions[index];

  useEffect(() => {
    if (!current) return;
    setDraft(answers[current.id]?.answer ?? '');
    setTimeLeft(current.timeLimit ?? 30);
    setShowResult(false);
  }, [current?.id]);

  const gradeQuestion = useCallback((q: QuizQuestion, ans: string) => {
    if (q.type === 'essay') return { isCorrect: ans.trim().length > 0, points: 0 };
    if (!ans.trim()) return { isCorrect: false, points: 0 };
    const isCorrect = normalize(ans) === normalize(q.correctAnswer);
    return { isCorrect, points: isCorrect ? q.points : 0 };
  }, []);

  const totalPossible = useMemo(() => assignedQuestions.reduce((sum, q) => sum + (q.type === 'essay' ? 0 : (q.points ?? 0)), 0), [assignedQuestions]);
  const totalScore = useMemo(() => Object.values(answers).reduce((sum, a) => sum + a.points, 0), [answers]);
  const correctCount = useMemo(() => Object.values(answers).filter(a => a.isCorrect).length, [answers]);

  const startTimeRef = useRef(Date.now());
  useEffect(() => { startTimeRef.current = Date.now(); }, [current?.id]);

  const goNext = useCallback((auto = false) => {
    if (!current || finished) return;
    const answerText = auto ? (answers[current.id]?.answer ?? '') : draft;
    const result = gradeQuestion(current, answerText);
    setAnswers(prev => ({ ...prev, [current.id]: { answer: answerText, ...result } }));
    setLastResult(result);
    setShowResult(true);
    if (soundEnabled) { result.isCorrect ? playCorrect() : playWrong(); }
    if (result.isCorrect) celebrateCorrect(repHouse);

    // Submit answer to DB
    if (competition && rep) {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      submitQuizAnswer({
        competitionId: competition.id,
        representativeId: rep.id,
        questionId: current.id,
        answer: answerText,
        isCorrect: result.isCorrect,
        pointsEarned: result.points,
        timeSpent,
        pendingGrade: current.type === 'essay',
      }).catch(console.error);
    }

    setTimeout(() => {
      setShowResult(false);
      if (indexRef.current >= assignedQuestions.length - 1) {
        setFinished(true);
        if (soundEnabled) playComplete();
        const finalScore = Object.values(answers).reduce((sum, a) => sum + a.points, 0) + result.points;
        celebrateCompletion(finalScore, totalPossible, repHouse);

        // Mark rep as completed
        if (rep) {
          updateRepresentative(rep.id, { has_completed: true, score: finalScore }).catch(console.error);
        }
        return;
      }
      setIndex(i => i + 1);
    }, 800);
  }, [assignedQuestions.length, current, draft, finished, gradeQuestion, answers, soundEnabled, playCorrect, playWrong, playComplete, celebrateCorrect, celebrateCompletion, repHouse, totalPossible, competition, rep]);

  const goBack = useCallback(() => {
    if (finished || showResult || index <= 0) return;
    setIndex(i => Math.max(0, i - 1));
  }, [finished, index, showResult]);

  useEffect(() => {
    if (finished || showResult || !current) return;
    const interval = window.setInterval(() => {
      setTimeLeft(tLeft => {
        if (tLeft === 6 && soundEnabled) playUrgent();
        if (tLeft <= 1) { window.setTimeout(() => goNext(true), 0); return 0; }
        return tLeft - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [current?.id, finished, showResult, goNext, soundEnabled, playUrgent]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><InlineLoader /></div>;

  if (!code) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6"><FiTarget className="w-10 h-10 text-muted-foreground" /></div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.representativeLogin}</h1>
          <p className="text-muted-foreground mb-8">{t.missingLoginCode}</p>
          <Link to="/quiz"><Button variant="outline" size="lg" className="gap-2"><FiArrowLeft className="w-5 h-5" />{t.backToPortal}</Button></Link>
        </motion.div>
      </div>
    );
  }

  if (!rep) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6"><FiX className="w-10 h-10 text-destructive" /></div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.error}</h1>
          <p className="text-muted-foreground mb-8">Invalid login code. Please check with your admin.</p>
          <Link to="/quiz"><Button variant="outline" size="lg" className="gap-2"><FiArrowLeft className="w-5 h-5" />{t.backToPortal}</Button></Link>
        </motion.div>
      </div>
    );
  }

  if (rep.hasCompleted) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"><FiCheck className="w-10 h-10 text-primary" /></div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Already Completed</h1>
          <p className="text-muted-foreground mb-4">You have already taken this quiz. Score: {rep.score} pts</p>
          <Link to="/quiz"><Button variant="outline" size="lg" className="gap-2"><FiArrowLeft className="w-5 h-5" />{t.backToPortal}</Button></Link>
        </motion.div>
      </div>
    );
  }

  if (!competition || assignedQuestions.length === 0) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6"><FiX className="w-10 h-10 text-destructive" /></div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t.error}</h1>
          <p className="text-muted-foreground mb-8">{t.unableToLoadQuestions}</p>
          <Link to="/quiz"><Button variant="outline" size="lg" className="gap-2"><FiArrowLeft className="w-5 h-5" />{t.backToPortal}</Button></Link>
        </motion.div>
      </div>
    );
  }

  if (finished) {
    const scorePercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    const isPerfect = totalScore === totalPossible && totalPossible > 0;
    const isExcellent = scorePercentage >= 80;
    const isGood = scorePercentage >= 60;

    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-3xl overflow-hidden">
          <div className={`relative bg-gradient-to-br ${theme.gradient} p-8 text-white overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                {isPerfect ? <FiStar className="w-12 h-12" /> : isExcellent ? <FiAward className="w-12 h-12" /> : <FiZap className="w-12 h-12" />}
              </motion.div>
              <h1 className="text-3xl font-bold mb-2">{t.quizCompleted}</h1>
              <p className="text-white/80">{repName} &bull; {repHouse}</p>
            </div>
          </div>
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.3 }}
                className={`relative w-40 h-40 rounded-full flex items-center justify-center ${isPerfect ? 'bg-primary/10 ring-4 ring-primary' : isExcellent ? 'bg-secondary/10 ring-4 ring-secondary' : isGood ? 'bg-accent/10 ring-4 ring-accent' : 'bg-muted ring-4 ring-muted-foreground'}`}>
                <div className="text-center"><span className="text-4xl font-bold text-foreground">{totalScore}</span><span className="text-lg text-muted-foreground">/{totalPossible}</span><p className="text-sm text-muted-foreground mt-1">{t.pts}</p></div>
              </motion.div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 text-center"><FiCheck className="w-6 h-6 text-primary mx-auto mb-2" /><p className="text-2xl font-bold text-foreground">{correctCount}</p><p className="text-sm text-muted-foreground">{t.correctAnswer}</p></div>
                <div className="p-4 rounded-2xl bg-muted/30 text-center"><FiTarget className="w-6 h-6 text-secondary mx-auto mb-2" /><p className="text-2xl font-bold text-foreground">{scorePercentage}%</p><p className="text-sm text-muted-foreground">{t.percentage}</p></div>
                <div className="p-4 rounded-2xl bg-muted/30 text-center"><FiAward className={`w-6 h-6 mx-auto mb-2 ${theme.text}`} /><p className="text-2xl font-bold text-foreground">{repHouse}</p><p className="text-sm text-muted-foreground">{t.house}</p></div>
                <div className="p-4 rounded-2xl bg-muted/30 text-center"><FiZap className="w-6 h-6 text-accent mx-auto mb-2" /><p className="text-2xl font-bold text-foreground">{assignedQuestions.length}</p><p className="text-sm text-muted-foreground">{t.questions}</p></div>
              </div>
            </div>
            <div className="text-center"><Link to="/quiz"><Button size="lg" className="gap-2"><FiArrowLeft className="w-5 h-5" />{t.backToPortal}</Button></Link></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active quiz question
  const questionText = language === 'ar' && current.questionArabic ? current.questionArabic : current.question;
  const progressPercent = ((index + 1) / assignedQuestions.length) * 100;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-3xl mx-auto space-y-6">
      <ScorePopup points={lastResult?.points ?? 0} isCorrect={lastResult?.isCorrect ?? false} show={showResult} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${theme.bg} flex items-center justify-center text-white font-bold`}>{repHouse.charAt(0)}</div>
          <div><p className="font-semibold text-foreground text-sm">{repName}</p><p className="text-xs text-muted-foreground">{repHouse}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {soundEnabled ? <FiVolume2 className="w-5 h-5 text-muted-foreground" /> : <FiVolumeX className="w-5 h-5 text-muted-foreground" />}
          </button>
          <Badge variant="secondary" className="text-sm">{totalScore} {t.pts}</Badge>
        </div>
      </motion.div>

      {/* Progress */}
      <div><div className="flex justify-between text-xs text-muted-foreground mb-2"><span>{t.question} {index + 1}/{assignedQuestions.length}</span><span>{Math.round(progressPercent)}%</span></div><Progress value={progressPercent} className="h-2" /></div>

      {/* Question Card */}
      <motion.div key={current.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <Badge variant="outline" className="mb-3 capitalize">{current.type.replace('_', '/')}</Badge>
            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-relaxed">{questionText}</h2>
          </div>
          <AnimatedTimer timeLeft={timeLeft} maxTime={current.timeLimit ?? 30} theme={theme} />
        </div>

        <div className="space-y-3 mt-6">
          {current.type === 'mcq' && current.options?.map((option, i) => (
            <motion.button key={i} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setDraft(option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${draft === option ? `${theme.ring} ring-2 border-transparent bg-primary/5` : 'border-border hover:border-muted-foreground/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${draft === option ? `${theme.bg} text-white` : 'bg-muted text-muted-foreground'}`}>{String.fromCharCode(65 + i)}</div>
                <span className="text-foreground font-medium">{option}</span>
              </div>
            </motion.button>
          ))}

          {current.type === 'true_false' && ['True', 'False'].map(option => (
            <motion.button key={option} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setDraft(option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${draft === option ? `${theme.ring} ring-2 border-transparent bg-primary/5` : 'border-border hover:border-muted-foreground/30'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${draft === option ? `${theme.bg} text-white` : 'bg-muted text-muted-foreground'}`}>{option === 'True' ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}</div>
                <span className="text-foreground font-medium">{option}</span>
              </div>
            </motion.button>
          ))}

          {(current.type === 'short_answer' || current.type === 'essay') && (
            <div>
              {current.type === 'essay' ? (
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.typeYourAnswer} className="w-full h-40 p-4 rounded-xl border-2 border-border bg-background text-foreground resize-none focus:ring-2 focus:border-transparent" style={{ ['--tw-ring-color' as string]: 'hsl(var(--primary))' }} />
              ) : (
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.typeYourAnswer} className="h-14 text-lg" />
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={goBack} disabled={index === 0 || showResult} className="gap-2"><FiArrowLeft className="w-4 h-4" />Back</Button>
        <Button onClick={() => goNext(false)} disabled={showResult || (!draft.trim() && current.type !== 'essay')} className="gap-2">
          {index < assignedQuestions.length - 1 ? (<>{t.next}<FiArrowRight className="w-4 h-4" /></>) : (<>{t.finish}<FiFlag className="w-4 h-4" /></>)}
        </Button>
      </div>
    </div>
  );
};

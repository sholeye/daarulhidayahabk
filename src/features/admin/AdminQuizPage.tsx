/**
 * AdminQuizPage - Database-driven Quiz Management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiCalendar, FiClock, FiUsers, FiHelpCircle, FiCopy, FiCheck, FiTrash2, FiPlay, FiBarChart2, FiAward } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InlineLoader } from '@/components/ui/page-loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import * as quizSvc from '@/services/quizService';
import { formatDate } from '@/utils/helpers';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { QuizQuestion, QuizCompetition, House, LeaderboardEntry } from '@/types/quiz';

const houseColors: Record<string, string> = {
  AbuBakr: 'bg-emerald-500', Umar: 'bg-blue-500', Uthman: 'bg-amber-500', Ali: 'bg-rose-500',
};

export const AdminQuizPage: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'competitions' | 'questions' | 'credentials' | 'analytics'>('competitions');
  const [loading, setLoading] = useState(true);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [competitions, setCompetitions] = useState<QuizCompetition[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [showNewCompetition, setShowNewCompetition] = useState(false);
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; compId?: string } | null>(null);

  const [showAddRep, setShowAddRep] = useState<string | null>(null);
  const [repForm, setRepForm] = useState({ name: '', house: 'AbuBakr', loginCode: '' });

  const [competitionForm, setCompetitionForm] = useState({ title: '', date: '', time: '10:00', repsPerHouse: 3 });
  const [questionForm, setQuestionForm] = useState<Partial<QuizQuestion>>({
    question: '', questionArabic: '', type: 'mcq', options: ['', '', '', ''],
    correctAnswer: '', points: 10, timeLimit: 30, maxPoints: 20, rubric: '', rubricArabic: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [q, c, h, lb] = await Promise.all([
        quizSvc.fetchQuizQuestions(),
        quizSvc.fetchQuizCompetitions(),
        quizSvc.fetchQuizHouses(),
        quizSvc.fetchHouseLeaderboard(),
      ]);
      setQuestions(q); setCompetitions(c); setHouses(h); setLeaderboard(lb);
    } catch (err) { console.error(err); toast.error('Failed to load quiz data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(t.codeCopied || 'Copied!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateQuestion = async () => {
    try {
      await quizSvc.createQuizQuestion(questionForm as Partial<QuizQuestion>);
      toast.success('Question added!');
      setShowNewQuestion(false);
      setQuestionForm({ question: '', questionArabic: '', type: 'mcq', options: ['', '', '', ''], correctAnswer: '', points: 10, timeLimit: 30, maxPoints: 20, rubric: '', rubricArabic: '' });
      loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to create question'); }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await quizSvc.deleteQuizQuestion(id);
      toast.success('Question deleted');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleCreateCompetition = async () => {
    if (!competitionForm.title || !competitionForm.date) { toast.error('Title and date required'); return; }
    try {
      await quizSvc.createQuizCompetition({
        title: competitionForm.title,
        scheduledDate: competitionForm.date,
        scheduledTime: competitionForm.time,
        repsPerHouse: competitionForm.repsPerHouse,
        questionIds: questions.map(q => q.id),
      });
      toast.success('Competition created!');
      setShowNewCompetition(false);
      setCompetitionForm({ title: '', date: '', time: '10:00', repsPerHouse: 3 });
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteCompetition = async (id: string) => {
    try {
      await quizSvc.deleteQuizCompetition(id);
      toast.success('Competition deleted');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAddRep = async (compId: string) => {
    if (!repForm.name || !repForm.loginCode) { toast.error('Name and login code required'); return; }
    const comp = competitions.find(c => c.id === compId);
    if (comp) {
      const houseReps = comp.representatives.filter(r => r.house === repForm.house);
      if (houseReps.length >= comp.repsPerHouse) {
        toast.error(`${repForm.house} already has ${comp.repsPerHouse} representative(s) — the maximum for this competition.`);
        return;
      }
    }
    try {
      await quizSvc.createQuizRepresentative({
        competitionId: compId,
        name: repForm.name,
        house: repForm.house,
        loginCode: repForm.loginCode,
        assignedQuestionIds: [],
      });
      toast.success('Representative added!');
      setShowAddRep(null);
      setRepForm({ name: '', house: 'AbuBakr', loginCode: '' });
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteRep = async (repId: string) => {
    try {
      await quizSvc.deleteQuizRepresentative(repId);
      toast.success('Representative removed');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSetCompetitionStatus = async (id: string, status: string) => {
    try {
      await quizSvc.updateCompetitionStatus(id, status);
      toast.success(`Competition set to ${status}`);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const upcomingCompetition = competitions.find(c => c.status === 'upcoming' || c.status === 'live');

  if (loading) return <InlineLoader />;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Confirmation"
        description={`Are you sure you want to delete this ${deleteTarget?.type}?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget?.type === 'question') handleDeleteQuestion(deleteTarget.id);
          if (deleteTarget?.type === 'competition') handleDeleteCompetition(deleteTarget.id);
          if (deleteTarget?.type === 'representative') handleDeleteRep(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t.quizManagement}</h1><p className="text-muted-foreground mt-1">{t.quizSubtitle}</p></div>
        <Button onClick={() => setShowNewCompetition(true)} className="gap-2"><FiPlus className="w-4 h-4" />{t.createCompetition}</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border"><FiCalendar className="w-8 h-8 text-primary mb-2" /><p className="text-2xl font-bold text-foreground">{competitions.length}</p><p className="text-sm text-muted-foreground">Competitions</p></div>
        <div className="p-4 rounded-2xl bg-card border border-border"><FiHelpCircle className="w-8 h-8 text-secondary mb-2" /><p className="text-2xl font-bold text-foreground">{questions.length}</p><p className="text-sm text-muted-foreground">{t.questionBank}</p></div>
        <div className="p-4 rounded-2xl bg-card border border-border"><FiUsers className="w-8 h-8 text-accent mb-2" /><p className="text-2xl font-bold text-foreground">{competitions.reduce((s, c) => s + c.representatives.length, 0)}</p><p className="text-sm text-muted-foreground">{t.representatives}</p></div>
        <div className="p-4 rounded-2xl bg-card border border-border"><FiAward className="w-8 h-8 text-amber-500 mb-2" /><p className="text-2xl font-bold text-foreground">{houses.length}</p><p className="text-sm text-muted-foreground">{t.houses}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
        {[
          { id: 'competitions', label: 'Competitions', icon: FiCalendar },
          { id: 'questions', label: t.questionBank, icon: FiHelpCircle },
          { id: 'credentials', label: t.loginCredentials || 'Credentials', icon: FiUsers },
          { id: 'analytics', label: t.leaderboard, icon: FiBarChart2 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
            <tab.icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Competitions Tab */}
      {activeTab === 'competitions' && (
        <div className="space-y-6">
          {showNewCompetition && (
            <div className="rounded-2xl bg-card border border-border shadow-soft p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">{t.createCompetition}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-foreground mb-2">Title</label><Input value={competitionForm.title} onChange={(e) => setCompetitionForm({ ...competitionForm, title: e.target.value })} placeholder="Weekly Quiz - Week 3" /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Reps per House</label><Input type="number" value={competitionForm.repsPerHouse} onChange={(e) => setCompetitionForm({ ...competitionForm, repsPerHouse: parseInt(e.target.value) || 3 })} min={1} max={10} /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Date</label><Input type="date" value={competitionForm.date} onChange={(e) => setCompetitionForm({ ...competitionForm, date: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-foreground mb-2">Time</label><Input type="time" value={competitionForm.time} onChange={(e) => setCompetitionForm({ ...competitionForm, time: e.target.value })} /></div>
              </div>
              <div className="flex gap-3 mt-6"><Button onClick={handleCreateCompetition}>{t.save}</Button><Button variant="outline" onClick={() => setShowNewCompetition(false)}>{t.cancel}</Button></div>
            </div>
          )}

          {competitions.length === 0 && !showNewCompetition && <p className="text-center text-muted-foreground py-8">No competitions yet. Create one to get started!</p>}

          {competitions.map(comp => {
            const totalReps = comp.representatives.length;
            const maxReps = comp.repsPerHouse * 4;
            return (
              <div key={comp.id} className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3"><FiPlay className="w-5 h-5" /><span className="font-bold">{comp.title}</span></div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-white/20 text-white">{comp.status}</Badge>
                    <Badge className="bg-white/20 text-white">{formatDate(comp.scheduledDate)} &bull; {comp.scheduledTime}</Badge>
                    {comp.status === 'upcoming' && (
                      <Button variant="ghost" size="sm" className="text-white h-8 text-xs" onClick={() => handleSetCompetitionStatus(comp.id, 'live')}>Go Live</Button>
                    )}
                    {comp.status === 'live' && (
                      <Button variant="ghost" size="sm" className="text-white h-8 text-xs" onClick={() => handleSetCompetitionStatus(comp.id, 'completed')}>End</Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={() => setDeleteTarget({ type: 'competition', id: comp.id })}><FiTrash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 rounded-xl bg-muted/50"><p className="text-2xl font-bold text-primary">{comp.questions.length}</p><p className="text-sm text-muted-foreground">{t.questions}</p></div>
                    <div className="text-center p-3 rounded-xl bg-muted/50"><p className="text-2xl font-bold text-primary">{comp.repsPerHouse}</p><p className="text-sm text-muted-foreground">Reps/House</p></div>
                    <div className="text-center p-3 rounded-xl bg-muted/50"><p className="text-2xl font-bold text-primary">{totalReps}/{maxReps}</p><p className="text-sm text-muted-foreground">{t.representatives}</p></div>
                    <div className="text-center p-3 rounded-xl bg-muted/50"><p className="text-2xl font-bold text-primary">{comp.representatives.filter(r => r.hasCompleted).length}</p><p className="text-sm text-muted-foreground">Completed</p></div>
                  </div>

                  {/* Reps by house */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {houses.map(house => {
                      const reps = comp.representatives.filter(r => r.house === house.name);
                      const isFull = reps.length >= comp.repsPerHouse;
                      return (
                        <div key={house.name} className="p-4 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full ${houseColors[house.name]}`} /><span className="font-semibold text-foreground">{house.name}</span></div>
                            <span className={`text-xs font-medium ${isFull ? 'text-primary' : 'text-muted-foreground'}`}>{reps.length}/{comp.repsPerHouse}</span>
                          </div>
                          <div className="space-y-2">
                            {reps.map(rep => (
                              <div key={rep.id} className="flex items-center justify-between text-sm group">
                                <span className="text-muted-foreground truncate flex-1">{rep.name}</span>
                                <div className="flex items-center gap-1">
                                  {rep.hasCompleted && <FiCheck className="w-4 h-4 text-primary" />}
                                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteTarget({ type: 'representative', id: rep.id })}><FiTrash2 className="w-3 h-3 text-destructive" /></Button>
                                </div>
                              </div>
                            ))}
                            {reps.length === 0 && <p className="text-xs text-muted-foreground italic">No reps</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add rep */}
                  <div className="mt-4">
                    {showAddRep === comp.id ? (
                      <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Input placeholder="Rep name" value={repForm.name} onChange={e => setRepForm({ ...repForm, name: e.target.value })} />
                          <select value={repForm.house} onChange={e => setRepForm({ ...repForm, house: e.target.value })} className="h-10 px-3 rounded-md border border-input bg-background text-foreground">
                            {houses.map(h => {
                              const count = comp.representatives.filter(r => r.house === h.name).length;
                              const full = count >= comp.repsPerHouse;
                              return <option key={h.name} value={h.name} disabled={full}>{h.name} ({count}/{comp.repsPerHouse}){full ? ' - Full' : ''}</option>;
                            })}
                          </select>
                          <Input placeholder="Login code (e.g. AB-2024-001)" value={repForm.loginCode} onChange={e => setRepForm({ ...repForm, loginCode: e.target.value.toUpperCase() })} />
                        </div>
                        <div className="flex gap-2"><Button size="sm" onClick={() => handleAddRep(comp.id)}>Add</Button><Button size="sm" variant="outline" onClick={() => setShowAddRep(null)}>Cancel</Button></div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowAddRep(comp.id)} disabled={totalReps >= maxReps}><FiPlus className="w-4 h-4" />{totalReps >= maxReps ? 'All slots filled' : 'Add Representative'}</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground">{questions.length} {t.questions}</p>
            <Button size="sm" onClick={() => setShowNewQuestion(true)} className="gap-2"><FiPlus className="w-4 h-4" />{t.addQuestion || 'Add Question'}</Button>
          </div>

          {showNewQuestion && (
            <div className="rounded-2xl bg-card border border-border shadow-soft p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Add Question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {[{ value: 'mcq', label: 'MCQ' }, { value: 'true_false', label: 'True/False' }, { value: 'short_answer', label: 'Short Answer' }, { value: 'essay', label: 'Essay' }].map(type => (
                      <button key={type.value} onClick={() => setQuestionForm({ ...questionForm, type: type.value as QuizQuestion['type'] })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${questionForm.type === type.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{type.label}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-foreground mb-2">Question (EN)</label><Input value={questionForm.question} onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })} placeholder="Enter question" /></div>
                  <div><label className="block text-sm font-medium text-foreground mb-2">Question (AR)</label><Input value={questionForm.questionArabic} onChange={e => setQuestionForm({ ...questionForm, questionArabic: e.target.value })} placeholder="أدخل السؤال" dir="rtl" /></div>
                </div>
                {questionForm.type === 'mcq' && (
                  <div><label className="block text-sm font-medium text-foreground mb-2">Options</label>
                    <div className="grid grid-cols-2 gap-2">{questionForm.options?.map((opt, i) => (<Input key={i} value={opt} onChange={e => { const o = [...(questionForm.options || [])]; o[i] = e.target.value; setQuestionForm({ ...questionForm, options: o }); }} placeholder={`Option ${i + 1}`} />))}</div>
                  </div>
                )}
                {questionForm.type === 'essay' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-foreground mb-2">Rubric (EN)</label><textarea value={questionForm.rubric || ''} onChange={e => setQuestionForm({ ...questionForm, rubric: e.target.value })} className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground resize-none" /></div>
                    <div><label className="block text-sm font-medium text-foreground mb-2">Rubric (AR)</label><textarea value={questionForm.rubricArabic || ''} onChange={e => setQuestionForm({ ...questionForm, rubricArabic: e.target.value })} className="w-full h-24 px-3 py-2 rounded-lg border border-input bg-background text-foreground resize-none" dir="rtl" /></div>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {questionForm.type !== 'essay' && <div><label className="block text-sm font-medium text-foreground mb-2">Correct Answer</label><Input value={questionForm.correctAnswer} onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })} /></div>}
                  <div><label className="block text-sm font-medium text-foreground mb-2">{questionForm.type === 'essay' ? 'Max Score' : 'Points'}</label><Input type="number" value={questionForm.type === 'essay' ? questionForm.maxPoints : questionForm.points} onChange={e => setQuestionForm({ ...questionForm, [questionForm.type === 'essay' ? 'maxPoints' : 'points']: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="block text-sm font-medium text-foreground mb-2">Time Limit (s)</label><Input type="number" value={questionForm.timeLimit} onChange={e => setQuestionForm({ ...questionForm, timeLimit: parseInt(e.target.value) || 30 })} /></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6"><Button onClick={handleCreateQuestion}>{t.save}</Button><Button variant="outline" onClick={() => setShowNewQuestion(false)}>{t.cancel}</Button></div>
            </div>
          )}

          <div className="space-y-3">
            {questions.map((q, index) => (
              <div key={q.id} className="rounded-xl bg-card border border-border p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{q.question}</p>
                  {q.questionArabic && <p className="text-sm text-muted-foreground mt-1" dir="rtl">{q.questionArabic}</p>}
                  <div className="flex items-center gap-3 mt-2"><Badge variant="outline" className="capitalize">{q.type.replace('_', '/')}</Badge><span className="text-sm text-muted-foreground">{q.points} pts</span><span className="text-sm text-muted-foreground">{q.timeLimit}s</span></div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget({ type: 'question', id: q.id })}><FiTrash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            {questions.length === 0 && <p className="text-center text-muted-foreground py-8">No questions yet. Add some to build your question bank!</p>}
          </div>
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <p className="text-muted-foreground">Login credentials for quiz representatives</p>
          {upcomingCompetition ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {houses.map(house => {
                const reps = upcomingCompetition.representatives.filter(r => r.house === house.name);
                return (
                  <div key={house.name} className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden">
                    <div className={`${houseColors[house.name]} p-3 text-white`}><span className="font-bold">{house.name}</span><span className="text-white/70 text-sm ml-2">({house.nameArabic})</span></div>
                    <div className="p-4 space-y-3">
                      {reps.map(rep => (
                        <div key={rep.id} className="p-3 rounded-xl bg-muted/50">
                          <p className="font-medium text-foreground text-sm mb-2">{rep.name}</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs font-mono bg-background px-2 py-1 rounded border border-border">{rep.loginCode}</code>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyCode(rep.loginCode)}>
                              {copiedCode === rep.loginCode ? <FiCheck className="w-3 h-3 text-primary" /> : <FiCopy className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {reps.length === 0 && <p className="text-xs text-muted-foreground italic">No reps assigned</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No upcoming competition</p>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-card border border-border p-6">
            <h3 className="text-lg font-bold text-foreground mb-4">{t.houseStandings}</h3>
            <div className="space-y-4">
              {leaderboard.length === 0 && <p className="text-center text-muted-foreground py-4">No competition data yet</p>}
              {leaderboard.map((house, index) => (
                <div key={house.house} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${houseColors[house.house]} flex items-center justify-center text-white font-bold`}>{index + 1}</div>
                  <div className="flex-1"><div className="flex justify-between mb-1"><span className="font-medium text-foreground">{house.house}</span><span className="text-primary font-bold">{house.totalScore} pts</span></div><Progress value={house.totalScore > 0 ? (house.totalScore / Math.max(...leaderboard.map(h => h.totalScore), 1)) * 100 : 0} className="h-2" /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

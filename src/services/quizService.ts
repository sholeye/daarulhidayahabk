/**
 * Quiz Service - Database operations for the quiz system
 */

import { supabase } from '@/lib/supabase';
import type { House, QuizQuestion, QuizCompetition, QuizRepresentative, CompetitionResult, LeaderboardEntry, StudentLeaderEntry } from '@/types/quiz';

// =============================================================================
// HOUSES
// =============================================================================

export const fetchQuizHouses = async (): Promise<House[]> => {
  const { data, error } = await supabase.from('quiz_houses').select('*').order('total_score', { ascending: false });
  if (error) throw error;
  return (data || []).map(h => ({
    id: h.id,
    name: h.name,
    nameArabic: h.name_arabic,
    color: h.color,
    totalScore: h.total_score || 0,
    competitionsWon: h.competitions_won || 0,
  }));
};

export const updateQuizHouse = async (id: string, updates: Partial<{ total_score: number; competitions_won: number }>) => {
  const { error } = await supabase.from('quiz_houses').update(updates).eq('id', id);
  if (error) throw error;
};

// =============================================================================
// QUESTIONS
// =============================================================================

export const fetchQuizQuestions = async (): Promise<QuizQuestion[]> => {
  const { data, error } = await supabase.from('quiz_questions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapQuestionFromDB);
};

export const createQuizQuestion = async (q: Partial<QuizQuestion>): Promise<QuizQuestion> => {
  const { data, error } = await supabase.from('quiz_questions').insert({
    question: q.question,
    question_arabic: q.questionArabic || '',
    type: q.type,
    options: q.options || [],
    correct_answer: q.correctAnswer || '',
    points: q.points || 10,
    time_limit: q.timeLimit || 30,
    max_points: q.maxPoints,
    rubric: q.rubric,
    rubric_arabic: q.rubricArabic,
  }).select().single();
  if (error) throw error;
  return mapQuestionFromDB(data);
};

export const updateQuizQuestion = async (id: string, q: Partial<QuizQuestion>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (q.question !== undefined) dbUpdates.question = q.question;
  if (q.questionArabic !== undefined) dbUpdates.question_arabic = q.questionArabic;
  if (q.type !== undefined) dbUpdates.type = q.type;
  if (q.options !== undefined) dbUpdates.options = q.options;
  if (q.correctAnswer !== undefined) dbUpdates.correct_answer = q.correctAnswer;
  if (q.points !== undefined) dbUpdates.points = q.points;
  if (q.timeLimit !== undefined) dbUpdates.time_limit = q.timeLimit;
  if (q.maxPoints !== undefined) dbUpdates.max_points = q.maxPoints;
  if (q.rubric !== undefined) dbUpdates.rubric = q.rubric;
  if (q.rubricArabic !== undefined) dbUpdates.rubric_arabic = q.rubricArabic;
  const { error } = await supabase.from('quiz_questions').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteQuizQuestion = async (id: string): Promise<void> => {
  const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
  if (error) throw error;
};

// =============================================================================
// COMPETITIONS
// =============================================================================

export const fetchQuizCompetitions = async (): Promise<QuizCompetition[]> => {
  const { data: comps, error } = await supabase.from('quiz_competitions').select('*').order('scheduled_date', { ascending: false });
  if (error) throw error;
  if (!comps || comps.length === 0) return [];

  const compIds = comps.map(c => c.id);
  const [{ data: reps }, { data: allQuestions }] = await Promise.all([
    supabase.from('quiz_representatives').select('*').in('competition_id', compIds),
    supabase.from('quiz_questions').select('*'),
  ]);

  const questionsMap = new Map((allQuestions || []).map(q => [q.id, mapQuestionFromDB(q)]));

  return comps.map(c => {
    const compReps = (reps || []).filter(r => r.competition_id === c.id).map(mapRepFromDB);
    const compQuestions = (c.question_ids || []).map((qid: string) => questionsMap.get(qid)).filter(Boolean) as QuizQuestion[];
    return {
      id: c.id,
      title: c.title,
      scheduledDate: c.scheduled_date,
      scheduledTime: c.scheduled_time,
      status: c.status,
      questions: compQuestions,
      representatives: compReps,
      repsPerHouse: c.reps_per_house || 3,
      createdAt: c.created_at,
      createdBy: c.created_by || '',
    };
  });
};

export const createQuizCompetition = async (comp: {
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  repsPerHouse: number;
  questionIds: string[];
}): Promise<string> => {
  const { data, error } = await supabase.from('quiz_competitions').insert({
    title: comp.title,
    scheduled_date: comp.scheduledDate,
    scheduled_time: comp.scheduledTime,
    reps_per_house: comp.repsPerHouse,
    question_ids: comp.questionIds,
    status: 'upcoming',
  }).select('id').single();
  if (error) throw error;
  return data.id;
};

export const updateCompetitionStatus = async (id: string, status: string): Promise<void> => {
  const { error } = await supabase.from('quiz_competitions').update({ status }).eq('id', id);
  if (error) throw error;
};

export const deleteQuizCompetition = async (id: string): Promise<void> => {
  const { error } = await supabase.from('quiz_competitions').delete().eq('id', id);
  if (error) throw error;
};

// =============================================================================
// REPRESENTATIVES
// =============================================================================

export const createQuizRepresentative = async (rep: {
  competitionId: string;
  name: string;
  house: string;
  loginCode: string;
  assignedQuestionIds: string[];
}): Promise<QuizRepresentative> => {
  const { data, error } = await supabase.from('quiz_representatives').insert({
    competition_id: rep.competitionId,
    name: rep.name,
    house: rep.house,
    login_code: rep.loginCode,
    assigned_question_ids: rep.assignedQuestionIds,
  }).select().single();
  if (error) throw error;
  return mapRepFromDB(data);
};

export const updateRepresentative = async (id: string, updates: { has_completed?: boolean; score?: number }): Promise<void> => {
  const { error } = await supabase.from('quiz_representatives').update(updates).eq('id', id);
  if (error) throw error;
};

export const deleteQuizRepresentative = async (id: string): Promise<void> => {
  const { error } = await supabase.from('quiz_representatives').delete().eq('id', id);
  if (error) throw error;
};

// =============================================================================
// ANSWERS
// =============================================================================

export const submitQuizAnswer = async (answer: {
  competitionId: string;
  representativeId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number;
  pendingGrade?: boolean;
}): Promise<void> => {
  const { error } = await supabase.from('quiz_answers').insert({
    competition_id: answer.competitionId,
    representative_id: answer.representativeId,
    question_id: answer.questionId,
    answer: answer.answer,
    is_correct: answer.isCorrect,
    points_earned: answer.pointsEarned,
    time_spent: answer.timeSpent,
    pending_grade: answer.pendingGrade || false,
  });
  if (error) throw error;
};

// =============================================================================
// COMPETITION RESULTS
// =============================================================================

export const fetchCompetitionResults = async (): Promise<CompetitionResult[]> => {
  const { data, error } = await supabase.from('quiz_competition_results').select('*').order('completed_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({
    competitionId: r.competition_id,
    houseScores: r.house_scores || {},
    winningHouse: r.winning_house,
    topStudent: {
      name: r.top_student_name || '',
      house: r.top_student_house || 'AbuBakr',
      score: r.top_student_score || 0,
    },
    completedAt: r.completed_at,
  }));
};

export const saveCompetitionResult = async (result: {
  competitionId: string;
  houseScores: Record<string, number>;
  winningHouse: string;
  topStudentName: string;
  topStudentHouse: string;
  topStudentScore: number;
}): Promise<void> => {
  const { error } = await supabase.from('quiz_competition_results').insert({
    competition_id: result.competitionId,
    house_scores: result.houseScores,
    winning_house: result.winningHouse,
    top_student_name: result.topStudentName,
    top_student_house: result.topStudentHouse,
    top_student_score: result.topStudentScore,
  });
  if (error) throw error;
};

// =============================================================================
// LEADERBOARD helpers
// =============================================================================

export const fetchHouseLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const houses = await fetchQuizHouses();
  return houses.sort((a, b) => b.totalScore - a.totalScore).map(h => ({
    house: h.name as LeaderboardEntry['house'],
    houseArabic: h.nameArabic,
    totalScore: h.totalScore,
    competitionsWon: h.competitionsWon,
    color: h.color,
  }));
};

export const fetchStudentLeaderboard = async (): Promise<StudentLeaderEntry[]> => {
  const { data, error } = await supabase
    .from('quiz_representatives')
    .select('name, house, score, competition_id')
    .eq('has_completed', true)
    .order('score', { ascending: false });
  if (error) throw error;
  
  // Aggregate by name+house
  const map = new Map<string, StudentLeaderEntry>();
  (data || []).forEach(r => {
    const key = `${r.name}:${r.house}`;
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.totalScore += r.score || 0;
      existing.competitionsParticipated += 1;
    } else {
      map.set(key, {
        name: r.name,
        house: r.house as StudentLeaderEntry['house'],
        totalScore: r.score || 0,
        competitionsParticipated: 1,
      });
    }
  });
  
  return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
};

// =============================================================================
// MAPPERS
// =============================================================================

function mapQuestionFromDB(row: Record<string, unknown>): QuizQuestion {
  return {
    id: row.id as string,
    question: row.question as string,
    questionArabic: (row.question_arabic as string) || undefined,
    type: row.type as QuizQuestion['type'],
    options: (row.options as string[]) || undefined,
    correctAnswer: (row.correct_answer as string) || '',
    points: (row.points as number) || 10,
    timeLimit: (row.time_limit as number) || 30,
    maxPoints: (row.max_points as number) || undefined,
    rubric: (row.rubric as string) || undefined,
    rubricArabic: (row.rubric_arabic as string) || undefined,
  };
}

function mapRepFromDB(row: Record<string, unknown>): QuizRepresentative {
  return {
    id: row.id as string,
    name: row.name as string,
    house: row.house as QuizRepresentative['house'],
    loginCode: row.login_code as string,
    competitionId: row.competition_id as string,
    hasCompleted: (row.has_completed as boolean) || false,
    score: (row.score as number) || 0,
    assignedQuestions: (row.assigned_question_ids as string[]) || [],
  };
}

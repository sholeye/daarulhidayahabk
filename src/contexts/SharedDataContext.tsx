/**
 * SharedDataContext - Real Supabase data store with Realtime subscriptions
 * Refetches on auth changes to prevent stale state.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { BlogPost, Announcement, Student, Payment, AttendanceRecord, StudentResult, SchoolClass } from '@/types';
import * as db from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { createNotification, createBulkNotifications } from '@/services/notificationService';

interface SharedDataContextType {
  isLoading: boolean;
  refreshAll: () => Promise<void>;

  blogPosts: BlogPost[];
  addBlogPost: (post: Partial<BlogPost>, authorId: string) => Promise<void>;
  updateBlogPost: (id: string, data: Partial<BlogPost>) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  toggleBlogLike: (postId: string, userId: string) => Promise<void>;

  announcements: Announcement[];
  addAnnouncement: (ann: Partial<Announcement>) => Promise<void>;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  toggleAnnouncementActive: (id: string) => Promise<void>;

  students: Student[];
  addStudent: (student: Partial<Student>, authUserId?: string) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  payments: Payment[];
  addPayment: (payment: Partial<Payment>) => Promise<void>;

  attendance: AttendanceRecord[];
  setAttendanceRecord: (record: AttendanceRecord) => Promise<void>;
  bulkSetAttendance: (records: AttendanceRecord[]) => Promise<void>;

  results: StudentResult[];
  addOrUpdateResult: (result: StudentResult) => Promise<void>;

  schoolClasses: SchoolClass[];
}

const SharedDataContext = createContext<SharedDataContextType | undefined>(undefined);

export const SharedDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const fetchIdRef = useRef(0);

  const refreshAll = useCallback(async () => {
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    try {
      const [s, r, att, pay, ann, bp, cls] = await Promise.all([
        db.fetchStudents().catch(() => []),
        db.fetchResults().catch(() => []),
        db.fetchAttendance().catch(() => []),
        db.fetchPayments().catch(() => []),
        db.fetchAnnouncements().catch(() => []),
        db.fetchBlogPosts().catch(() => []),
        db.fetchSchoolClasses().catch(() => []),
      ]);
      if (id === fetchIdRef.current) {
        setStudents(s); setResults(r); setAttendance(att);
        setPayments(pay); setAnnouncements(ann); setBlogPosts(bp);
        setSchoolClasses(cls);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      if (id === fetchIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // Re-fetch on auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setTimeout(() => refreshAll(), 100);
      }
    });
    return () => subscription.unsubscribe();
  }, [refreshAll]);

  // ==========================================================================
  // REALTIME SUBSCRIPTIONS - listen to changes and update state instantly
  // ==========================================================================
  useEffect(() => {
    const channel = supabase.channel('shared-data-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        db.fetchStudents().catch(() => []).then(setStudents);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        db.fetchAttendance().catch(() => []).then(setAttendance);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        db.fetchPayments().catch(() => []).then(setPayments);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => {
        db.fetchResults().catch(() => []).then(setResults);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        db.fetchAnnouncements().catch(() => []).then(setAnnouncements);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, () => {
        db.fetchBlogPosts().catch(() => []).then(setBlogPosts);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_likes' }, () => {
        db.fetchBlogPosts().catch(() => []).then(setBlogPosts);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_classes' }, () => {
        db.fetchSchoolClasses().catch(() => []).then(setSchoolClasses);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Blog
  const addBlogPost = useCallback(async (post: Partial<BlogPost>, authorId: string) => {
    const newPost = await db.createBlogPost(post, authorId);
    setBlogPosts(prev => [newPost, ...prev]);
  }, []);

  const updateBlogPost = useCallback(async (id: string, data: Partial<BlogPost>) => {
    await db.updateBlogPostDB(id, data);
    setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, ...data } as BlogPost : p));
  }, []);

  const deleteBlogPost = useCallback(async (id: string) => {
    await db.deleteBlogPostDB(id);
    setBlogPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const toggleBlogLike = useCallback(async (postId: string, userId: string) => {
    const liked = await db.toggleBlogLikeDB(postId, userId);
    setBlogPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, likes: liked ? [...p.likes, userId] : p.likes.filter(id => id !== userId) };
    }));

    if (liked) {
      const post = blogPosts.find(p => p.id === postId);
      if (post) {
        const { data: postData } = await supabase.from('blog_posts').select('author_id').eq('id', postId).single();
        if (postData?.author_id && postData.author_id !== userId) {
          createNotification(postData.author_id, 'Post Liked ❤️', `Someone liked your post "${post.title}"`, 'info', '/blog').catch(() => {});
        }
      }
    }
  }, [blogPosts]);

  // Announcements
  const addAnnouncement = useCallback(async (ann: Partial<Announcement>) => {
    const newAnn = await db.createAnnouncement(ann);
    setAnnouncements(prev => [newAnn, ...prev]);
  }, []);

  const updateAnnouncement = useCallback(async (id: string, data: Partial<Announcement>) => {
    await db.updateAnnouncementDB(id, data);
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...data } as Announcement : a));
  }, []);

  const deleteAnnouncement = useCallback(async (id: string) => {
    await db.deleteAnnouncementDB(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  const toggleAnnouncementActive = useCallback(async (id: string) => {
    const ann = announcements.find(a => a.id === id);
    if (!ann) return;
    await db.updateAnnouncementDB(id, { isActive: !ann.isActive });
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  }, [announcements]);

  // Students
  const addStudent = useCallback(async (student: Partial<Student>, authUserId?: string): Promise<Student> => {
    const newStudent = await db.createStudent(student, authUserId);
    setStudents(prev => [newStudent, ...prev]);
    return newStudent;
  }, []);

  const updateStudent = useCallback(async (id: string, data: Partial<Student>) => {
    await db.updateStudentDB(id, data);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } as Student : s));
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    await db.deleteStudentDB(id);
    setStudents(prev => prev.filter(s => s.id !== id));
  }, []);

  // Payments
  const addPayment = useCallback(async (payment: Partial<Payment>) => {
    const newPayment = await db.createPayment(payment);
    setPayments(prev => [newPayment, ...prev]);
    const freshStudents = await db.fetchStudents();
    setStudents(freshStudents);

    if (payment.studentId) {
      const { data: links } = await supabase.from('parent_students').select('parent_id').eq('student_id', payment.studentId);
      if (links && links.length > 0) {
        createBulkNotifications(
          links.map(l => l.parent_id),
          'Fee Payment Recorded 💰',
          `A payment of ₦${Number(payment.amount).toLocaleString()} has been recorded for your child.`,
          'success'
        ).catch(() => {});
      }
    }
  }, []);

  // Attendance
  const setAttendanceRecord = useCallback(async (record: AttendanceRecord) => {
    await db.upsertAttendance(record);
    setAttendance(prev => {
      const idx = prev.findIndex(a => a.studentId === record.studentId && a.date === record.date);
      if (idx >= 0) return prev.map((a, i) => i === idx ? record : a);
      return [...prev, record];
    });
  }, []);

  const bulkSetAttendance = useCallback(async (records: AttendanceRecord[]) => {
    await db.bulkUpsertAttendance(records);
    setAttendance(prev => {
      const updated = [...prev];
      records.forEach(record => {
        const idx = updated.findIndex(a => a.studentId === record.studentId && a.date === record.date);
        if (idx >= 0) updated[idx] = record;
        else updated.push(record);
      });
      return updated;
    });
  }, []);

  // Results
  const addOrUpdateResult = useCallback(async (result: StudentResult) => {
    await db.upsertResult(result);
    setResults(prev => {
      const idx = prev.findIndex(r => r.studentId === result.studentId && r.term === result.term && r.session === result.session);
      if (idx >= 0) return prev.map((r, i) => i === idx ? result : r);
      return [...prev, result];
    });
  }, []);

  return (
    <SharedDataContext.Provider value={{
      isLoading, refreshAll,
      blogPosts, addBlogPost, updateBlogPost, deleteBlogPost, toggleBlogLike,
      announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncementActive,
      students, addStudent, updateStudent, deleteStudent,
      payments, addPayment,
      attendance, setAttendanceRecord, bulkSetAttendance,
      results, addOrUpdateResult,
      schoolClasses,
    }}>
      {children}
    </SharedDataContext.Provider>
  );
};

export const useSharedData = (): SharedDataContextType => {
  const context = useContext(SharedDataContext);
  if (!context) throw new Error('useSharedData must be used within SharedDataProvider');
  return context;
};

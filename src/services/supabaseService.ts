/**
 * Supabase Service Layer - All real database operations
 */

import { supabase } from '@/lib/supabase';
import { Student, StudentResult, Announcement, Payment, AttendanceRecord, BlogPost } from '@/types';
import { getFeeStatus, normalizeCurrency } from '@/utils/helpers';

// =============================================================================
// STUDENTS
// =============================================================================

export const fetchStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapStudentFromDB);
};

export const createStudent = async (student: Partial<Student>, authUserId?: string): Promise<Student> => {
  const { data, error } = await supabase.from('students').insert({
    auth_user_id: authUserId || null,
    student_id: student.studentId,
    full_name: student.fullName,
    email: student.email,
    date_of_birth: student.dateOfBirth,
    address: student.address,
    phone: student.phone,
    origin: student.origin,
    sex: student.sex,
    guardian_name: student.guardian?.name,
    guardian_phone: student.guardian?.phone,
    guardian_occupation: student.guardian?.occupation,
    guardian_state: student.guardian?.stateOfOrigin,
    class: student.class,
    enrollment_date: student.enrollmentDate,
    fee_status: student.feeStatus || 'unpaid',
    amount_paid: student.amountPaid || 0,
    total_fee: student.totalFee || 6000,
  }).select().single();
  if (error) throw error;
  return mapStudentFromDB(data);
};

export const updateStudentDB = async (id: string, updates: Partial<Student>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.origin !== undefined) dbUpdates.origin = updates.origin;
  if (updates.class !== undefined) dbUpdates.class = updates.class;
  if (updates.feeStatus !== undefined) dbUpdates.fee_status = updates.feeStatus;
  if (updates.amountPaid !== undefined) dbUpdates.amount_paid = updates.amountPaid;
  if (updates.totalFee !== undefined) dbUpdates.total_fee = updates.totalFee;
  if (updates.guardian) {
    if (updates.guardian.name !== undefined) dbUpdates.guardian_name = updates.guardian.name;
    if (updates.guardian.phone !== undefined) dbUpdates.guardian_phone = updates.guardian.phone;
    if (updates.guardian.occupation !== undefined) dbUpdates.guardian_occupation = updates.guardian.occupation;
    if (updates.guardian.stateOfOrigin !== undefined) dbUpdates.guardian_state = updates.guardian.stateOfOrigin;
  }
  const { error } = await supabase.from('students').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteStudentDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
};

// =============================================================================
// RESULTS
// =============================================================================

export const fetchResults = async (): Promise<StudentResult[]> => {
  const { data, error } = await supabase.from('results').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapResultFromDB);
};

export const upsertResult = async (result: StudentResult): Promise<void> => {
  const { error } = await supabase.from('results').upsert({
    student_id: result.studentId,
    term: result.term,
    session: result.session,
    subjects: result.subjects,
    total_score: result.totalScore,
    average_score: result.averageScore,
    position: result.position,
    teacher_remarks: result.teacherRemarks,
    principal_remarks: result.principalRemarks,
  }, { onConflict: 'student_id,term,session' });
  if (error) throw error;
};

// =============================================================================
// ATTENDANCE
// =============================================================================

export const fetchAttendance = async (): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase.from('attendance').select('*').order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapAttendanceFromDB);
};

export const upsertAttendance = async (record: AttendanceRecord): Promise<void> => {
  const { error } = await supabase.from('attendance').upsert({
    student_id: record.studentId,
    date: record.date,
    status: record.status,
    check_in_time: record.checkInTime,
    check_out_time: record.checkOutTime,
  }, { onConflict: 'student_id,date' });
  if (error) throw error;
};

export const bulkUpsertAttendance = async (records: AttendanceRecord[]): Promise<void> => {
  const dbRecords = records.map(r => ({
    student_id: r.studentId,
    date: r.date,
    status: r.status,
    check_in_time: r.checkInTime,
    check_out_time: r.checkOutTime,
  }));
  const { error } = await supabase.from('attendance').upsert(dbRecords, { onConflict: 'student_id,date' });
  if (error) throw error;
};

// =============================================================================
// PAYMENTS
// =============================================================================

export const fetchPayments = async (): Promise<Payment[]> => {
  const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapPaymentFromDB);
};

export const createPayment = async (payment: Partial<Payment>): Promise<Payment> => {
  const paymentAmount = Number(payment.amount || 0);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  const { data, error } = await supabase.from('payments').insert({
    student_id: payment.studentId,
    amount: paymentAmount,
    date: payment.date,
    term: payment.term,
    session: payment.session,
    payment_method: payment.paymentMethod,
    receipt_number: payment.receiptNumber,
    status: payment.status || 'completed',
  }).select().single();
  if (error) throw error;
  return mapPaymentFromDB(data);
};

// =============================================================================
// ANNOUNCEMENTS
// =============================================================================

export const fetchAnnouncements = async (): Promise<Announcement[]> => {
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapAnnouncementFromDB);
};

export const createAnnouncement = async (ann: Partial<Announcement>): Promise<Announcement> => {
  const { data, error } = await supabase.from('announcements').insert({
    title: ann.title,
    content: ann.content,
    category: ann.category,
    is_active: ann.isActive ?? true,
  }).select().single();
  if (error) throw error;
  return mapAnnouncementFromDB(data);
};

export const updateAnnouncementDB = async (id: string, updates: Partial<Announcement>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  const { error } = await supabase.from('announcements').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteAnnouncementDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
};

// =============================================================================
// BLOG POSTS
// =============================================================================

export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  const { data: posts, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const { data: likes } = await supabase.from('blog_likes').select('post_id, user_id');
  const likesMap: Record<string, string[]> = {};
  (likes || []).forEach(l => {
    if (!likesMap[l.post_id]) likesMap[l.post_id] = [];
    likesMap[l.post_id].push(l.user_id);
  });
  return (posts || []).map(p => mapBlogPostFromDB(p, likesMap[p.id] || []));
};

export const createBlogPost = async (post: Partial<BlogPost>, authorId: string): Promise<BlogPost> => {
  const { data, error } = await supabase.from('blog_posts').insert({
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    author_id: authorId,
    author_name: post.author || 'Admin',
    author_role: post.authorRole || 'admin',
    is_published: post.isPublished ?? true,
    tags: post.tags || [],
    cover_image: post.coverImage,
  }).select().single();
  if (error) throw error;
  return mapBlogPostFromDB(data, []);
};

export const updateBlogPostDB = async (id: string, updates: Partial<BlogPost>): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.excerpt !== undefined) dbUpdates.excerpt = updates.excerpt;
  if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  const { error } = await supabase.from('blog_posts').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteBlogPostDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw error;
};

export const toggleBlogLikeDB = async (postId: string, userId: string): Promise<boolean> => {
  // Use maybeSingle to avoid throwing on no rows
  const { data: existing } = await supabase
    .from('blog_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('blog_likes').delete().eq('post_id', postId).eq('user_id', userId);
    return false;
  } else {
    const { error } = await supabase.from('blog_likes').insert({ post_id: postId, user_id: userId });
    if (error) throw error;
    return true;
  }
};

// =============================================================================
// SCHOOL CLASSES
// =============================================================================

export const fetchSchoolClasses = async () => {
  const { data, error } = await supabase.from('school_classes').select('*').order('name');
  if (error) throw error;
  return (data || []).map(c => ({
    id: c.id,
    name: c.name,
    nameArabic: c.name_arabic,
    level: c.level as 'preparatory' | 'primary',
    studentCount: 0,
    instructorId: c.instructor_id,
  }));
};

// =============================================================================
// MAPPERS
// =============================================================================

function mapStudentFromDB(row: Record<string, unknown>): Student {
  const amountPaid = normalizeCurrency(Number(row.amount_paid) || 0);
  const totalFee = normalizeCurrency(Number(row.total_fee) || 6000);

  return {
    id: row.id as string,
    studentId: row.student_id as string,
    fullName: row.full_name as string,
    email: row.email as string,
    dateOfBirth: row.date_of_birth as string || '',
    address: row.address as string || '',
    phone: row.phone as string || '',
    origin: row.origin as string || '',
    sex: row.sex as 'male' | 'female',
    guardian: {
      name: row.guardian_name as string || '',
      phone: row.guardian_phone as string || '',
      occupation: row.guardian_occupation as string || '',
      stateOfOrigin: row.guardian_state as string || '',
    },
    class: row.class as string,
    enrollmentDate: row.enrollment_date as string || '',
    feeStatus: getFeeStatus(amountPaid, totalFee),
    amountPaid,
    totalFee,
    imageUrl: row.image_url as string | undefined,
    qrCode: row.qr_code as string | undefined,
  };
}

function mapResultFromDB(row: Record<string, unknown>): StudentResult {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    term: row.term as string,
    session: row.session as string,
    subjects: (row.subjects as StudentResult['subjects']) || [],
    totalScore: Number(row.total_score) || 0,
    averageScore: Number(row.average_score) || 0,
    position: row.position as number | undefined,
    teacherRemarks: row.teacher_remarks as string || '',
    principalRemarks: row.principal_remarks as string || '',
    createdAt: row.created_at as string || '',
  };
}

function mapAttendanceFromDB(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    date: row.date as string,
    status: row.status as 'present' | 'absent' | 'late' | 'excused',
    checkInTime: row.check_in_time as string | undefined,
    checkOutTime: row.check_out_time as string | undefined,
  };
}

function mapPaymentFromDB(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    amount: Number(row.amount) || 0,
    date: row.date as string,
    term: row.term as string,
    session: row.session as string,
    paymentMethod: row.payment_method as string,
    receiptNumber: row.receipt_number as string,
    status: row.status as 'completed' | 'pending' | 'failed',
  };
}

function mapAnnouncementFromDB(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    category: row.category as 'general' | 'academic' | 'event' | 'urgent',
    createdAt: row.created_at as string || '',
    createdBy: 'Admin',
    isActive: row.is_active as boolean ?? true,
  };
}

function mapBlogPostFromDB(row: Record<string, unknown>, likes: string[]): BlogPost {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    excerpt: row.excerpt as string || '',
    author: row.author_name as string || 'Admin',
    authorRole: row.author_role as BlogPost['authorRole'] || 'admin',
    createdAt: row.created_at as string || '',
    updatedAt: row.updated_at as string || '',
    isPublished: row.is_published as boolean ?? false,
    likes,
    tags: (row.tags as string[]) || [],
    coverImage: row.cover_image as string | undefined,
  };
}

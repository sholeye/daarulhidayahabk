// User Types
export type UserRole = 'admin' | 'instructor' | 'learner' | 'parent';

// Blog Types
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  authorRole: UserRole;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  likes: string[]; // user IDs who liked
  tags: string[];
  coverImage?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// Student Types
export interface Guardian {
  name: string;
  phone: string;
  occupation: string;
  stateOfOrigin: string;
}

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  address: string;
  phone: string;
  origin: string;
  sex: 'male' | 'female';
  guardian: Guardian;
  imageUrl?: string;
  qrCode?: string;
  class: string;
  enrollmentDate: string;
  feeStatus: 'paid' | 'unpaid' | 'partial';
  amountPaid: number;
  totalFee: number;
}

// Result Types
export interface SubjectResult {
  subject: string;
  score: number;
  grade: string;
  remarks: string;
}

export interface StudentResult {
  id: string;
  studentId: string;
  term: string;
  session: string;
  subjects: SubjectResult[];
  totalScore: number;
  averageScore: number;
  position?: number;
  teacherRemarks: string;
  principalRemarks: string;
  createdAt: string;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: string;
  checkOutTime?: string;
}

// Announcement Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'academic' | 'event' | 'urgent';
  createdAt: string;
  createdBy: string;
  isActive: boolean;
}

// Event Types
export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'ongoing' | 'upcoming' | 'past';
  location?: string;
}

// Payment Types
export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  term: string;
  session: string;
  paymentMethod: string;
  receiptNumber: string;
  status: 'completed' | 'pending' | 'failed';
}

// Class Types
export interface SchoolClass {
  id: string;
  name: string;
  nameArabic: string;
  level: 'preparatory' | 'primary';
  studentCount: number;
  instructorId?: string;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  userId: string;
}

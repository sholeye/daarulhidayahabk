import QRCode from 'qrcode';
import type { Student } from '@/types';

export const generateStudentId = (firstName: string, existingCount: number): string => {
  const prefix = firstName
    .split(' ')[0]
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 3) || 'std';
  const paddedNumber = String((existingCount % 10000) + 1).padStart(4, '0');
  return `${prefix}${paddedNumber}`;
};

export const generateQRCode = async (studentId: string): Promise<string> => {
  try {
    const qrDataUrl = await QRCode.toDataURL(studentId, {
      width: 200,
      margin: 2,
      color: {
        dark: '#0F5132',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const normalizeCurrency = (amount: number): number => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 0;
  return Math.max(0, numericAmount);
};

export const getOutstandingBalance = (totalFee: number, amountPaid: number): number => {
  return Math.max(0, normalizeCurrency(totalFee) - normalizeCurrency(amountPaid));
};

export const getPaymentProgress = (amountPaid: number, totalFee: number): number => {
  const safeTotalFee = normalizeCurrency(totalFee);
  if (safeTotalFee <= 0) return 0;
  return Math.min(100, Math.round((normalizeCurrency(amountPaid) / safeTotalFee) * 100));
};

export const getFeeStatus = (amountPaid: number, totalFee: number): Student['feeStatus'] => {
  const safePaid = normalizeCurrency(amountPaid);
  const balance = getOutstandingBalance(totalFee, safePaid);

  if (balance === 0 && normalizeCurrency(totalFee) > 0) return 'paid';
  if (safePaid > 0) return 'partial';
  return 'unpaid';
};

export const isResultAccessible = (student?: Pick<Student, 'amountPaid' | 'totalFee'> | null): boolean => {
  if (!student) return false;
  return getOutstandingBalance(student.totalFee, student.amountPaid) === 0;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateGrade = (score: number): string => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  if (score >= 40) return 'E';
  return 'F';
};

export const getGradeRemarks = (grade: string): string => {
  const remarks: Record<string, string> = {
    'A+': 'Outstanding',
    'A': 'Excellent',
    'B': 'Very Good',
    'C': 'Good',
    'D': 'Fair',
    'E': 'Pass',
    'F': 'Fail',
  };
  return remarks[grade] || 'N/A';
};

export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

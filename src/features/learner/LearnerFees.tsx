/**
 * Learner Fees Page - RLS-filtered, no wrong fallback
 */

import React from 'react';
import { FiDollarSign, FiCheckCircle, FiAlertCircle, FiFileText, FiUser } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getOutstandingBalance, getPaymentProgress } from '@/utils/helpers';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

export const LearnerFees: React.FC = () => {
  const { user } = useAuth();
  const { students, payments, isLoading } = useSharedData();
  const student = students.length === 1 ? students[0] : students.find(s => s.email === user?.email) || null;
  const studentPayments = student ? payments.filter(p => p.studentId === student.studentId) : [];

  if (isLoading) return <InlineLoader />;

  if (!student) return (
    <div className="p-12 text-center">
      <FiUser className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">No student record found for your account.</p>
    </div>
  );

  const feeBalance = getOutstandingBalance(student.totalFee, student.amountPaid);
  const paymentPercentage = getPaymentProgress(student.amountPaid, student.totalFee);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">Fee Status</h1><p className="text-muted-foreground mt-1">View your fee payment details</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-6"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><FiDollarSign className="w-6 h-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Fee</p><p className="text-2xl font-bold text-foreground">{formatCurrency(student.totalFee)}</p></div></div></div>
        <div className="bg-card rounded-2xl border border-border p-6"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><FiCheckCircle className="w-6 h-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Amount Paid</p><p className="text-2xl font-bold text-primary">{formatCurrency(student.amountPaid)}</p></div></div></div>
        <div className="bg-card rounded-2xl border border-border p-6"><div className="flex items-center gap-3 mb-4"><div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feeBalance > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>{feeBalance > 0 ? <FiAlertCircle className="w-6 h-6 text-destructive" /> : <FiCheckCircle className="w-6 h-6 text-primary" />}</div><div><p className="text-sm text-muted-foreground">Balance</p><p className={`text-2xl font-bold ${feeBalance > 0 ? 'text-destructive' : 'text-primary'}`}>{formatCurrency(feeBalance)}</p></div></div></div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-foreground">Payment Progress</h3><Badge variant={student.feeStatus === 'paid' ? 'paid' : student.feeStatus === 'partial' ? 'late' : 'unpaid'}>{student.feeStatus}</Badge></div>
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${paymentPercentage}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full" />
        </div>
        <div className="flex justify-between mt-2 text-sm"><span className="text-muted-foreground">0%</span><span className="font-medium text-foreground">{paymentPercentage}% paid</span><span className="text-muted-foreground">100%</span></div>
        {feeBalance > 0 && <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"><div className="flex items-start gap-3"><FiAlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" /><div><p className="font-medium text-destructive">Outstanding Balance</p><p className="text-sm text-muted-foreground mt-1">You have an outstanding balance of {formatCurrency(feeBalance)}. Complete payment to access results.</p></div></div></div>}
        {feeBalance === 0 && <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl"><div className="flex items-start gap-3"><FiCheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" /><div><p className="font-medium text-primary">Fully Paid</p><p className="text-sm text-muted-foreground mt-1">All fees paid. Full access granted.</p></div></div></div>}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="p-6 border-b border-border"><h3 className="font-semibold text-foreground">Payment History</h3></div>
        {studentPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50"><tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Receipt</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Term</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Amount</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {studentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FiFileText className="w-5 h-5 text-primary" /></div><span className="font-medium text-foreground">{formatDate(p.date)}</span></div></td>
                    <td className="px-6 py-4 text-sm text-foreground font-mono">{p.receiptNumber}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{p.term} - {p.session}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4"><Badge variant={p.status === 'completed' ? 'paid' : 'unpaid'}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center"><FiDollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">No payment records</p></div>
        )}
      </div>
    </motion.div>
  );
};

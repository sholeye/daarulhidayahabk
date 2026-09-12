/**
 * Admin Dashboard - Real shared data with animations
 */

import React from 'react';
import { FiUsers, FiDollarSign, FiTrendingUp, FiAlertCircle, FiCalendar, FiArrowUpRight, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useSharedData } from '@/contexts/SharedDataContext';
import { formatCurrency, formatDate, getOutstandingBalance } from '@/utils/helpers';
import { Badge } from '@/components/ui/badge';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
  const { students, payments, announcements, attendance, isLoading } = useSharedData();

  const totalStudents = students.length;
  const paidStudents = students.filter(s => s.feeStatus === 'paid').length;
  const totalRevenue = payments.filter((payment) => payment.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingFees = students.reduce((sum, student) => sum + getOutstandingBalance(student.totalFee, student.amountPaid), 0);

  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(a => a.date === today);
  const todayPresent = todayRecords.filter(a => a.status === 'present').length;
  const todayLate = todayRecords.filter(a => a.status === 'late').length;
  const todayAbsent = todayRecords.filter(a => a.status === 'absent').length;

  const stats = [
    { icon: FiUsers, label: 'Total Students', value: totalStudents, change: `${paidStudents} fees paid`, gradient: 'from-primary/20 to-primary/5', iconColor: 'text-primary' },
    { icon: FiDollarSign, label: 'Revenue Collected', value: formatCurrency(totalRevenue), change: `From ${totalStudents} students`, gradient: 'from-secondary/20 to-secondary/5', iconColor: 'text-secondary' },
    { icon: FiTrendingUp, label: 'Fee Completion', value: `${totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0}%`, change: `${paidStudents} of ${totalStudents} paid`, gradient: 'from-accent/20 to-accent/5', iconColor: 'text-accent' },
    { icon: FiAlertCircle, label: 'Pending Fees', value: formatCurrency(pendingFees), change: `${totalStudents - paidStudents} students`, gradient: 'from-destructive/20 to-destructive/5', iconColor: 'text-destructive' },
  ];

  if (isLoading) return <InlineLoader />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-8">
      <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1><p className="text-muted-foreground mt-1">Welcome back! Here's your school overview.</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
            className="relative overflow-hidden bg-card rounded-2xl border border-border p-6 shadow-soft hover:shadow-medium transition-shadow duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center mb-4 shadow-soft"><stat.icon className={`w-6 h-6 ${stat.iconColor}`} /></div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-foreground mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><FiArrowUpRight className="w-3 h-3" />{stat.change}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6"><h2 className="font-semibold text-lg text-foreground">Recent Students</h2><a href="/admin/students" className="text-sm text-primary hover:underline font-medium">View all</a></div>
          <div className="space-y-4">
            {students.slice(0, 4).map((student) => (
              <div key={student.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0"><span className="text-primary-foreground font-bold text-lg">{student.fullName[0]}</span></div>
                <div className="flex-1 min-w-0"><p className="font-medium text-foreground truncate">{student.fullName}</p><p className="text-sm text-muted-foreground">{student.studentId}</p></div>
                <Badge variant={student.feeStatus === 'paid' ? 'paid' : student.feeStatus === 'partial' ? 'partial' : 'unpaid'}>{student.feeStatus}</Badge>
              </div>
            ))}
            {students.length === 0 && <p className="text-center text-muted-foreground py-4">No students yet</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6"><h2 className="font-semibold text-lg text-foreground">Announcements</h2><a href="/admin/announcements" className="text-sm text-primary hover:underline font-medium">Manage</a></div>
          <div className="space-y-4">
            {announcements.slice(0, 3).map((ann) => (
              <div key={ann.id} className="p-4 rounded-xl bg-muted/50">
                <div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><p className="font-medium text-foreground">{ann.title}</p><p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.content}</p></div><Badge variant={ann.category === 'urgent' ? 'unpaid' : 'outline'} className="flex-shrink-0">{ann.category}</Badge></div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><FiCalendar className="w-3 h-3" />{formatDate(ann.createdAt)}</p>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-center text-muted-foreground py-4">No announcements</p>}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl border border-border p-6 shadow-soft">
        <h2 className="font-semibold text-lg text-foreground mb-6">Today's Attendance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FiCheckCircle className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{todayPresent}</p><p className="text-sm text-muted-foreground">Present</p></div></div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/5"><div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center"><FiClock className="w-5 h-5 text-secondary" /></div><div><p className="text-2xl font-bold text-foreground">{todayLate}</p><p className="text-sm text-muted-foreground">Late</p></div></div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-destructive/5"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><FiAlertCircle className="w-5 h-5 text-destructive" /></div><div><p className="text-2xl font-bold text-foreground">{todayAbsent}</p><p className="text-sm text-muted-foreground">Absent</p></div></div>
        </div>
      </motion.div>
    </motion.div>
  );
};
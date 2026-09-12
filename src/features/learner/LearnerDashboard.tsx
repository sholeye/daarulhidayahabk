/**
 * Learner Dashboard - Uses auth_user_id matching, no fallback to wrong student
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiCalendar, FiFileText, FiDollarSign, FiCheckCircle, FiXCircle, FiClock, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, getOutstandingBalance, isResultAccessible } from '@/utils/helpers';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

export const LearnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { students, results, attendance, announcements, isLoading } = useSharedData();

  // For learners, RLS returns only their own student record via auth_user_id
  // Use the first (and only) student in the list since RLS handles filtering
  const currentStudent = students.length === 1 ? students[0] : students.find(s => s.email === user?.email) || null;
  const studentResult = currentStudent ? results.find(r => r.studentId === currentStudent.studentId) : null;

  const studentAttendance = currentStudent ? attendance.filter(a => a.studentId === currentStudent.studentId) : [];
  const presentDays = studentAttendance.filter(a => a.status === 'present').length;
  const lateDays = studentAttendance.filter(a => a.status === 'late').length;
  const absentDays = studentAttendance.filter(a => a.status === 'absent').length;
  const totalDays = studentAttendance.length || 1;
  const attendancePercentage = Math.round(((presentDays + lateDays) / totalDays) * 100);

  const activeAnnouncements = announcements.filter(a => a.isActive).slice(0, 3);
  const feesPaid = isResultAccessible(currentStudent);
  const feeBalance = currentStudent ? getOutstandingBalance(currentStudent.totalFee, currentStudent.amountPaid) : 0;

  if (isLoading) return <InlineLoader />;

  if (!currentStudent) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
          <h1 className="text-2xl sm:text-3xl font-bold">Assalamu Alaikum, {user?.name?.split(' ')[0] || 'Student'}</h1>
          <p className="mt-2 opacity-90">Welcome to your student portal.</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FiUser className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No student record found for your account. Please contact the administrator.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <h1 className="text-2xl sm:text-3xl font-bold">Assalamu Alaikum, {currentStudent.fullName.split(' ')[0]}</h1>
        <p className="mt-2 opacity-90">Welcome to your student portal. Here&apos;s your overview.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="bg-primary-foreground/20 rounded-lg px-4 py-2"><span className="text-sm opacity-75">Student ID</span><p className="font-semibold">{currentStudent.studentId}</p></div>
          <div className="bg-primary-foreground/20 rounded-lg px-4 py-2"><span className="text-sm opacity-75">Class</span><p className="font-semibold">{currentStudent.class}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FiCalendar, label: 'Attendance', value: `${attendancePercentage}%`, sub: <><span className="text-primary">{presentDays} present</span> <span className="text-secondary">{lateDays} late</span></>, bg: 'bg-primary/10', color: 'text-primary' },
          { icon: FiFileText, label: 'Average', value: studentResult ? `${studentResult.averageScore.toFixed(1)}%` : 'N/A', sub: studentResult ? `Position: ${studentResult.position}` : 'No result yet', bg: 'bg-secondary/10', color: 'text-secondary' },
          { icon: FiDollarSign, label: 'Fee Status', value: currentStudent.feeStatus, sub: feeBalance > 0 ? `Balance: ${formatCurrency(feeBalance)}` : 'Fully paid', bg: feesPaid ? 'bg-primary/10' : 'bg-destructive/10', color: feesPaid ? 'text-primary' : 'text-destructive', badge: true },
          { icon: FiUser, label: 'Profile', value: currentStudent.fullName, sub: currentStudent.email, bg: 'bg-accent/10', color: 'text-accent-foreground' },
        ].map((item, idx) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}><item.icon className={`w-5 h-5 ${item.color}`} /></div>
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            {item.badge ? <Badge variant={feesPaid ? 'paid' : currentStudent.feeStatus === 'partial' ? 'partial' : 'unpaid'}>{item.value}</Badge> : <p className="text-2xl font-bold text-foreground truncate">{item.value}</p>}
            <p className="text-xs text-muted-foreground mt-2 flex gap-2 truncate">{item.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-foreground">Academic Result</h2>{studentResult && <Badge variant={feesPaid ? 'paid' : 'unpaid'}>{feesPaid ? 'Unlocked' : 'Locked'}</Badge>}</div>
          {studentResult ? (<>
            <div className="flex items-center gap-4 mb-4"><div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"><span className="text-2xl font-bold text-primary-foreground">{studentResult.averageScore.toFixed(0)}%</span></div><div><p className="font-medium text-foreground">{studentResult.term} - {studentResult.session}</p><p className="text-sm text-muted-foreground">Position: {studentResult.position}</p></div></div>
            {feesPaid ? <Link to="/learner/results"><Button className="w-full"><FiFileText className="w-4 h-4 mr-2" />View Full Result<FiArrowRight className="w-4 h-4 ml-2" /></Button></Link> : <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center"><FiXCircle className="w-8 h-8 mx-auto text-destructive mb-2" /><p className="text-sm text-destructive font-medium">Result Locked - Fees Not Paid</p></div>}
          </>) : <div className="bg-muted/50 rounded-lg p-6 text-center"><FiFileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" /><p className="text-muted-foreground">No results available yet</p></div>}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Recent Announcements</h2>
          {activeAnnouncements.length > 0 ? <div className="space-y-3">{activeAnnouncements.map(ann => (
            <div key={ann.id} className="p-3 rounded-lg bg-muted/50 border border-border"><div className="flex items-start justify-between gap-2"><h3 className="font-medium text-foreground text-sm">{ann.title}</h3><Badge variant={ann.category === 'urgent' ? 'destructive' : ann.category === 'academic' ? 'paid' : 'default'}>{ann.category}</Badge></div><p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p></div>
          ))}</div> : <div className="bg-muted/50 rounded-lg p-6 text-center"><p className="text-muted-foreground">No announcements</p></div>}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-foreground">Attendance Summary</h2><Link to="/learner/attendance"><Button variant="outline" size="sm">View All<FiArrowRight className="w-4 h-4 ml-2" /></Button></Link></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-primary/10"><FiCheckCircle className="w-6 h-6 mx-auto text-primary mb-2" /><p className="text-2xl font-bold text-foreground">{presentDays}</p><p className="text-xs text-muted-foreground">Days Present</p></div>
          <div className="text-center p-4 rounded-lg bg-secondary/10"><FiClock className="w-6 h-6 mx-auto text-secondary mb-2" /><p className="text-2xl font-bold text-foreground">{lateDays}</p><p className="text-xs text-muted-foreground">Days Late</p></div>
          <div className="text-center p-4 rounded-lg bg-destructive/10"><FiXCircle className="w-6 h-6 mx-auto text-destructive mb-2" /><p className="text-2xl font-bold text-foreground">{absentDays}</p><p className="text-xs text-muted-foreground">Days Absent</p></div>
        </div>
      </div>
    </motion.div>
  );
};

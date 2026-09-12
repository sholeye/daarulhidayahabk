/**
 * Parent Dashboard - Real shared data with animations
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiCalendar, FiFileText, FiDollarSign, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { students, results, attendance, announcements, isLoading } = useSharedData();

  const myChildren = students; // RLS filters
  const activeAnnouncements = announcements.filter(a => a.isActive).slice(0, 3);

  if (isLoading) return <InlineLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <h1 className="text-2xl sm:text-3xl font-bold">Assalamu Alaikum, {user?.name?.split(' ')[0] || 'Parent'}</h1>
        <p className="mt-2 opacity-90">Monitor your children's academic progress and school activities.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FiUsers, value: myChildren.length, label: 'Children Enrolled', bg: 'bg-primary/10', color: 'text-primary' },
          { icon: FiDollarSign, value: `${myChildren.filter(c => c.feeStatus === 'paid').length}/${myChildren.length}`, label: 'Fees Paid', bg: 'bg-primary/10', color: 'text-primary' },
          { icon: FiFileText, value: myChildren.filter(c => results.some(r => r.studentId === c.studentId)).length, label: 'Results Available', bg: 'bg-secondary/10', color: 'text-secondary' },
          { icon: FiCalendar, value: activeAnnouncements.length, label: 'Announcements', bg: 'bg-accent/10', color: 'text-accent-foreground' },
        ].map((item, idx) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3"><div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}><item.icon className={`w-5 h-5 ${item.color}`} /></div></div>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-foreground">My Children</h2>
          <Link to="/parent/children"><Button variant="outline" size="sm">View All <FiArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </div>
        <div className="space-y-4">
          {myChildren.length === 0 ? (
            <div className="text-center py-8"><FiUsers className="w-10 h-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No children linked to your account. Please contact the administrator.</p></div>
          ) : myChildren.map(child => {
            const childAttendance = attendance.filter(a => a.studentId === child.studentId);
            const presentDays = childAttendance.filter(a => a.status === 'present').length;
            const result = results.find(r => r.studentId === child.studentId);
            return (
              <div key={child.id} className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground font-bold text-lg">{child.fullName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{child.fullName}</p>
                    <p className="text-sm text-muted-foreground">{child.class} • {child.studentId}</p>
                  </div>
                  <Badge variant={child.feeStatus === 'paid' ? 'paid' : child.feeStatus === 'partial' ? 'partial' : 'unpaid'}>{child.feeStatus}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-background"><p className="text-lg font-bold text-foreground">{presentDays}</p><p className="text-xs text-muted-foreground">Days Present</p></div>
                  <div className="text-center p-2 rounded-lg bg-background"><p className="text-lg font-bold text-foreground">{result ? `${result.averageScore.toFixed(0)}%` : 'N/A'}</p><p className="text-xs text-muted-foreground">Average</p></div>
                  <div className="text-center p-2 rounded-lg bg-background"><p className="text-lg font-bold text-foreground">{formatCurrency(child.totalFee - child.amountPaid)}</p><p className="text-xs text-muted-foreground">Balance</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-lg text-foreground mb-4">School Announcements</h2>
        <div className="space-y-3">
          {activeAnnouncements.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No announcements</p>
          ) : activeAnnouncements.map(ann => (
            <div key={ann.id} className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1"><p className="font-medium text-foreground">{ann.title}</p><p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.content}</p></div>
                <Badge variant={ann.category === 'urgent' ? 'destructive' : 'outline'}>{ann.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{formatDate(ann.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
/**
 * Learner Attendance Page - RLS-filtered, no wrong fallback
 */

import React, { useState } from 'react';
import { FiCalendar, FiCheckCircle, FiClock, FiXCircle, FiFilter, FiUser } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/helpers';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

export const LearnerAttendance: React.FC = () => {
  const { user } = useAuth();
  const { students, attendance, isLoading } = useSharedData();
  const student = students.length === 1 ? students[0] : students.find(s => s.email === user?.email) || null;
  const [filterStatus, setFilterStatus] = useState<string>('all');

  if (isLoading) return <InlineLoader />;

  if (!student) return (
    <div className="p-12 text-center">
      <FiUser className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">No student record found for your account.</p>
    </div>
  );

  const studentAttendance = attendance
    .filter(a => a.studentId === student.studentId)
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allAttendance = attendance.filter(a => a.studentId === student.studentId);
  const presentCount = allAttendance.filter(a => a.status === 'present').length;
  const lateCount = allAttendance.filter(a => a.status === 'late').length;
  const absentCount = allAttendance.filter(a => a.status === 'absent').length;
  const totalDays = allAttendance.length || 1;
  const attendancePercentage = Math.round(((presentCount + lateCount) / totalDays) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Attendance</h1><p className="text-muted-foreground mt-1">View your attendance history</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FiCheckCircle className="w-5 h-5 text-primary" /></div></div><p className="text-2xl font-bold text-foreground">{presentCount}</p><p className="text-sm text-muted-foreground">Days Present</p></div>
        <div className="bg-card rounded-xl border border-border p-4"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center"><FiClock className="w-5 h-5 text-secondary" /></div></div><p className="text-2xl font-bold text-foreground">{lateCount}</p><p className="text-sm text-muted-foreground">Days Late</p></div>
        <div className="bg-card rounded-xl border border-border p-4"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><FiXCircle className="w-5 h-5 text-destructive" /></div></div><p className="text-2xl font-bold text-foreground">{absentCount}</p><p className="text-sm text-muted-foreground">Days Absent</p></div>
        <div className="bg-card rounded-xl border border-border p-4"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><FiCalendar className="w-5 h-5 text-accent-foreground" /></div></div><p className="text-2xl font-bold text-foreground">{attendancePercentage}%</p><p className="text-sm text-muted-foreground">Attendance Rate</p></div>
      </div>

      <div className="flex items-center gap-4">
        <FiFilter className="w-5 h-5 text-muted-foreground" />
        <div className="flex gap-2">
          {['all', 'present', 'late', 'absent'].map(status => (
            <button key={status} onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50"><tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Date</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Day</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Check-in</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {studentAttendance.map((record) => (
                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><FiCalendar className="w-5 h-5 text-muted-foreground" /></div><span className="font-medium text-foreground">{formatDate(record.date)}</span></div></td>
                  <td className="px-6 py-4 text-sm text-foreground">{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                  <td className="px-6 py-4"><Badge variant={record.status === 'present' ? 'present' : record.status === 'late' ? 'late' : 'absent'}>{record.status}</Badge></td>
                  <td className="px-6 py-4 text-sm text-foreground">{record.checkInTime || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {studentAttendance.length === 0 && <div className="p-12 text-center"><FiCalendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">No attendance records</p></div>}
      </div>
    </motion.div>
  );
};

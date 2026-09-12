/**
 * Instructor Attendance Page - restricted to admin-assigned classes
 */

import React, { useState, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiCalendar, FiCheck, FiUsers } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

export const InstructorAttendance: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const { user } = useAuth();
  const { students, attendance, schoolClasses, setAttendanceRecord, bulkSetAttendance, isLoading } = useSharedData();

  const assignedClasses = schoolClasses.filter((schoolClass) => schoolClass.instructorId === user?.id);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);

  React.useEffect(() => {
    const hasSelectedClass = assignedClasses.some((schoolClass) => schoolClass.name === selectedClass);
    if (!hasSelectedClass) {
      setSelectedClass(assignedClasses[0]?.name || '');
    }
  }, [assignedClasses, selectedClass]);

  const isFutureDate = selectedDate > today;
  const classStudents = students.filter((student) => student.class === selectedClass);

  const getStatus = useCallback((studentId: string): 'present' | 'absent' | null => {
    const record = attendance.find((item) => item.studentId === studentId && item.date === selectedDate);
    return record ? (record.status === 'present' ? 'present' : 'absent') : null;
  }, [attendance, selectedDate]);

  const toggleAttendance = useCallback((studentId: string, status: 'present' | 'absent') => {
    if (isFutureDate) {
      toast.error('Cannot mark future dates');
      return;
    }

    setAttendanceRecord({
      id: Date.now().toString(),
      studentId,
      date: selectedDate,
      status,
      checkInTime: status === 'present' ? new Date().toTimeString().slice(0, 5) : undefined,
    });

    const student = classStudents.find((item) => item.studentId === studentId);
    toast.success(`${student?.fullName} marked ${status}`, { duration: 1500 });
  }, [selectedDate, isFutureDate, classStudents, setAttendanceRecord]);

  const markAllPresent = () => {
    if (isFutureDate) {
      toast.error('Cannot mark future dates');
      return;
    }

    const newRecords = classStudents
      .filter((student) => !getStatus(student.studentId))
      .map((student) => ({
        id: `${Date.now()}-${student.studentId}`,
        studentId: student.studentId,
        date: selectedDate,
        status: 'present' as const,
        checkInTime: new Date().toTimeString().slice(0, 5),
      }));

    if (newRecords.length > 0) {
      bulkSetAttendance(newRecords);
      toast.success(`Marked ${newRecords.length} present`);
    }
  };

  const presentCount = classStudents.filter((student) => getStatus(student.studentId) === 'present').length;
  const absentCount = classStudents.filter((student) => getStatus(student.studentId) === 'absent').length;

  if (isLoading) return <InlineLoader />;

  if (assignedClasses.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-2xl border border-border">
        <FiUsers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No classes assigned yet. Contact an administrator.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mark Attendance</h1><p className="text-muted-foreground mt-1">Select an assigned class and mark attendance</p></div>
        {selectedDate === today && <Button variant="outline" onClick={markAllPresent}><FiCheck className="w-4 h-4 mr-2" />Mark All Present</Button>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FiCheckCircle className="w-5 h-5 text-primary" /></div><div><p className="text-xl font-bold text-foreground">{presentCount}</p><p className="text-sm text-muted-foreground">Present</p></div></div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><FiXCircle className="w-5 h-5 text-destructive" /></div><div><p className="text-xl font-bold text-foreground">{absentCount}</p><p className="text-sm text-muted-foreground">Absent</p></div></div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><span className="text-lg font-bold text-foreground">{classStudents.length}</span></div><div><p className="text-sm text-muted-foreground">Total Students</p></div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className="h-10 px-4 rounded-lg border border-input bg-background text-foreground">
          {assignedClasses.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.name}>{schoolClass.name}</option>)}
        </select>
        <div className="relative"><FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input type="date" value={selectedDate} max={today} onChange={(event) => setSelectedDate(event.target.value)} className="pl-12 w-full sm:w-48" /></div>
      </div>

      {isFutureDate && <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center"><p className="text-destructive font-medium">Cannot mark attendance for future dates</p></div>}

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50"><tr><th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Student</th><th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Present</th><th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Absent</th><th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th></tr></thead>
          <tbody className="divide-y divide-border">
            {classStudents.map((student) => {
              const status = getStatus(student.studentId);
              return (
                <tr key={student.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center"><span className="text-primary-foreground font-bold">{student.fullName[0]}</span></div><div><p className="font-medium text-foreground">{student.fullName}</p><p className="text-sm text-muted-foreground">{student.studentId}</p></div></div></td>
                  <td className="px-6 py-4 text-center"><Checkbox checked={status === 'present'} onCheckedChange={() => toggleAttendance(student.studentId, 'present')} disabled={isFutureDate} className="data-[state=checked]:bg-primary" /></td>
                  <td className="px-6 py-4 text-center"><Checkbox checked={status === 'absent'} onCheckedChange={() => toggleAttendance(student.studentId, 'absent')} disabled={isFutureDate} className="data-[state=checked]:bg-destructive" /></td>
                  <td className="px-6 py-4">{status ? <Badge variant={status === 'present' ? 'present' : 'absent'}>{status}</Badge> : <span className="text-muted-foreground text-sm">Not marked</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {classStudents.length === 0 && <div className="p-12 text-center"><p className="text-muted-foreground">No students in this class</p></div>}
      </div>
    </motion.div>
  );
};

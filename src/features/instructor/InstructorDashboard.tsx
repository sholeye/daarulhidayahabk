/**
 * Instructor Dashboard - restricted to admin-assigned classes
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiFileText, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { students, schoolClasses, results, isLoading } = useSharedData();

  const assignedClasses = schoolClasses.filter((schoolClass) => schoolClass.instructorId === user?.id);
  const assignedClassNames = new Set(assignedClasses.map((schoolClass) => schoolClass.name));
  const assignedStudents = students.filter((student) => assignedClassNames.has(student.class));

  const pendingResults = assignedStudents.filter(
    (student) => !results.some((result) => result.studentId === student.studentId),
  ).length;

  if (isLoading) return <InlineLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <h1 className="text-2xl sm:text-3xl font-bold">Assalamu Alaikum, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-2 opacity-90">Manage students in your assigned classes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><FiUsers className="w-6 h-6 text-primary" /></div>
          <div><p className="text-2xl font-bold text-foreground">{assignedClasses.length}</p><p className="text-sm text-muted-foreground">Assigned Classes</p></div>
        </motion.div>

        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center"><FiUsers className="w-6 h-6 text-secondary" /></div>
          <div><p className="text-2xl font-bold text-foreground">{assignedStudents.length}</p><p className="text-sm text-muted-foreground">Students</p></div>
        </motion.div>

        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center"><FiFileText className="w-6 h-6 text-accent-foreground" /></div>
          <div><p className="text-2xl font-bold text-foreground">{pendingResults}</p><p className="text-sm text-muted-foreground">Pending Results</p></div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link to="/instructor/attendance" className="bg-card rounded-2xl border border-border p-6 hover:shadow-soft transition-shadow">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-foreground">Mark Attendance</h3><FiArrowRight className="w-5 h-5 text-muted-foreground" /></div>
          <p className="text-sm text-muted-foreground mt-2">Mark attendance for assigned classes</p>
        </Link>
        <Link to="/instructor/results" className="bg-card rounded-2xl border border-border p-6 hover:shadow-soft transition-shadow">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-foreground">Enter Results</h3><FiArrowRight className="w-5 h-5 text-muted-foreground" /></div>
          <p className="text-sm text-muted-foreground mt-2">Enter results for assigned students</p>
        </Link>
        <Link to="/instructor/students" className="bg-card rounded-2xl border border-border p-6 hover:shadow-soft transition-shadow">
          <div className="flex items-center justify-between"><h3 className="font-semibold text-foreground">View Students</h3><FiArrowRight className="w-5 h-5 text-muted-foreground" /></div>
          <p className="text-sm text-muted-foreground mt-2">Read-only student details for assigned classes</p>
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Assigned Classes</h3>
        {assignedClasses.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No classes assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {assignedClasses.map((schoolClass) => {
              const classStudentCount = assignedStudents.filter((student) => student.class === schoolClass.name).length;
              return (
                <div key={schoolClass.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{schoolClass.name}</p>
                    <p className="text-sm text-muted-foreground">{schoolClass.nameArabic}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{classStudentCount} students</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

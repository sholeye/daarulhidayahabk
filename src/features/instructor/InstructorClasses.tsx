/**
 * Instructor Classes Page - restricted to admin-assigned classes
 */

import React from 'react';
import { FiUsers, FiBook } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Badge } from '@/components/ui/badge';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

export const InstructorClasses: React.FC = () => {
  const { user } = useAuth();
  const { students, schoolClasses, isLoading } = useSharedData();

  const assignedClasses = schoolClasses.filter((schoolClass) => schoolClass.instructorId === user?.id);

  if (isLoading) return <InlineLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Classes</h1>
        <p className="text-muted-foreground mt-1">View classes assigned by the admin</p>
      </div>

      {assignedClasses.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <FiUsers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No classes assigned yet. Contact an administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assignedClasses.map((schoolClass, index) => {
            const classStudents = students.filter((student) => student.class === schoolClass.name);

            return (
              <motion.div
                key={schoolClass.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="bg-card rounded-2xl border border-border p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FiBook className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{schoolClass.name}</h3>
                    <p className="text-sm text-muted-foreground">{schoolClass.nameArabic}</p>
                  </div>
                  <Badge variant="default" className="ml-auto">{schoolClass.level}</Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4">{classStudents.length} students enrolled</p>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {classStudents.map((student) => (
                    <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                        <span className="text-primary-foreground text-sm font-bold">{student.fullName[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground">{student.studentId}</p>
                      </div>
                    </div>
                  ))}

                  {classStudents.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No students in this class yet</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

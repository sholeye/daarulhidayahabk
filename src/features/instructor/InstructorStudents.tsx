/**
 * Instructor Students - Read-only view restricted to assigned classes
 */

import React, { useState } from 'react';
import { FiSearch, FiEye, FiX, FiUser, FiUsers } from 'react-icons/fi';
import { Student } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/helpers';
import { InlineLoader } from '@/components/ui/page-loader';

const StudentDetailModal: React.FC<{ student: Student | null; onClose: () => void }> = ({ student, onClose }) => {
  if (!student) return null;
  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-strong w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Student Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors"><FiX className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">{student.fullName[0]}</span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">{student.fullName}</h3>
              <p className="text-muted-foreground">{student.studentId}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="default">{student.class}</Badge>
                <Badge variant={student.feeStatus === 'paid' ? 'paid' : student.feeStatus === 'partial' ? 'partial' : 'unpaid'}>{student.feeStatus}</Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted-foreground">Date of Birth</p><p className="font-medium text-foreground">{formatDate(student.dateOfBirth)}</p></div>
            <div><p className="text-muted-foreground">Sex</p><p className="font-medium text-foreground capitalize">{student.sex}</p></div>
            <div><p className="text-muted-foreground">Phone</p><p className="font-medium text-foreground">{student.phone || 'N/A'}</p></div>
            <div><p className="text-muted-foreground">Origin</p><p className="font-medium text-foreground">{student.origin || 'N/A'}</p></div>
            <div className="col-span-2"><p className="text-muted-foreground">Address</p><p className="font-medium text-foreground">{student.address || 'N/A'}</p></div>
            <div><p className="text-muted-foreground">Guardian</p><p className="font-medium text-foreground">{student.guardian.name}</p></div>
            <div><p className="text-muted-foreground">Guardian Phone</p><p className="font-medium text-foreground">{student.guardian.phone}</p></div>
            <div><p className="text-muted-foreground">Enrolled</p><p className="font-medium text-foreground">{formatDate(student.enrollmentDate)}</p></div>
          </div>
          <p className="text-xs text-muted-foreground italic text-center pt-4 border-t border-border">
            View only — editing student records is restricted to administrators.
          </p>
        </div>
      </div>
    </div>
  );
};

export const InstructorStudents: React.FC = () => {
  const { user } = useAuth();
  const { students, schoolClasses, isLoading } = useSharedData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const assignedClasses = schoolClasses.filter((schoolClass) => schoolClass.instructorId === user?.id);
  const assignedClassNames = new Set(assignedClasses.map((schoolClass) => schoolClass.name));
  const assignedStudents = students.filter((student) => assignedClassNames.has(student.class));

  const filteredStudents = assignedStudents.filter((student) => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'all' || student.class === filterClass;
    return matchesSearch && matchesClass;
  });

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Students</h1>
        <p className="text-muted-foreground mt-1">Read-only access to students in your assigned classes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name or ID..." className="pl-12" />
        </div>
        <select
          value={filterClass}
          onChange={(event) => setFilterClass(event.target.value)}
          className="h-10 px-4 rounded-lg border border-input bg-background text-foreground"
        >
          <option value="all">All Assigned Classes</option>
          {assignedClasses.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.name}>{schoolClass.name}</option>)}
        </select>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Student</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">ID</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Class</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Guardian</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-bold">{student.fullName[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{student.fullName}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-mono">{student.studentId}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{student.class}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{student.guardian.name}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-12 text-center">
            <FiUser className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No students found</p>
          </div>
        )}
      </div>

      <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
};

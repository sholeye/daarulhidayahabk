/**
 * Instructor Results Page - restricted to admin-assigned classes
 */

import React, { useState } from 'react';
import { FiFileText, FiSave, FiUsers } from 'react-icons/fi';
import { Student } from '@/types';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { calculateGrade, getGradeRemarks } from '@/utils/helpers';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

const SUBJECTS = ['hifz', "qira'a", 'hadith', 'lugah', 'seerah', 'adhkar', 'tajweed', 'tawheed', 'fiqh', 'nahw', 'sarf', 'khat'];

export const InstructorResults: React.FC = () => {
  const { user } = useAuth();
  const { students, results, schoolClasses, addOrUpdateResult, isLoading } = useSharedData();

  const assignedClasses = schoolClasses.filter((schoolClass) => schoolClass.instructorId === user?.id);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [position, setPosition] = useState('1');

  React.useEffect(() => {
    const hasSelectedClass = assignedClasses.some((schoolClass) => schoolClass.name === selectedClass);
    if (!hasSelectedClass) {
      setSelectedClass(assignedClasses[0]?.name || '');
      setSelectedStudent(null);
    }
  }, [assignedClasses, selectedClass]);

  const classStudents = students.filter((student) => student.class === selectedClass);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    const existingResult = results.find((result) => result.studentId === student.studentId);

    if (existingResult) {
      const scoreMap: Record<string, number> = {};
      existingResult.subjects.forEach((subject) => {
        scoreMap[subject.subject] = subject.score;
      });
      setScores(scoreMap);
      setTeacherRemarks(existingResult.teacherRemarks || '');
      setPosition(existingResult.position?.toString() || '1');
      return;
    }

    setScores({});
    setTeacherRemarks('');
    setPosition('1');
  };

  const handleSave = async () => {
    if (!selectedStudent) return;

    const subjects = SUBJECTS.map((subject) => {
      const score = scores[subject] || 0;
      const grade = calculateGrade(score);
      return { subject, score, grade, remarks: getGradeRemarks(grade) };
    });

    const totalScore = subjects.reduce((sum, subject) => sum + subject.score, 0);
    const averageScore = totalScore / subjects.length;

    try {
      await addOrUpdateResult({
        id: Date.now().toString(),
        studentId: selectedStudent.studentId,
        term: 'First Term',
        session: '2024/2025',
        subjects,
        totalScore,
        averageScore,
        position: parseInt(position, 10),
        teacherRemarks,
        principalRemarks: '',
        createdAt: new Date().toISOString().split('T')[0],
      });
      toast.success('Result saved successfully!');
      setSelectedStudent(null);
      setScores({});
    } catch {
      toast.error('Failed to save result');
    }
  };

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
      <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">Enter Results</h1><p className="text-muted-foreground mt-1">Enter scores for students in your assigned classes</p></div>

      <select value={selectedClass} onChange={(event) => { setSelectedClass(event.target.value); setSelectedStudent(null); }} className="h-10 px-4 rounded-lg border border-input bg-background text-foreground">
        {assignedClasses.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.name}>{schoolClass.name}</option>)}
      </select>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">Students</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {classStudents.map((student) => {
              const hasResult = results.some((result) => result.studentId === student.studentId);
              return (
                <button key={student.id} onClick={() => handleSelectStudent(student)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${selectedStudent?.id === student.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedStudent?.id === student.id ? 'bg-primary-foreground/20' : 'bg-gradient-to-br from-primary to-primary/70'}`}>
                    <span className="text-primary-foreground font-bold">{student.fullName[0]}</span>
                  </div>
                  <div className="text-left flex-1"><p className="font-medium">{student.fullName}</p><p className={`text-sm ${selectedStudent?.id === student.id ? 'opacity-75' : 'text-muted-foreground'}`}>{student.studentId}</p></div>
                  {hasResult && <Badge variant="paid" className="text-xs">Done</Badge>}
                </button>
              );
            })}
            {classStudents.length === 0 && <p className="text-muted-foreground text-center py-4">No students in this class</p>}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          {selectedStudent ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Enter Scores for {selectedStudent.fullName}</h3>
                <Button onClick={handleSave}><FiSave className="w-4 h-4 mr-2" />Save</Button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {SUBJECTS.map((subject) => {
                  const score = scores[subject] || 0;
                  const grade = calculateGrade(score);
                  return (
                    <div key={subject} className="flex items-center gap-4">
                      <div className="flex-1"><label className="text-sm text-muted-foreground">{subject}</label><Input type="number" min="0" max="100" value={scores[subject] || ''} onChange={(event) => setScores({ ...scores, [subject]: parseInt(event.target.value, 10) || 0 })} placeholder="0" /></div>
                      <Badge variant={grade === 'A+' || grade === 'A' ? 'paid' : grade === 'F' ? 'absent' : 'present'}>{grade}</Badge>
                    </div>
                  );
                })}
                <div><label className="text-sm text-muted-foreground">Position in Class</label><Input type="number" min="1" value={position} onChange={(event) => setPosition(event.target.value)} /></div>
                <div><label className="text-sm text-muted-foreground">Teacher's Remarks</label><textarea value={teacherRemarks} onChange={(event) => setTeacherRemarks(event.target.value)} className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-foreground resize-none" placeholder="Enter remarks..." /></div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-12"><div><FiFileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">Select a student to enter results</p></div></div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Results Management Page (Admin - View Only) - Shared state
 */

import React, { useState } from 'react';
import { FiFileText, FiSearch, FiDownload, FiEye, FiLock, FiUnlock, FiX } from 'react-icons/fi';
import { Student, StudentResult } from '@/types';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDate } from '@/utils/helpers';
import jsPDF from 'jspdf';
import { formatCurrency } from '@/utils/helpers';
import { isResultAccessible } from '@/utils/helpers';

interface ResultViewModalProps { isOpen: boolean; onClose: () => void; student: Student | null; result: StudentResult | null; }

const ResultViewModal: React.FC<ResultViewModalProps> = ({ isOpen, onClose, student, result }) => {
  if (!isOpen || !student || !result) return null;
  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-strong w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div><h2 className="text-xl font-bold text-foreground">View Result</h2><p className="text-sm text-muted-foreground">{student.fullName} - {result.term}</p></div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors"><FiX className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-primary/5 rounded-xl text-center"><p className="text-2xl font-bold text-primary">{result.totalScore}</p><p className="text-sm text-muted-foreground">Total Score</p></div>
            <div className="p-4 bg-secondary/5 rounded-xl text-center"><p className="text-2xl font-bold text-secondary">{result.averageScore.toFixed(1)}%</p><p className="text-sm text-muted-foreground">Average</p></div>
            <div className="p-4 bg-accent/10 rounded-xl text-center"><p className="text-2xl font-bold text-accent-foreground">{result.position}</p><p className="text-sm text-muted-foreground">Position</p></div>
          </div>
          <div><h3 className="font-semibold text-foreground mb-3">Subject Scores</h3>
            <div className="space-y-2">{result.subjects.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-foreground">{subject.subject}</span>
                <div className="flex items-center gap-3"><span className="font-mono text-foreground">{subject.score}</span>
                  <Badge variant={subject.grade === 'A+' || subject.grade === 'A' ? 'paid' : subject.grade === 'F' ? 'absent' : 'present'}>{subject.grade}</Badge></div>
              </div>
            ))}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-xl"><p className="text-sm text-muted-foreground mb-1">Teacher's Remarks</p><p className="text-foreground">{result.teacherRemarks || 'N/A'}</p></div>
            <div className="p-4 bg-muted/30 rounded-xl"><p className="text-sm text-muted-foreground mb-1">Principal's Remarks</p><p className="text-foreground">{result.principalRemarks || 'N/A'}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResultsPage: React.FC = () => {
  const { students, results } = useSharedData();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [viewingResult, setViewingResult] = useState<StudentResult | null>(null);

  const studentsWithResults = students
    .filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(student => ({ ...student, result: results.find(r => r.studentId === student.studentId) }));

  const generateResultPDF = (student: Student, result: StudentResult) => {
    if (!isResultAccessible(student)) { toast.error('Cannot generate result - fees not fully paid!'); return; }
    const doc = new jsPDF();
    doc.setFillColor(22, 101, 52); doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(24);
    doc.text('Daarul Hidayah', 105, 18, { align: 'center' });
    doc.setFontSize(12); doc.text('Islamic & Arabic School', 105, 28, { align: 'center' });
    doc.setFontSize(10); doc.text('Ita Ika, Abeokuta, Ogun State | daarulhidayahabk@gmail.com', 105, 38, { align: 'center' });
    doc.setTextColor(0, 0, 0); doc.setFontSize(16);
    doc.text('STUDENT RESULT SHEET', 105, 55, { align: 'center' });
    doc.setFontSize(11); doc.text(`${result.term} - ${result.session}`, 105, 62, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Name: ${student.fullName}`, 20, 75); doc.text(`Student ID: ${student.studentId}`, 120, 75);
    doc.text(`Class: ${student.class}`, 20, 82); doc.text(`Position: ${result.position}`, 120, 82);
    let y = 95;
    doc.setFillColor(22, 101, 52); doc.setTextColor(255, 255, 255); doc.rect(20, y, 170, 8, 'F');
    doc.text('Subject', 25, y + 6); doc.text('Score', 110, y + 6); doc.text('Grade', 135, y + 6); doc.text('Remarks', 155, y + 6);
    doc.setTextColor(0, 0, 0); y += 10;
    result.subjects.forEach((subject, i) => {
      if (i % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(20, y - 2, 170, 8, 'F'); }
      doc.text(subject.subject, 25, y + 4); doc.text(subject.score.toString(), 115, y + 4);
      doc.text(subject.grade, 140, y + 4); doc.text(subject.remarks, 155, y + 4); y += 8;
    });
    y += 5; doc.line(20, y, 190, y); y += 8; doc.setFontSize(11);
    doc.text(`Total Score: ${result.totalScore}`, 20, y); doc.text(`Average: ${result.averageScore.toFixed(1)}%`, 80, y); doc.text(`Position: ${result.position}`, 140, y);
    y += 15; doc.setFontSize(10); doc.text("Teacher's Remarks:", 20, y); doc.setFontSize(9); doc.text(result.teacherRemarks || 'N/A', 20, y + 6);
    y += 18; doc.setFontSize(10); doc.text("Principal's Remarks:", 20, y); doc.setFontSize(9); doc.text(result.principalRemarks || 'N/A', 20, y + 6);
    doc.setFontSize(8); doc.text('This is an official result sheet from Daarul Hidayah Islamic & Arabic School', 105, 280, { align: 'center' });
    doc.save(`Result-${student.studentId}-${result.term.replace(' ', '-')}.pdf`);
    toast.success('Result PDF downloaded!');
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">Results</h1><p className="text-muted-foreground mt-1">View student academic results (Instructors upload results)</p></div>
      <div className="relative max-w-md"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search students..." className="pl-12" /></div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Student</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Class</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Result Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Fee Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Average</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {studentsWithResults.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0"><span className="text-primary-foreground font-bold">{student.fullName[0]}</span></div><div><p className="font-medium text-foreground">{student.fullName}</p><p className="text-sm text-muted-foreground">{student.studentId}</p></div></div></td>
                  <td className="px-6 py-4 text-sm text-foreground">{student.class}</td>
                  <td className="px-6 py-4">{student.result ? <Badge variant="paid">Uploaded</Badge> : <Badge variant="unpaid">Pending</Badge>}</td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2">{student.feeStatus === 'paid' ? <FiUnlock className="w-4 h-4 text-primary" /> : <FiLock className="w-4 h-4 text-destructive" />}<Badge variant={student.feeStatus === 'paid' ? 'paid' : 'unpaid'}>{student.feeStatus}</Badge></div></td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{student.result ? `${student.result.averageScore.toFixed(1)}%` : '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {student.result && (<>
                        <button onClick={() => { setViewingStudent(student); setViewingResult(student.result!); }} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="View Result"><FiEye className="w-4 h-4" /></button>
                         <button onClick={() => generateResultPDF(student, student.result!)} className={`p-2 rounded-lg transition-colors ${isResultAccessible(student) ? 'hover:bg-muted text-muted-foreground hover:text-foreground' : 'opacity-50 cursor-not-allowed text-muted-foreground'}`} title={isResultAccessible(student) ? 'Download PDF' : 'Fee not paid'} disabled={!isResultAccessible(student)}><FiDownload className="w-4 h-4" /></button>
                      </>)}
                      {!student.result && <span className="text-sm text-muted-foreground">Awaiting instructor</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ResultViewModal isOpen={!!viewingResult} onClose={() => { setViewingStudent(null); setViewingResult(null); }} student={viewingStudent} result={viewingResult} />
    </div>
  );
};

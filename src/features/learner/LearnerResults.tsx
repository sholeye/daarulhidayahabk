/**
 * Learner Results Page - RLS-filtered, no wrong fallback
 */

import React from 'react';
import { FiFileText, FiDownload, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { getOutstandingBalance, isResultAccessible } from '@/utils/helpers';

export const LearnerResults: React.FC = () => {
  const { user } = useAuth();
  const { students, results, isLoading } = useSharedData();
  const student = students.length === 1 ? students[0] : students.find(s => s.email === user?.email) || null;
  const result = student ? results.find(r => r.studentId === student.studentId) : null;
  const feesPaid = isResultAccessible(student);
  const balance = student ? getOutstandingBalance(student.totalFee, student.amountPaid) : 0;

  const generateResultPDF = () => {
    if (!feesPaid || !result || !student) { toast.error('Cannot download result'); return; }
    const doc = new jsPDF();
    doc.setFillColor(22, 101, 52); doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(24);
    doc.text('Daarul Hidayah', 105, 18, { align: 'center' });
    doc.setFontSize(12); doc.text('Islamic & Arabic School', 105, 28, { align: 'center' });
    doc.setFontSize(10); doc.text('Ita Ika, Abeokuta, Ogun State', 105, 38, { align: 'center' });
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
    result.subjects.forEach((s, i) => {
      if (i % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(20, y - 2, 170, 8, 'F'); }
      doc.text(s.subject, 25, y + 4); doc.text(s.score.toString(), 115, y + 4);
      doc.text(s.grade, 140, y + 4); doc.text(s.remarks, 155, y + 4); y += 8;
    });
    y += 5; doc.line(20, y, 190, y); y += 8; doc.setFontSize(11);
    doc.text(`Total: ${result.totalScore}`, 20, y); doc.text(`Avg: ${result.averageScore.toFixed(1)}%`, 80, y);
    doc.save(`Result-${student.studentId}.pdf`);
    toast.success('Result PDF downloaded!');
  };

  if (isLoading) return <InlineLoader />;

  if (!student) return (
    <div className="p-12 text-center">
      <FiUser className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">No student record found for your account.</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Results</h1><p className="text-muted-foreground mt-1">View your academic performance</p></div>
        {result && feesPaid && <Button onClick={generateResultPDF} className="btn-glow"><FiDownload className="w-4 h-4 mr-2" />Download PDF</Button>}
      </div>

      {!feesPaid && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0"><FiLock className="w-6 h-6 text-destructive" /></div>
            <div><h2 className="font-semibold text-destructive">Result Access Locked</h2><p className="text-sm text-muted-foreground mt-1">Complete your fee payment to access results.</p>
              <div className="mt-4 flex items-center gap-2"><Badge variant="unpaid">{student.feeStatus}</Badge><span className="text-sm text-muted-foreground">Balance: ₦{balance.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}

      {!result && feesPaid && (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FiFileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">No Results Available</h2>
          <p className="text-muted-foreground mt-2">Check back later.</p>
        </div>
      )}

      {result && feesPaid && (
        <>
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><h2 className="text-lg font-semibold">{result.term} - {result.session}</h2><p className="opacity-90 mt-1">{student.class}</p></div>
              <div className="flex gap-6 text-center">
                <div><p className="text-3xl font-bold">{result.averageScore.toFixed(1)}%</p><p className="text-sm opacity-75">Average</p></div>
                <div><p className="text-3xl font-bold">{result.position}</p><p className="text-sm opacity-75">Position</p></div>
                <div><p className="text-3xl font-bold">{result.totalScore}</p><p className="text-sm opacity-75">Total</p></div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border"><h3 className="font-semibold text-foreground">Subject Performance</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50"><tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Subject</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Score</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Grade</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Remarks</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {result.subjects.map((subject, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FiFileText className="w-5 h-5 text-primary" /></div><span className="font-medium text-foreground">{subject.subject}</span></div></td>
                      <td className="px-6 py-4 text-center"><span className="text-lg font-semibold text-foreground">{subject.score}</span><span className="text-muted-foreground">/100</span></td>
                      <td className="px-6 py-4 text-center"><Badge variant={subject.grade === 'A+' || subject.grade === 'A' ? 'paid' : subject.grade === 'F' ? 'absent' : 'present'}>{subject.grade}</Badge></td>
                      <td className="px-6 py-4 text-sm text-foreground">{subject.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6"><h3 className="font-semibold text-foreground mb-3">Teacher&apos;s Remarks</h3><p className="text-muted-foreground">{result.teacherRemarks || 'No remarks'}</p></div>
            <div className="bg-card rounded-2xl border border-border p-6"><h3 className="font-semibold text-foreground mb-3">Principal&apos;s Remarks</h3><p className="text-muted-foreground">{result.principalRemarks || 'No remarks'}</p></div>
          </div>
        </>
      )}
    </motion.div>
  );
};

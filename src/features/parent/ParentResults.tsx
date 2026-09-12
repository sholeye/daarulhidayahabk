/**
 * Parent Results - Uses real shared data (fee-gated)
 */

import React, { useState } from 'react';
import { FiFileText, FiLock, FiDollarSign } from 'react-icons/fi';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Badge } from '@/components/ui/badge';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';
import { getOutstandingBalance, isResultAccessible } from '@/utils/helpers';

export const ParentResults: React.FC = () => {
  const { students, results, isLoading } = useSharedData();
  const myChildren = students;
  const [selectedChild, setSelectedChild] = useState(myChildren[0]?.studentId || '');

  React.useEffect(() => {
    if (myChildren.length > 0 && !myChildren.find(c => c.studentId === selectedChild)) {
      setSelectedChild(myChildren[0].studentId);
    }
  }, [myChildren, selectedChild]);

  const child = myChildren.find(c => c.studentId === selectedChild);
  const result = results.find(r => r.studentId === selectedChild);
  const feesPaid = isResultAccessible(child);
  const balance = child ? getOutstandingBalance(child.totalFee, child.amountPaid) : 0;

  if (isLoading) return <InlineLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Academic Results</h1>
        <p className="text-muted-foreground mt-1">View your children's academic performance</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {myChildren.map(c => (
          <button key={c.studentId} onClick={() => setSelectedChild(c.studentId)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedChild === c.studentId ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            {c.fullName.split(' ')[0]}
          </button>
        ))}
      </div>

      {!feesPaid && child && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0"><FiLock className="w-6 h-6 text-destructive" /></div>
          <div>
            <h2 className="font-semibold text-destructive">Result Access Locked</h2>
            <p className="text-sm text-muted-foreground mt-1">{child.fullName}'s school fees have not been fully paid. Outstanding balance: ₦{balance.toLocaleString()}.</p>
            <Badge variant="unpaid" className="mt-2">{child.feeStatus}</Badge>
          </div>
        </div>
      )}

      {!result && feesPaid && (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <FiFileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground">No Results Available</h2>
          <p className="text-muted-foreground mt-2">Results have not been uploaded yet.</p>
        </div>
      )}

      {result && feesPaid && child && (
        <>
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
            <h2 className="text-lg font-semibold">{child.fullName} - {result.term}</h2>
            <p className="opacity-90 mt-1">{child.class} • {result.session}</p>
            <div className="flex gap-6 mt-4 text-center">
              <div><p className="text-3xl font-bold">{result.averageScore.toFixed(1)}%</p><p className="text-sm opacity-75">Average</p></div>
              <div><p className="text-3xl font-bold">{result.position}</p><p className="text-sm opacity-75">Position</p></div>
              <div><p className="text-3xl font-bold">{result.totalScore}</p><p className="text-sm opacity-75">Total</p></div>
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
                  {result.subjects.map((s, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{s.subject}</td>
                      <td className="px-6 py-4 text-center"><span className="text-lg font-semibold text-foreground">{s.score}</span><span className="text-muted-foreground">/100</span></td>
                      <td className="px-6 py-4 text-center"><Badge variant={s.grade === 'A+' || s.grade === 'A' ? 'paid' : s.grade === 'F' ? 'absent' : 'present'}>{s.grade}</Badge></td>
                      <td className="px-6 py-4 text-sm text-foreground">{s.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6"><h3 className="font-semibold text-foreground mb-3">Teacher's Remarks</h3><p className="text-muted-foreground">{result.teacherRemarks || 'No remarks'}</p></div>
            <div className="bg-card rounded-2xl border border-border p-6"><h3 className="font-semibold text-foreground mb-3">Principal's Remarks</h3><p className="text-muted-foreground">{result.principalRemarks || 'No remarks'}</p></div>
          </div>
        </>
      )}

      {myChildren.length === 0 && (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">No children linked to your account.</p>
        </div>
      )}
    </motion.div>
  );
};
/**
 * Parent Children Page - Uses real shared data
 */

import React, { useState } from 'react';
import { FiUser, FiCheckCircle, FiXCircle, FiFileText, FiDollarSign } from 'react-icons/fi';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Student } from '@/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getOutstandingBalance, isResultAccessible } from '@/utils/helpers';
import { InlineLoader } from '@/components/ui/page-loader';
import { motion } from 'framer-motion';

export const ParentChildren: React.FC = () => {
  const { students, results, attendance, payments, isLoading } = useSharedData();
  const myChildren = students; // RLS filters to linked children

  if (isLoading) return <InlineLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Children</h1>
        <p className="text-muted-foreground mt-1">View your children's profiles and academic information</p>
      </div>

      {myChildren.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <FiUser className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No children linked to your account. Contact the administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {myChildren.map((child, idx) => {
            const result = results.find(r => r.studentId === child.studentId);
            const childAttendance = attendance.filter(a => a.studentId === child.studentId);
            const presentDays = childAttendance.filter(a => a.status === 'present').length;
            const absentDays = childAttendance.filter(a => a.status === 'absent').length;

            return (
              <motion.div key={child.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-2xl">{child.fullName[0]}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{child.fullName}</h3>
                    <p className="text-muted-foreground text-sm">{child.class} • {child.studentId}</p>
                     <div className="flex gap-2 mt-2">
                       <Badge variant={isResultAccessible(child) ? 'paid' : child.feeStatus === 'partial' ? 'partial' : 'unpaid'}>{child.feeStatus}</Badge>
                      <Badge variant="default">{child.sex}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 rounded-xl bg-primary/5">
                    <FiCheckCircle className="w-5 h-5 mx-auto text-primary mb-1" />
                    <p className="text-lg font-bold text-foreground">{presentDays}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-destructive/5">
                    <FiXCircle className="w-5 h-5 mx-auto text-destructive mb-1" />
                    <p className="text-lg font-bold text-foreground">{absentDays}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-secondary/5">
                    <FiFileText className="w-5 h-5 mx-auto text-secondary mb-1" />
                    <p className="text-lg font-bold text-foreground">{result ? `${result.averageScore.toFixed(0)}%` : 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="font-medium text-foreground">{formatDate(child.dateOfBirth)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Total Fee</span>
                    <span className="font-medium text-foreground">{formatCurrency(child.totalFee)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-medium text-primary">{formatCurrency(child.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Balance</span>
                     <span className={`font-medium ${getOutstandingBalance(child.totalFee, child.amountPaid) > 0 ? 'text-destructive' : 'text-primary'}`}>
                       {formatCurrency(getOutstandingBalance(child.totalFee, child.amountPaid))}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Enrolled</span>
                    <span className="font-medium text-foreground">{formatDate(child.enrollmentDate)}</span>
                  </div>
                </div>

                {result && isResultAccessible(child) && (
                  <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <h4 className="font-semibold text-foreground mb-3">Latest Result - {result.term}</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average: <strong className="text-foreground">{result.averageScore.toFixed(1)}%</strong></span>
                      <span className="text-muted-foreground">Position: <strong className="text-foreground">{result.position}</strong></span>
                    </div>
                    <div className="mt-3 space-y-1">
                      {result.subjects.slice(0, 4).map(s => (
                        <div key={s.subject} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{s.subject}</span>
                          <span className="font-medium text-foreground">{s.score}/100 ({s.grade})</span>
                        </div>
                      ))}
                      {result.subjects.length > 4 && <p className="text-xs text-primary mt-1">+{result.subjects.length - 4} more subjects</p>}
                    </div>
                  </div>
                )}

                {result && !isResultAccessible(child) && (
                  <div className="mt-6 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
                    <FiDollarSign className="w-6 h-6 mx-auto text-destructive mb-2" />
                    <p className="text-sm text-destructive font-medium">Result locked - fees not fully paid</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
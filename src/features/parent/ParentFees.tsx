/**
 * Parent Fees - Uses real shared data
 */

import React, { useState } from "react";
import { FiDollarSign, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { useSharedData } from "@/contexts/SharedDataContext";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDate,
  getFeeStatus,
  getOutstandingBalance,
  getPaymentProgress,
  getTermAmountPaid,
} from "@/utils/helpers";
import { InlineLoader } from "@/components/ui/page-loader";
import { motion } from "framer-motion";

export const ParentFees: React.FC = () => {
  const { students, payments, academicTerms, currentTerm, isLoading } =
    useSharedData();
  const myChildren = students;
  const [selectedChild, setSelectedChild] = useState(
    myChildren[0]?.studentId || "",
  );
  const [selectedTermId, setSelectedTermId] = useState(currentTerm?.id || "");

  React.useEffect(() => {
    if (
      myChildren.length > 0 &&
      !myChildren.find((c) => c.studentId === selectedChild)
    ) {
      setSelectedChild(myChildren[0].studentId);
    }
  }, [myChildren, selectedChild]);

  React.useEffect(() => {
    if (currentTerm && !selectedTermId) setSelectedTermId(currentTerm.id);
  }, [currentTerm, selectedTermId]);

  const child = myChildren.find((c) => c.studentId === selectedChild);
  const childPayments = payments.filter((p) => p.studentId === selectedChild);
  const selectedTerm =
    academicTerms.find((term) => term.id === selectedTermId) || currentTerm;
  const currentAmountPaid = child
    ? getTermAmountPaid(payments, child.studentId, selectedTerm)
    : 0;
  const currentFee = selectedTerm?.fee || 0;
  const balance = getOutstandingBalance(currentFee, currentAmountPaid);
  const percentage = getPaymentProgress(currentAmountPaid, currentFee);
  const currentFeeStatus = getFeeStatus(currentAmountPaid, currentFee);

  if (isLoading) return <InlineLoader />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Fee Status
        </h1>
        <p className="text-muted-foreground mt-1">
          View your children's fee payment details
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">
        {myChildren.map((c) => (
          <button
            key={c.studentId}
            onClick={() => setSelectedChild(c.studentId)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedChild === c.studentId ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {c.fullName.split(" ")[0]}
          </button>
        ))}
      </div>

      {child && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FiDollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Selected Term Fee
                  </p>
                  <select
                    value={selectedTermId}
                    onChange={(e) => setSelectedTermId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground mb-2"
                  >
                    <option value="">Select a term</option>
                    {academicTerms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name} · {term.session}
                      </option>
                    ))}
                  </select>
                  <p className="text-2xl font-bold text-foreground">
                    {currentTerm ? formatCurrency(currentFee) : "Not set"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FiCheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(currentAmountPaid)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${balance > 0 ? "bg-destructive/10" : "bg-primary/10"}`}
                >
                  {balance > 0 ? (
                    <FiAlertCircle className="w-6 h-6 text-destructive" />
                  ) : (
                    <FiCheckCircle className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p
                    className={`text-2xl font-bold ${balance > 0 ? "text-destructive" : "text-primary"}`}
                  >
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Payment Progress
              </h3>
              <Badge
                variant={
                  currentFeeStatus === "paid"
                    ? "paid"
                    : currentFeeStatus === "partial"
                      ? "late"
                      : "unpaid"
                }
              >
                {selectedTerm ? currentFeeStatus : "Not set"}
              </Badge>
            </div>
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 rounded-full"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {percentage}% paid
            </p>
          </div>

          {childPayments.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-foreground">
                  Payment History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Receipt
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Amount
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {childPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4 font-medium text-foreground">
                          {formatDate(p.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground font-mono">
                          {p.receiptNumber}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              p.status === "completed" ? "paid" : "unpaid"
                            }
                          >
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {myChildren.length === 0 && (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <p className="text-muted-foreground">
            No children linked to your account.
          </p>
        </div>
      )}
    </motion.div>
  );
};

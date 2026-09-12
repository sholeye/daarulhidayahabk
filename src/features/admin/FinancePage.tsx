/**
 * Finance Management Page - Shared state
 */

import React, { useState } from 'react';
import { FiDollarSign, FiPlus, FiSearch, FiDownload, FiX, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { Student, Payment } from '@/types';
import { useSharedData } from '@/contexts/SharedDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatCurrency, formatDate, getOutstandingBalance } from '@/utils/helpers';
import jsPDF from 'jspdf';

interface PaymentModalProps { isOpen: boolean; onClose: () => void; student: Student | null; onSubmit: (payment: Partial<Payment>) => Promise<void>; }

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, student, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const parsedAmount = Number(amount);
    const balance = getOutstandingBalance(student.totalFee, student.amountPaid);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid payment amount.');
      return;
    }

    if (parsedAmount > balance) {
      toast.error('Payment cannot be more than the outstanding balance.');
      return;
    }

    await onSubmit({
      studentId: student.studentId, amount: parsedAmount,
      date: new Date().toISOString().split('T')[0], term: 'First Term', session: '2024/2025',
      paymentMethod, receiptNumber: `RCP-${Date.now().toString().slice(-6)}`, status: 'completed',
    });
    setAmount(''); onClose();
  };

  if (!isOpen || !student) return null;
  const balance = getOutstandingBalance(student.totalFee, student.amountPaid);

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-strong w-full max-w-md">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Record Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors"><FiX className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground">Student</p>
            <p className="font-semibold text-foreground">{student.fullName}</p>
            <p className="text-sm text-muted-foreground mt-2">Outstanding Balance</p>
            <p className="text-xl font-bold text-destructive">{formatCurrency(balance)}</p>
          </div>
          <div><label className="block text-sm font-medium text-foreground mb-2">Amount *</label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" max={balance} required /><p className="text-xs text-muted-foreground mt-1">Max: {formatCurrency(balance)}</p></div>
          <div><label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground"><option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="POS">POS</option><option value="Mobile Money">Mobile Money</option></select></div>
          <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button><Button type="submit" className="flex-1"><FiCheckCircle className="w-4 h-4 mr-2" />Record Payment</Button></div>
        </form>
      </div>
    </div>
  );
};

export const FinancePage: React.FC = () => {
  const { students, payments, addPayment } = useSharedData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const totalRevenue = payments.filter((payment) => payment.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0);
  const pendingFees = students.reduce((sum, student) => sum + getOutstandingBalance(student.totalFee, student.amountPaid), 0);
  const paidCount = students.filter(s => s.feeStatus === 'paid').length;
  const unpaidCount = students.filter(s => s.feeStatus === 'unpaid').length;

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.feeStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handlePayment = async (paymentData: Partial<Payment>) => {
    try {
      await addPayment(paymentData);
      toast.success('Payment recorded successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to record payment.');
      throw error;
    }
  };

  const generateReceipt = (student: Student, payment: Payment) => {
    const doc = new jsPDF();
    doc.setFillColor(22, 101, 52); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(24);
    doc.text('Daarul Hidayah', 105, 20, { align: 'center' });
    doc.setFontSize(12); doc.text('Islamic & Arabic School', 105, 30, { align: 'center' });
    doc.setTextColor(0, 0, 0); doc.setFontSize(18);
    doc.text('PAYMENT RECEIPT', 105, 55, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Receipt No: ${payment.receiptNumber}`, 20, 70);
    doc.text(`Date: ${formatDate(payment.date)}`, 140, 70);
    doc.setFontSize(11);
    doc.text('Student Name:', 20, 90); doc.text(student.fullName, 70, 90);
    doc.text('Student ID:', 20, 100); doc.text(student.studentId, 70, 100);
    doc.text('Class:', 20, 110); doc.text(student.class, 70, 110);
    doc.line(20, 120, 190, 120);
    doc.text('Payment Details', 20, 130);
    doc.text(`Amount Paid: ${formatCurrency(payment.amount)}`, 20, 145);
    doc.text(`Payment Method: ${payment.paymentMethod}`, 20, 155);
    doc.text(`Term: ${payment.term}`, 20, 165); doc.text(`Session: ${payment.session}`, 20, 175);
    doc.line(20, 200, 190, 200); doc.setFontSize(10);
    doc.text('Thank you for your payment!', 105, 210, { align: 'center' });
    doc.text('Ita Ika, Abeokuta, Ogun State | daarulhidayahabk@gmail.com', 105, 220, { align: 'center' });
    doc.save(`Receipt-${payment.receiptNumber}.pdf`);
    toast.success('Receipt downloaded!');
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">Finance</h1><p className="text-muted-foreground mt-1">Manage fees and payment records</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><FiDollarSign className="w-6 h-6 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p><p className="text-sm text-muted-foreground">Total Revenue</p></div></div></div>
        <div className="bg-card rounded-xl border border-border p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><FiAlertCircle className="w-6 h-6 text-destructive" /></div><div><p className="text-2xl font-bold text-foreground">{formatCurrency(pendingFees)}</p><p className="text-sm text-muted-foreground">Pending Fees</p></div></div></div>
        <div className="bg-card rounded-xl border border-border p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><FiCheckCircle className="w-6 h-6 text-primary" /></div><div><p className="text-2xl font-bold text-foreground">{paidCount}</p><p className="text-sm text-muted-foreground">Fully Paid</p></div></div></div>
        <div className="bg-card rounded-xl border border-border p-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center"><FiClock className="w-6 h-6 text-secondary" /></div><div><p className="text-2xl font-bold text-foreground">{unpaidCount}</p><p className="text-sm text-muted-foreground">Unpaid</p></div></div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search students..." className="pl-12" /></div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-10 px-4 rounded-lg border border-input bg-background text-foreground"><option value="all">All Status</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="unpaid">Unpaid</option></select>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Student</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Class</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Total Fee</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Paid</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Balance</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0"><span className="text-primary-foreground font-bold">{student.fullName[0]}</span></div><div><p className="font-medium text-foreground">{student.fullName}</p><p className="text-sm text-muted-foreground">{student.studentId}</p></div></div></td>
                  <td className="px-6 py-4 text-sm text-foreground">{student.class}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{formatCurrency(student.totalFee)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">{formatCurrency(student.amountPaid)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-destructive">{formatCurrency(getOutstandingBalance(student.totalFee, student.amountPaid))}</td>
                  <td className="px-6 py-4"><Badge variant={student.feeStatus === 'paid' ? 'paid' : student.feeStatus === 'partial' ? 'partial' : 'unpaid'}>{student.feeStatus}</Badge></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {student.feeStatus !== 'paid' && (<Button size="sm" onClick={() => { setSelectedStudent(student); setShowPaymentModal(true); }}><FiPlus className="w-4 h-4 mr-1" />Pay</Button>)}
                      {student.amountPaid > 0 && (<button onClick={() => { const lastPayment = payments.find(p => p.studentId === student.studentId); if (lastPayment) generateReceipt(student, lastPayment); }} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground" title="Download Receipt"><FiDownload className="w-4 h-4" /></button>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentModal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setSelectedStudent(null); }} student={selectedStudent} onSubmit={handlePayment} />
    </div>
  );
};

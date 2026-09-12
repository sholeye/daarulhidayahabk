/**
 * Learner Profile Page - Uses RLS-filtered student data, no wrong fallback
 */

import React, { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiUsers, FiBriefcase, FiKey, FiCheck } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useSharedData } from '@/contexts/SharedDataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/helpers';
import { toast } from 'sonner';
import { InlineLoader } from '@/components/ui/page-loader';
import { ProfileAvatarUploader } from '@/components/ProfileAvatarUploader';

interface InfoRowProps { icon: React.ElementType; label: string; value: string | undefined; }
const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5 text-muted-foreground" /></div>
    <div className="min-w-0 flex-1"><p className="text-sm text-muted-foreground">{label}</p><p className="font-medium text-foreground break-words">{value || 'N/A'}</p></div>
  </div>
);

export const LearnerProfile: React.FC = () => {
  const { user, requestPasswordReset } = useAuth();
  const { students, isLoading } = useSharedData();
  const { t, isRTL } = useLanguage();
  // RLS returns only the student's own record
  const student = students.length === 1 ? students[0] : students.find(s => s.email === user?.email) || null;
  const [passwordResetRequested, setPasswordResetRequested] = useState(false);

  const handlePasswordReset = async () => {
    if (!student) return;
    const result = await requestPasswordReset(student.studentId);
    if (result.success) {
      setPasswordResetRequested(true);
      toast.success(t.passwordResetRequested);
    } else {
      toast.error(result.message);
    }
  };

  if (isLoading) return <InlineLoader />;

  if (!student) return (
    <div className="p-12 text-center">
      <FiUser className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">No student record found for your account. Please contact the administrator.</p>
    </div>
  );

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
      <div><h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t.profile}</h1><p className="text-muted-foreground mt-1">{t.personalInfo}</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6 text-center">
          <ProfileAvatarUploader sizeClass="w-20 h-20 sm:w-24 sm:h-24" className="mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-foreground">{student.fullName}</h2>
          <p className="text-muted-foreground mt-1 text-sm break-all">{student.email}</p>
          <div className="mt-4 p-4 rounded-xl bg-muted/50"><p className="text-sm text-muted-foreground mb-1">{t.studentId}</p><p className="text-lg font-bold text-primary">{student.studentId}</p></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2"><Badge variant={student.feeStatus === 'paid' ? 'paid' : 'unpaid'}>{student.feeStatus}</Badge><Badge variant="default">{student.class}</Badge></div>
          <div className="mt-6 pt-4 border-t border-border">
            {passwordResetRequested ? (
              <div className="p-3 bg-primary/10 rounded-xl"><FiCheck className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-sm text-primary font-medium">{t.passwordResetRequested}</p><p className="text-xs text-muted-foreground mt-1">{t.passwordResetInfo}</p></div>
            ) : (
              <Button variant="outline" size="sm" onClick={handlePasswordReset} className="w-full"><FiKey className="w-4 h-4 mr-2" />{t.requestPasswordReset}</Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-4">{t.personalInfo}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-border">
              <InfoRow icon={FiUser} label={t.fullName} value={student.fullName} />
              <InfoRow icon={FiMail} label={t.email} value={student.email} />
              <InfoRow icon={FiPhone} label={t.phone} value={student.phone} />
              <InfoRow icon={FiCalendar} label={t.dateOfBirth} value={formatDate(student.dateOfBirth)} />
              <InfoRow icon={FiMapPin} label={t.address} value={student.address} />
              <InfoRow icon={FiMapPin} label={t.stateOfOrigin} value={student.origin} />
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-4">{t.guardianInfo}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-border">
              <InfoRow icon={FiUsers} label={t.guardianName} value={student.guardian.name} />
              <InfoRow icon={FiPhone} label={t.guardianPhone} value={student.guardian.phone} />
              <InfoRow icon={FiBriefcase} label={t.occupation} value={student.guardian.occupation} />
              <InfoRow icon={FiMapPin} label={t.stateOfOrigin} value={student.guardian.stateOfOrigin} />
            </div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6">
            <h3 className="font-semibold text-foreground mb-4">{t.academicInfo}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-border">
              <InfoRow icon={FiCalendar} label={t.class} value={student.class} />
              <InfoRow icon={FiCalendar} label={t.enrollmentDate} value={formatDate(student.enrollmentDate)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

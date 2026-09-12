/**
 * Settings Page - School info & user profile settings only
 * Assignments moved to /admin/assignments
 */

import React, { useEffect, useState } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiGlobe, FiLock } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase, createIsolatedAuthClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileAvatarUploader } from '@/components/ProfileAvatarUploader';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [schoolSettings, setSchoolSettings] = useState({
    name: 'Daarul Hidayah',
    motto: 'Learn for servitude to Allah and Sincerity of Religion',
    email: 'daarulhidayahabk@gmail.com',
    phone: '08085944916',
    address: 'Ita Ika, Abeokuta, Ogun State',
    termFee: '6000',
  });

  const [userSettings, setUserSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
  });

  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingSchool, setIsSavingSchool] = useState(false);

  useEffect(() => {
    setUserSettings(prev => ({ ...prev, name: user?.name || '', email: user?.email || '' }));
  }, [user?.name, user?.email]);

  useEffect(() => {
    const loadSchoolSettings = async () => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('name, motto, email, phone, address, term_fee')
        .eq('id', 1)
        .maybeSingle();

      if (error || !data) return;

      setSchoolSettings({
        name: data.name,
        motto: data.motto,
        email: data.email,
        phone: data.phone,
        address: data.address,
        termFee: String(data.term_fee ?? 6000),
      });
    };

    loadSchoolSettings();
  }, []);

  const handleSaveSchool = async () => {
    setIsSavingSchool(true);

    try {
      const { error } = await supabase.from('school_settings').upsert({
        id: 1,
        name: schoolSettings.name.trim(),
        motto: schoolSettings.motto.trim(),
        email: schoolSettings.email.trim().toLowerCase(),
        phone: schoolSettings.phone.trim(),
        address: schoolSettings.address.trim(),
        term_fee: Number(schoolSettings.termFee) || 0,
      });

      if (error) throw error;
      toast.success('School settings updated.');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save school settings.');
    } finally {
      setIsSavingSchool(false);
    }
  };

  const handleSaveUser = async () => {
    if (!user) return toast.error('You must be logged in.');
    const desiredName = userSettings.name.trim();
    const desiredEmail = userSettings.email.trim().toLowerCase();
    const wantsPassword = !!userSettings.newPassword.trim();
    const wantsEmail = desiredEmail !== (user.email || '').trim().toLowerCase();
    const wantsName = desiredName !== (user.name || '').trim();

    if (!wantsName && !wantsEmail && !wantsPassword) return toast.message('No changes to save.');
    if (wantsPassword && !userSettings.currentPassword) return toast.error('Enter your current password to set a new one.');

    setIsSavingUser(true);
    try {
      if (wantsName) {
        const { error } = await supabase.auth.updateUser({ data: { full_name: desiredName } });
        if (error) throw error;
      }
      if (wantsEmail) {
        const { error } = await supabase.auth.updateUser({ email: desiredEmail });
        if (error) throw error;
      }
      if (wantsPassword) {
        const isolated = createIsolatedAuthClient();
        const { error: signInErr } = await isolated.auth.signInWithPassword({ email: user.email, password: userSettings.currentPassword });
        await isolated.auth.signOut();
        if (signInErr) throw new Error('Current password is incorrect.');
        const { error } = await supabase.auth.updateUser({ password: userSettings.newPassword });
        if (error) throw error;
      }
      await refreshUser();
      toast.success(wantsEmail ? 'Update saved — check your inbox to confirm email changes.' : 'Profile updated.');
      setUserSettings(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update profile.');
    } finally {
      setIsSavingUser(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">School information and account settings</p>
      </div>

      {/* School Information */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <FiGlobe className="w-5 h-5 text-primary" /> School Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">School Name</label>
            <Input value={schoolSettings.name} onChange={e => setSchoolSettings({ ...schoolSettings, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Term Fee (₦)</label>
            <Input value={schoolSettings.termFee} onChange={e => setSchoolSettings({ ...schoolSettings, termFee: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">Motto</label>
            <Input value={schoolSettings.motto} onChange={e => setSchoolSettings({ ...schoolSettings, motto: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2"><FiMail className="w-4 h-4 inline mr-1" /> Email</label>
            <Input type="email" value={schoolSettings.email} onChange={e => setSchoolSettings({ ...schoolSettings, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2"><FiPhone className="w-4 h-4 inline mr-1" /> Phone</label>
            <Input value={schoolSettings.phone} onChange={e => setSchoolSettings({ ...schoolSettings, phone: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2"><FiMapPin className="w-4 h-4 inline mr-1" /> Address</label>
            <Input value={schoolSettings.address} onChange={e => setSchoolSettings({ ...schoolSettings, address: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <Button onClick={handleSaveSchool} disabled={isSavingSchool}><FiSave className="w-4 h-4 mr-2" /> {isSavingSchool ? 'Saving…' : 'Save School Settings'}</Button>
        </div>
      </div>

      {/* Profile Settings */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <FiUser className="w-5 h-5 text-primary" /> Profile Settings
        </h2>
        <div className="mb-6">
          <ProfileAvatarUploader sizeClass="w-16 h-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
            <Input value={userSettings.name} onChange={e => setUserSettings({ ...userSettings, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <Input type="email" value={userSettings.email} onChange={e => setUserSettings({ ...userSettings, email: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FiLock className="w-4 h-4" /> Change Password
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
              <Input type="password" value={userSettings.currentPassword} onChange={e => setUserSettings({ ...userSettings, currentPassword: e.target.value })} placeholder="Enter current password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
              <Input type="password" value={userSettings.newPassword} onChange={e => setUserSettings({ ...userSettings, newPassword: e.target.value })} placeholder="Enter new password" />
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <Button onClick={handleSaveUser} disabled={isSavingUser}>
            <FiSave className="w-4 h-4 mr-2" /> {isSavingUser ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Authentication Context - Real Supabase Auth
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase, createIsolatedAuthClient } from '@/lib/supabase';
import { pickPrimaryRole } from './roleUtils';

interface LoginResult {
  success: boolean;
  message: string;
  role?: UserRole;
  userId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<LoginResult>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  createStudentAccount: (email: string, password: string, fullName: string) => Promise<{ success: boolean; userId?: string; message: string }>;
  getStudentByUserId: () => null;
  requestPasswordReset: (studentId: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserWithRole = useCallback(async (sessionUser: any) => {
    const [{ data: roleRows, error: roleError }, { data: profile, error: profileError }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', sessionUser.id),
      supabase.from('profiles').select('full_name, email, avatar_url').eq('id', sessionUser.id).maybeSingle(),
    ]);

    if (roleError) console.error('Role lookup failed:', roleError.message);
    if (profileError) console.error('Profile lookup failed:', profileError.message);

    const role = pickPrimaryRole(roleRows, sessionUser.user_metadata?.role);
    const fullName = profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User';

    setUser({
      id: sessionUser.id,
      email: profile?.email || sessionUser.email || '',
      name: fullName,
      role,
      avatar: profile?.avatar_url || undefined,
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(() => fetchUserWithRole(session.user), 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserWithRole(session.user);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserWithRole]);

  const refreshUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Failed to refresh user:', error.message);
      return;
    }
    if (data.user) await fetchUserWithRole(data.user);
    else setUser(null);
  }, [fetchUserWithRole]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (error) return { success: false, message: error.message };

    if (data.user) {
      const [{ data: roleRows }, { data: profile }] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', data.user.id),
        supabase.from('profiles').select('full_name, email, avatar_url').eq('id', data.user.id).maybeSingle(),
      ]);

      const role = pickPrimaryRole(roleRows, data.user.user_metadata?.role);

      setUser({
        id: data.user.id,
        email: profile?.email || data.user.email || '',
        name: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
        role,
        avatar: profile?.avatar_url || undefined,
      });
      setIsLoading(false);

      return { success: true, message: 'Login successful!', role, userId: data.user.id };
    }

    return { success: false, message: 'Login failed. Please try again.' };
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      options: { data: { full_name: fullName, role } },
    });
    if (error) return { success: false, message: error.message };
    if (data.user) return { success: true, message: 'Account created successfully! You can now log in.' };
    return { success: false, message: 'Signup failed. Please try again.' };
  }, []);

  const createStudentAccount = useCallback(async (email: string, password: string, fullName: string) => {
    const isolatedAuth = createIsolatedAuthClient();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const { data: signUpData, error: signUpError } = await isolatedAuth.auth.signUp({
      email: normalizedEmail,
      password: normalizedPassword,
      options: { data: { full_name: fullName, role: 'learner' } },
    });

    if (signUpError) {
      const msg = signUpError.message.toLowerCase();
      const isAlreadyRegistered = msg.includes('already') && (msg.includes('registered') || msg.includes('exists'));

      if (isAlreadyRegistered) {
        const { data: signInData, error: signInError } = await isolatedAuth.auth.signInWithPassword({
          email: normalizedEmail, password: normalizedPassword,
        });
        if (!signInError && signInData.user?.id) {
          await isolatedAuth.auth.signOut();
          return { success: true, userId: signInData.user.id, message: 'Student login already existed — linked successfully.' };
        }
        return { success: false, message: 'A user with this email already exists. Use password reset if needed.' };
      }
      return { success: false, message: signUpError.message };
    }

    if (!signUpData.user?.id) {
      return { success: false, message: 'Student account creation did not return a user id. Ensure email confirmation is disabled.' };
    }

    await isolatedAuth.auth.signOut();
    return { success: true, userId: signUpData.user.id, message: 'Student account created!' };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const getStudentByUserId = useCallback(() => null, []);

  const requestPasswordReset = useCallback(async (studentId: string) => {
    const { error } = await supabase.from('password_reset_requests').insert({ student_id: studentId, status: 'pending' });
    if (error) return { success: false, message: 'Failed to submit request.' };
    return { success: true, message: 'Password reset request sent to administrator.' };
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, refreshUser,
      login, signup, logout, createStudentAccount, getStudentByUserId, requestPasswordReset,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const useRequireRole = (allowedRoles: UserRole[]) => {
  const { user } = useAuth();
  return { hasAccess: user ? allowedRoles.includes(user.role) : false, role: user?.role || null };
};

/**
 * Generate shorter, cleaner student credentials.
 * Email: firstname + 2-digit counter @dh.edu (e.g., abdullah05@dh.edu)
 * Password: DH- + 6 random alphanumeric chars (e.g., DH-x7K2mQ)
 */
export const generateStudentCredentials = (fullName: string, studentId: string) => {
  const prefix = fullName
    .trim()
    .split(' ')[0]
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, 3) || 'std';

  const numericPart = studentId.replace(/\D/g, '').slice(-4).padStart(4, '0');
  const username = `${prefix}${numericPart}@dh.edu`;

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const seed = `${studentId}:${fullName.toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) >>> 0;
  }

  let token = '';
  for (let i = 0; i < 6; i += 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    token += chars[hash % chars.length];
  }

  return { username, password: `DH-${token}` };
};

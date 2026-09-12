/**
 * Signup Page - For instructors and parents (real email accounts)
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus, FiUser, FiArrowLeft, FiBookOpen, FiUsers } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UserRole } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { t, isRTL } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'instructor' | 'parent'>('instructor');

  const roleOptions: { role: 'instructor' | 'parent'; label: string; icon: React.ElementType; description: string }[] = [
    { role: 'instructor', label: t.instructor || 'Instructor', icon: FiBookOpen, description: t.manageClassesDesc || 'Manage classes and grades' },
    { role: 'parent', label: t.parent || 'Parent', icon: FiUsers, description: t.monitorChildrenDesc || 'Monitor your children' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    const result = await signup(email, password, fullName, selectedRole as UserRole);
    setIsLoading(false);
    if (result.success) {
      toast.success(result.message);
      navigate('/login');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 islamic-pattern" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/login" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <FiArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Login</span>
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-5 shadow-glow">
            <span className="text-primary-foreground font-bold text-3xl">د</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Sign up as an instructor or parent</p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-medium p-6 sm:p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((option) => (
                <button key={option.role} type="button" onClick={() => setSelectedRole(option.role)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedRole === option.role ? 'border-primary bg-primary/5 shadow-soft' : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}>
                  <option.icon className={`w-6 h-6 ${selectedRole === option.role ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${selectedRole === option.role ? 'text-foreground' : 'text-muted-foreground'}`}>{option.label}</span>
                  <span className="text-xs text-muted-foreground text-center">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="pl-12 h-12" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="pl-12 h-12" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" className="pl-12 pr-12 h-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" className="pl-12 h-12" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-medium btn-glow" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
              <FiUserPlus className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Students are registered by the school administrator. If you're a student, contact your school for login credentials.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

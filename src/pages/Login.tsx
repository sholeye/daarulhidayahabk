import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserRole } from '@/types';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated } = useAuth();
  const { t, isRTL } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const getRoleBasedPath = (role: UserRole) => {
    switch (role) {
      case 'admin': return '/admin';
      case 'instructor': return '/instructor';
      case 'learner': return '/learner';
      case 'parent': return '/parent';
      default: return '/';
    }
  };

  const canAccessPath = (role: UserRole, path?: string) => {
    if (!path) return false;
    if (role === 'admin') return true;
    if (path.startsWith('/admin')) return false;
    if (path.startsWith('/instructor')) return role === 'instructor';
    if (path.startsWith('/learner')) return role === 'learner';
    if (path.startsWith('/parent')) return role === 'parent';
    return true;
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const fallbackPath = getRoleBasedPath(user.role);
    const targetPath = canAccessPath(user.role, from) ? from! : fallbackPath;
    navigate(targetPath, { replace: true });
  }, [isAuthenticated, user, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success && result.role) {
        toast.success(t.success || 'Login successful!');
        const fallbackPath = getRoleBasedPath(result.role);
        const targetPath = canAccessPath(result.role, from) ? from! : fallbackPath;
        // Navigate immediately using the role returned from login
        navigate(targetPath, { replace: true });
      } else if (result.success) {
        // Fallback: role wasn't returned, go to home
        toast.success(t.success || 'Login successful!');
        navigate(from || '/', { replace: true });
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 islamic-pattern" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <FiArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{t.backToHome}</span>
        </Link>

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-5 shadow-glow"
          >
            <span className="text-primary-foreground font-bold text-3xl">د</span>
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t.welcomeBackLogin}</h1>
          <p className="text-muted-foreground mt-2">{t.signInToPortal}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-card rounded-2xl border border-border shadow-medium p-6 sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t.emailAddress}</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.enterEmail} className="pl-12 h-12" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">{t.passwordLabel}</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.enterPassword} className="pl-12 pr-12 h-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-medium btn-glow" disabled={isLoading}>
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
              ) : (
                <>{t.signIn}<FiLogIn className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Instructor or Parent?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">Create an account</Link>
          </p>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Students receive login credentials from the school administrator.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;

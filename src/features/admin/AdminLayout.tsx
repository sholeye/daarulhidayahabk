/**
 * Admin Layout - with logout confirmation and notifications
 */

import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, FiUsers, FiCalendar, FiDollarSign, FiFileText, 
  FiBell, FiSettings, FiLogOut, FiMenu, FiX, FiMoon, FiSun, FiAward, FiLink 
} from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/features/app/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { NotificationBell } from '@/components/NotificationBell';
import { ProfileAvatarUploader } from '@/components/ProfileAvatarUploader';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const navItems = [
    { icon: FiHome, label: t.dashboard, path: '/admin' },
    { icon: FiUsers, label: t.students, path: '/admin/students' },
    { icon: FiCalendar, label: t.attendance, path: '/admin/attendance' },
    { icon: FiDollarSign, label: t.finance, path: '/admin/finance' },
    { icon: FiFileText, label: t.results, path: '/admin/results' },
    { icon: FiAward, label: t.quiz, path: '/admin/quiz' },
    { icon: FiBell, label: t.announcements, path: '/admin/announcements' },
    { icon: FiFileText, label: t.blog, path: '/admin/blog' },
    { icon: FiLink, label: 'Assignments', path: '/admin/assignments' },
    { icon: FiSettings, label: t.settings, path: '/admin/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-background flex w-full">
      <aside className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-xl">د</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">{t.schoolName}</h1>
                <p className="text-xs text-muted-foreground">{t.adminPortal}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-primary/10 text-primary shadow-soft' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/50">
              <ProfileAvatarUploader sizeClass="w-10 h-10" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setShowLogout(true)}>
              <FiLogOut className="w-4 h-4 mr-2" />{t.signOut}
            </Button>
          </div>
        </div>
      </aside>

      <div className={`flex-1 ${isRTL ? 'lg:mr-72' : 'lg:ml-72'} min-h-screen flex flex-col`}>
        <header className="sticky top-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-8">
          <button className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-muted transition-colors" aria-label="Toggle theme">
              {theme === 'light' ? <FiMoon className="w-5 h-5 text-foreground" /> : <FiSun className="w-5 h-5 text-foreground" />}
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8"><Outlet /></main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <ConfirmDialog
        open={showLogout}
        onOpenChange={setShowLogout}
        title="Sign Out"
        description="Are you sure you want to sign out? You'll need to log in again to access the admin portal."
        confirmLabel="Sign Out"
        onConfirm={handleLogout}
      />
    </div>
  );
};

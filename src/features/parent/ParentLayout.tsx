/**
 * Parent Layout - with logout confirmation and notifications
 */

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiCalendar, FiFileText, FiDollarSign, FiLogOut, FiMoon, FiSun, FiMenu, FiX, FiBell } from 'react-icons/fi';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/features/app/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { NotificationBell } from '@/components/NotificationBell';
import { ProfileAvatarUploader } from '@/components/ProfileAvatarUploader';

export const ParentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const navItems = [
    { icon: FiHome, label: t.dashboard, path: '/parent' },
    { icon: FiUsers, label: t.myChildren || 'My Children', path: '/parent/children' },
    { icon: FiCalendar, label: t.attendance, path: '/parent/attendance' },
    { icon: FiFileText, label: t.results, path: '/parent/results' },
    { icon: FiDollarSign, label: t.fees, path: '/parent/fees' },
    { icon: FiBell, label: t.announcements, path: '/parent/announcements' },
  ];

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-background">
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 px-4 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted"><FiMenu className="w-6 h-6" /></button>
        <span className="font-semibold text-foreground">{t.parentPortal || 'Parent Portal'}</span>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted">{theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}</button>
        </div>
      </header>
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-64 bg-card border-${isRTL ? 'l' : 'r'} border-border z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}`}>
        <div className="h-16 px-6 flex items-center justify-between border-b border-border">
          <div><h1 className="font-bold text-foreground">{t.schoolName}</h1><p className="text-xs text-muted-foreground">{t.parentPortal || 'Parent Portal'}</p></div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-muted"><FiX className="w-5 h-5" /></button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/parent'} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <ProfileAvatarUploader sizeClass="w-10 h-10" />
            <div className="flex-1 min-w-0"><p className="font-medium text-foreground truncate">{user?.name || 'Parent'}</p><p className="text-xs text-muted-foreground truncate">{user?.email}</p></div>
          </div>
          <button onClick={() => setShowLogout(true)} className="w-full p-2 rounded-lg hover:bg-destructive/10 text-destructive flex items-center justify-center gap-2"><FiLogOut className="w-5 h-5" /><span>{t.logout}</span></button>
        </div>
      </aside>
      <main className={`${isRTL ? 'lg:mr-64' : 'lg:ml-64'} pt-16 lg:pt-0 min-h-screen`}><div className="p-6 lg:p-8"><Outlet /></div></main>

      <ConfirmDialog open={showLogout} onOpenChange={setShowLogout} title="Sign Out" description="Are you sure you want to sign out?" confirmLabel="Sign Out" onConfirm={handleLogout} />
    </div>
  );
};

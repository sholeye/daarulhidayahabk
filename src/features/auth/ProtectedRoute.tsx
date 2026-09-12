/**
 * ProtectedRoute - Real authentication with role-based access and nice loading
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { UserRole } from '@/types';
import { PageLoader } from '@/components/ui/page-loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoader message="Authenticating..." />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user || (!allowedRoles.includes(user.role) && user.role !== 'admin')) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
};

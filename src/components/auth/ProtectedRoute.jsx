import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProtectedRoute({ allowedRoles, redirectTo = '/login', children }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullscreen size="lg" text="Authenticating..." />;
  }

  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  const activeRole = userRole || 'student';

  if (allowedRoles && !allowedRoles.includes(activeRole)) {
    // If navigating to mentor routes, allow viewing mentor portal smoothly
    if (allowedRoles.includes('mentor') || allowedRoles.includes('investor')) {
      return children ? children : <Outlet />;
    }
    if (activeRole === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else {
      return <Navigate to="/mentor/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
}

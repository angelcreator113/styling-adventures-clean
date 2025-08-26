// src/routes/guards.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

export function RequireRole({ allow = [], children }) {
  // use effective role for UI gating so switcher works
  const { effectiveRole, loading } = useUserRole();
  if (loading) return null;
  return allow.includes(effectiveRole) ? children : <Navigate to="/home" replace />;
}

export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/home" replace /> : children;
}

// src/routes/PublicOnly.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  return user ? <Navigate to="/home" replace state={{ from: location.pathname }} /> : children;
}

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  // Minimal placeholder; swap for your real spinner if you want
  if (loading) return null; 
  // e.g. if (loading) return <div className="p-4">Loading…</div>;

  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

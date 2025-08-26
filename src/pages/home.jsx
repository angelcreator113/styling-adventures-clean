import React from 'react';
import { useAuth } from '@/context/AuthContext';
import FanHome from '@/pages/home/FanHome';
import CreatorHome from '@/pages/home/CreatorHome';
import AdminHome from '@/pages/home/AdminHome';


export default function Home() {
  const { role, loading } = useAuth();
  if (loading) return null;               // show a skeleton if you prefer
  if (role === 'admin')   return <AdminHome />;
  if (role === 'creator') return <CreatorHome />;
  return <FanHome />;
}

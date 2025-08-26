// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthReady } from '@/utils/init-firebase'; // onAuthReady resolves when Firebase knows user
import { onAuthStateChanged } from 'firebase/auth';
import { getRoles, primaryRole } from '@/utils/roles';

const Ctx = createContext({ user: null, roles: ['guest'], role: 'guest', loading: true, refresh: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [roles, setRoles] = useState(['guest']);
  const [loading, setLoading] = useState(true);

  const refresh = async (u = auth.currentUser) => {
    const r = u ? await getRoles() : ['guest'];
    setRoles(r);
  };

  useEffect(() => {
    let unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await refresh(u);
      setLoading(false);
    });
    // also wait for initial readiness (handles reloads cleanly)
    onAuthReady().finally(() => setLoading(false));
    return () => unsub && unsub();
  }, []);

  const value = { user, roles, role: primaryRole(roles), loading, refresh };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

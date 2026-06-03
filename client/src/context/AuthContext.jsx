/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try {
      const savedUser = localStorage.getItem('amc_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('amc_token');
    if (token) {
      // Verify token is still valid
      getMe()
        .then(({ data }) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem('amc_token');
          localStorage.removeItem('amc_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      Promise.resolve().then(() => {
        setLoading(false);
      });
    }
  }, []);

  const loginUser = useCallback((token, userData) => {
    localStorage.setItem('amc_token', token);
    localStorage.setItem('amc_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('amc_token');
    localStorage.removeItem('amc_user');
    setUser(null);
  }, []);

  const isAdmin  = user?.role === 'admin';
  const isSeller = user?.role === 'seller';

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, isAdmin, isSeller }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

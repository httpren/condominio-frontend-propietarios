import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, refresh as apiRefresh, logout as apiLogout } from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const access = localStorage.getItem('access');
    const storedUser = localStorage.getItem('user');
    if (access && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    const handleForcedLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    setLoading(false);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = async (credentials) => {
    try {
      const data = await apiLogin(credentials);
      // No tenemos endpoint directo de perfil; guardar username mínimo
      const basicUser = { username: credentials.username };
      localStorage.setItem('user', JSON.stringify(basicUser));
      setUser(basicUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Credenciales inválidas';
      return { success: false, error: message };
    }
  };

  const silentRefresh = async () => {
    try {
      const data = await apiRefresh();
      if (!data) return false;
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    apiLogout();
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    silentRefresh,
    logout,
    isAdmin: user?.role === 'admin' // Adjust based on your user role structure
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
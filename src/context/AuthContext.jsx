import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, refresh as apiRefresh, logout as apiLogout } from '../api/auth';
import axiosInstance from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user básico enriquecido con perfil y rol
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // 'propietario' | 'inquilino' | null

  // Helper: detecta rol intentando primero propietario luego inquilino
  const detectUserRole = async () => {
    try {
      const respProp = await axiosInstance.get('/propietarios/me/');
      if (respProp?.data?.id) {
        return { role: 'propietario', perfil: respProp.data };
      }
    } catch (e) {
      // ignorar y probar inquilino
    }
    try {
      // Si backend expone endpoint similar /inquilinos/me/ (ajusta si difiere)
      const respInq = await axiosInstance.get('/inquilinos/me/');
      if (respInq?.data?.id) {
        return { role: 'inquilino', perfil: respInq.data };
      }
    } catch (e) {
      // ninguno: retornar nulo
    }
    return { role: null, perfil: null };
  };

  useEffect(() => {
    const bootstrap = async () => {
      const access = localStorage.getItem('access');
      const storedUser = localStorage.getItem('user');
      if (access && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsAuthenticated(true);
        // Revalidar rol por si backend cambió (opcional, silencioso)
        try {
          const { role, perfil } = await detectUserRole();
          if (role) {
            setUserRole(role);
            setUser(prev => ({ ...prev, role, perfil }));
            localStorage.setItem('user', JSON.stringify({ ...parsed, role, perfil }));
          }
        } catch {/* noop */}
      }
      setLoading(false);
    };
    const handleForcedLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      setUserRole(null);
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    bootstrap();
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = async (credentials) => {
    try {
      await apiLogin(credentials);
      const { role, perfil } = await detectUserRole();
      const enrichedUser = {
        username: credentials.username,
        role,
        perfil, // guardamos el objeto completo devuelto (propietario o inquilino)
        propietario_id: role === 'propietario' ? perfil?.id : perfil?.propietario?.id, // si inquilino, intentar propietario relacionado
      };
      setUser(enrichedUser);
      setUserRole(role);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(enrichedUser));
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
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setUserRole(null);
        // Disparar evento para otros componentes
    window.dispatchEvent(new Event('auth:logout'));
  };

  const value = {
    user,
    userRole,
    isAuthenticated,
    loading,
    login,
    silentRefresh,
    logout,
    propietarioId: user?.propietario_id || (user?.perfil?.id && userRole === 'propietario' ? user.perfil.id : undefined),
    isPropietario: userRole === 'propietario',
    isInquilino: userRole === 'inquilino',
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
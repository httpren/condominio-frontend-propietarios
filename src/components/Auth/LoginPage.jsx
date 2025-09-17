import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, User, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await login(credentials);
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-950 via-red-900 to-red-800 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/10 bg-gradient-to-r from-red-500/5 to-transparent opacity-[0.03]"></div>
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-red-400/20 rounded-full blur-xl animate-pulse-slow"></div>
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-red-500/20 blur-2xl animate-ping-slow"></div>
      
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 transform transition-all duration-700 scale-100 opacity-100 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="text-2xl font-bold text-white" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Acceso Administrativo</h2>
        <p className="text-red-100/80 text-sm text-center mb-8">Ingresa tus credenciales para continuar</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300/60 transition-colors duration-300" />
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              placeholder="Nombre de usuario"
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300/60 transition-colors duration-300" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Contraseña"
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-12 py-3 text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-300/60 hover:text-red-300 transition-colors duration-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-200 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Iniciando sesión...
              </div>
            ) : 'Iniciar Sesión'}
          </button>
        </form>
        
        <p className="text-red-100/60 text-center text-sm mt-8">
          © {new Date().getFullYear()} Sistema de Administración
        </p>
      </div>
    </div>
  );
};

export default Login;
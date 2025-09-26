import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Menu, X, ChevronDown, LogOut, Wifi, WifiOff, Battery, MoreVertical } from 'lucide-react';
import NotificationsBell from '../common/NotificationsBell';
import { useAuth } from '../../context/AuthContext';
import { isMobile, isInstalled } from '../../serviceWorkerRegistration';

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isPWA, setIsPWA] = useState(false);
  const profileRef = useRef(null);
  const actionsRef = useRef(null);
  const profileDropdownRef = useRef(null); // Ref para portal perfil
  const actionsDropdownRef = useRef(null); // Ref para portal acciones
  const searchInputRef = useRef(null);
  const [profilePos, setProfilePos] = useState(null);
  const [actionsPos, setActionsPos] = useState(null);

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verificar si es PWA
    setIsPWA(isInstalled());
    
    // Obtener nivel de batería (si el navegador lo soporta)
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(battery.level * 100);
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level * 100);
        });
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cerrar dropdowns cuando se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      // Si el click ocurre dentro del trigger o dentro del portal, no cerrar
      const insideProfileButton = profileRef.current?.contains(target);
      const insideProfileDropdown = profileDropdownRef.current?.contains(target);
      const insideActionsButton = actionsRef.current?.contains(target);
      const insideActionsDropdown = actionsDropdownRef.current?.contains(target);

      if (!insideProfileButton && !insideProfileDropdown) {
        setIsProfileOpen(false);
      }
      if (!insideActionsButton && !insideActionsDropdown) {
        setIsActionsOpen(false);
      }
    };
    // Usar 'click' en lugar de 'mousedown' para permitir que onClick del botón dispare primero
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Enfocar el input de búsqueda cuando se abre
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Calcular posiciones para dropdowns cuando se abren (portal positioning)
  useLayoutEffect(() => {
    if (isProfileOpen && profileRef.current) {
      const btn = profileRef.current.querySelector('button');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setProfilePos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
    }
  }, [isProfileOpen]);

  useLayoutEffect(() => {
    if (isActionsOpen && actionsRef.current) {
      const btn = actionsRef.current.querySelector('button');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setActionsPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
    }
  }, [isActionsOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (isProfileOpen) {
        setIsProfileOpen(false);
      }
      if (isActionsOpen) {
        setIsActionsOpen(false);
      }
    };
    window.addEventListener('orientationchange', handleResize);
    return () => window.removeEventListener('orientationchange', handleResize);
  }, [isProfileOpen, isActionsOpen]);

  return (
    <>
      {/* Barra de búsqueda móvil expandida */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-gradient-to-br from-red-950 via-red-900 to-red-800 z-50 p-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-white p-2 rounded-xl hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300/60" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar..."
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      <nav className="relative bg-white/10 backdrop-blur-lg border-b border-white/20 p-4 animate-fade-in">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="text-white/90 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            
            <h1 className="text-white font-bold text-xl hidden md:block transition-opacity duration-300">Condominio</h1>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex relative flex-1 max-w-md mx-8 transition-all duration-300">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-300/60 transition-colors duration-300" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-2 text-white placeholder-red-200/50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
            />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Botón de búsqueda móvil */}
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden text-white/90 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/10"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Indicadores de estado (sólo visible en escritorio o PWA) */}
            {isPWA && (
              <div className="hidden md:flex items-center space-x-2 text-white/60 text-xs mr-2">
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {batteryLevel !== null && (
                  <div className="flex items-center">
                    <Battery className="w-4 h-4 mr-1" />
                    <span>{Math.round(batteryLevel)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Notificaciones */}
            <NotificationsBell />
            
            {/* Perfil - Desktop */}
            <div className="relative hidden md:block" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110">
                  <span className="text-white text-sm font-medium">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-white text-sm font-medium text-left">
                    {user?.first_name || user?.username}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-white transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>
              {/* Dropdown portal */}
              {isProfileOpen && profilePos && createPortal(
                <div
                  ref={profileDropdownRef}
                  style={{ position: 'fixed', top: profilePos.top, right: profilePos.right, zIndex: 3000, width: '12rem' }}
                  className="rounded-xl shadow-lg py-2 animate-fade-in bg-[rgba(20,20,24,0.92)] backdrop-blur-xl border border-white/15 ring-1 ring-black/40 pointer-events-auto"
                >
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>,
                document.body
              )}
            </div>
            
            {/* Menú de acciones - Mobile */}
            <div className="relative md:hidden" ref={actionsRef}>
              <button 
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="text-white/90 hover:text-white transition-all duration-300 p-2 rounded-xl hover:bg-white/10"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {isActionsOpen && actionsPos && createPortal(
                <div
                  ref={actionsDropdownRef}
                  style={{ position: 'fixed', top: actionsPos.top, right: actionsPos.right, zIndex: 3000, width: '12rem' }}
                  className="rounded-xl shadow-lg py-2 animate-fade-in bg-[rgba(20,20,24,0.92)] backdrop-blur-xl border border-white/15 ring-1 ring-black/40 pointer-events-auto"
                >
                  <div className="px-4 py-2 border-b border-white/10">
                    <div className="flex items-center space-x-3 mb-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium">
                        {user?.first_name || user?.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsActionsOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
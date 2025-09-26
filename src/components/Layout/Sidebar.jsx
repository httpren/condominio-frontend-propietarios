import React, { useState } from 'react';
import { 
  Home, 
  BarChart3, 
  Users, 
  Settings, 
  Building,
  CreditCard,
  FileText,
  Calendar,
  ChevronDown,
  Car,
  PawPrint,
  UsersRound,
  UserPlus,
  IdCard,
  FileBarChart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
 
const Sidebar = ({ isOpen }) => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [activeSubmenus, setActiveSubmenus] = useState({});
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Comunicados', path: '/comunicados' },

    // Gestionar con submenús organizados por prioridad de uso
    { icon: Users, label: 'Gestionar', 
      submenu: [
        { label: 'Visitas', path: '/visitas', icon: IdCard },
  { label: 'Reservas', path: '/reservas', icon: Calendar },
        { label: 'Vehículos', path: '/vehiculos', icon: Car },
        { label: 'Mascotas', path: '/mascotas', icon: PawPrint },
  { label: 'Inquilinos', path: '/inquilinos', icon: UsersRound },
      ]
    },

    { icon: Building, label: 'Mis Unidades', path: '/unidades' },

    { icon: CreditCard, label: 'Mis Expensas', path: '/expensas' },
    { icon: FileBarChart, label: 'Reportes', path: '/reportes' },
  ];


  const adminMenuItems = isAdmin ? [
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Configuración', path: '/configuracion' }
  ] : [];

  const isActive = (path) => location.pathname === path;

  const toggleSubmenu = (label) => {
    setActiveSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside className={`
      fixed left-0 top-0 h-full bg-white/10 backdrop-blur-lg border-r border-white/20 
      transform transition-all duration-500 z-40 overflow-y-auto
      ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      w-64
    `}>
      <div className="p-6">
        <div className="bg-gradient-to-r from-red-500 to-red-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transition-transform duration-300 hover:scale-105">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <h2 className="text-white font-bold text-center mb-8 transition-opacity duration-300">Condominio</h2>
        
        <nav className="space-y-1">
          {menuItems.map((item, index) => (
            <div key={item.label || item.path}>
              {item.submenu ? (
                // Elemento con submenú - usar button
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group
                    text-white/90 hover:bg-white/10 hover:text-white
                  `}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${activeSubmenus[item.label] ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                // Elemento sin submenú - usar Link
                <Link
                  to={item.path}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group
                    ${isActive(item.path)
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              )}
              
              {/* Submenús */}
              {item.submenu && activeSubmenus[item.label] && (
                <div className="ml-8 mt-1 space-y-1 animate-fade-in">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-300 text-sm
                        ${isActive(subItem.path)
                          ? 'bg-red-500/20 text-white' 
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                      <span>{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {adminMenuItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300"
              style={{ transitionDelay: `${(menuItems.length + index) * 50}ms` }}
            >
              <item.icon className="w-5 h-5 transition-transform duration-300 hover:scale-110" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};
export default Sidebar;
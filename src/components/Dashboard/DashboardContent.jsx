import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, ShoppingCart, Activity, Calendar, ChevronRight } from 'lucide-react';
import StatsCard from './StatsCard';
import { useAuth } from '../../context/AuthContext';
import { isMobile } from '../../serviceWorkerRegistration';

const DashboardContent = () => {
  const { user } = useAuth();
  const [displayMode, setDisplayMode] = useState('grid');
  const [selectedStat, setSelectedStat] = useState(null);

  const stats = [
    { icon: DollarSign, title: 'Expensas Pendientes', value: '$1,234', change: '+12%', trend: 'up' },
    { icon: Users, title: 'Visitas Programadas', value: '5', change: '+2%', trend: 'up' },
    { icon: ShoppingCart, title: 'Reservas Activas', value: '3', change: '-1%', trend: 'down' },
    { icon: Activity, title: 'Reportes Abiertos', value: '2', change: '+0%', trend: 'up' },
  ];

  useEffect(() => {
    const handleResize = () => {
      setDisplayMode(window.innerWidth < 640 ? 'carousel' : 'grid');
    };
    
    handleResize(); // Inicial
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Funciones para el carrusel en móvil
  const nextStat = () => {
    setSelectedStat((prev) => (prev === null || prev >= stats.length - 1) ? 0 : prev + 1);
  };
  
  const prevStat = () => {
    setSelectedStat((prev) => (prev === null || prev <= 0) ? stats.length - 1 : prev - 1);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mb-6 px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-white mb-2">
          ¡Bienvenido, {user?.first_name || user?.username}!
        </h1>
        <p className="text-red-100/80">Aquí está el resumen de tu condominio hoy.</p>
      </div>

      {/* Stats Grid o Carousel */}
      {displayMode === 'grid' ? (
        // Grid para pantallas medianas y grandes
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
      ) : (
        // Carousel para móvil
        <div className="relative px-4">
          <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory flex space-x-4 pb-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`snap-center flex-shrink-0 w-[85%] ${
                  selectedStat === index ? 'ring-2 ring-red-500' : ''
                }`}
                onClick={() => setSelectedStat(index)}
              >
                <StatsCard {...stat} />
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-2 mt-3">
            {stats.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  selectedStat === index ? 'w-4 bg-red-500' : 'w-2 bg-white/30'
                }`}
                onClick={() => setSelectedStat(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Próximos eventos - Solo móvil */}
      {isMobile() && (
        <div className="px-4 mt-6">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-lg flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-red-400" />
                Próximos eventos
              </h3>
              <ChevronRight className="w-5 h-5 text-white/70" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 rounded-lg text-center p-2 w-12">
                  <div className="text-xs text-red-300">Sep</div>
                  <div className="text-white font-bold">18</div>
                </div>
                <div>
                  <div className="text-white font-medium">Asamblea General</div>
                  <div className="text-white/70 text-sm">19:00 - Salón de Usos Múltiples</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 rounded-lg text-center p-2 w-12">
                  <div className="text-xs text-red-300">Sep</div>
                  <div className="text-white font-bold">24</div>
                </div>
                <div>
                  <div className="text-white font-medium">Mantenimiento de piscina</div>
                  <div className="text-white/70 text-sm">09:00 - Área de piscina</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 px-4 sm:px-0">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 md:p-6">
          <h3 className="text-white font-bold text-lg mb-4">Resumen Financiero</h3>
          <div className="bg-white/5 rounded-xl h-48 md:h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-red-300/60 mx-auto mb-2" />
              <p className="text-red-100/60 text-sm">Gráfico de expensas y pagos</p>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 md:p-6">
          <h3 className="text-white font-bold text-lg mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {[
              { id: 1, title: 'Pago realizado', desc: 'Expensa octubre 2023', time: 'Hace 2h' },
              { id: 2, title: 'Visita aprobada', desc: 'Juan Pérez - 15 Oct', time: 'Hace 5h' },
              { id: 3, title: 'Reserva confirmada', desc: 'Salón de eventos', time: 'Ayer' },
              { id: 4, title: 'Reporte enviado', desc: 'Problema de iluminación', time: 'Hace 2d' }
            ].map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">{item.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-white/90 text-sm font-medium truncate">{item.title}</p>
                    <span className="text-white/50 text-xs ml-2 flex-shrink-0">{item.time}</span>
                  </div>
                  <p className="text-red-100/60 text-xs truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
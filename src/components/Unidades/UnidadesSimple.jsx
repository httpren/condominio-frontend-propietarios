import React from 'react';
import { Building2, Home, MapPin, Ruler } from 'lucide-react';
import useUnidades from '../../hooks/useUnidades';

const UnidadesSimple = () => {
  const { unidades, loading, error } = useUnidades();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <span className="ml-4 text-white/70">Cargando unidades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getTipoIcon = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'apartamento': return Home;
      case 'casa': return Building2;
      case 'oficina': return Building2;
      case 'local': return Building2;
      default: return Home;
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'apartamento': return 'text-blue-400 bg-blue-500/20';
      case 'casa': return 'text-green-400 bg-green-500/20';
      case 'oficina': return 'text-yellow-400 bg-yellow-500/20';
      case 'local': return 'text-purple-400 bg-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Building2 className="w-8 h-8 text-red-500" />
            Mis Unidades
          </h1>
          <p className="text-white/60">Vista rápida de tus propiedades</p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{unidades.length}</div>
            <div className="text-white/60 text-sm">Total Unidades</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {unidades.reduce((sum, u) => sum + (parseFloat(u.area_m2) || 0), 0).toFixed(0)}
            </div>
            <div className="text-white/60 text-sm">m² Totales</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {new Set(unidades.map(u => u.tipo)).size}
            </div>
            <div className="text-white/60 text-sm">Tipos Diferentes</div>
          </div>
        </div>

        {/* Lista de unidades */}
        {unidades.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white/70 mb-2">No hay unidades</h3>
            <p className="text-white/50">No tienes unidades registradas en el sistema</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unidades.map((unidad) => {
              const IconComponent = getTipoIcon(unidad.tipo);
              const colorClass = getTipoColor(unidad.tipo);
              
              return (
                <div
                  key={unidad.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200 hover:scale-105 hover:shadow-xl"
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                      {unidad.tipo || 'Sin tipo'}
                    </span>
                  </div>

                  {/* Información principal */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        Unidad {unidad.numero_unidad || 'S/N'}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {unidad.propietario_nombre || 'Sin propietario'}
                      </p>
                    </div>

                    {/* Detalles */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-white/70 text-sm">
                        <Ruler className="w-4 h-4" />
                        <span>{unidad.area_m2 ? `${unidad.area_m2} m²` : 'Área no especificada'}</span>
                      </div>
                      
                      {unidad.created_at && (
                        <div className="flex items-center gap-2 text-white/50 text-xs">
                          <MapPin className="w-3 h-3" />
                          <span>
                            Registrada: {new Date(unidad.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer de la tarjeta */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>ID: {unidad.id}</span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Activa
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnidadesSimple;
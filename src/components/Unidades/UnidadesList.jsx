import React, { useState } from 'react';
import { Building2, Home, Eye, Users, MapPin, Ruler } from 'lucide-react';
import useUnidades from '../../hooks/useUnidades';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import StatsGrid from '../common/StatsGrid';

const UnidadesList = () => {
  const { unidades, loading, error, fetchUnidadDetails, fetchConvivientes } = useUnidades();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [unidadDetails, setUnidadDetails] = useState(null);
  const [convivientes, setConvivientes] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const openDetails = async (unidad) => {
    setSelectedUnidad(unidad);
    setLoadingDetails(true);
    setShowDetails(true);
    setFeedback(null);

    try {
      // Cargar detalles de la unidad
      const detailsResponse = await fetchUnidadDetails(unidad.id);
      if (detailsResponse.success) {
        setUnidadDetails(detailsResponse.data);
      } else {
        setFeedback({ type: 'error', message: detailsResponse.message });
      }

      // Cargar convivientes
      const convivientesResponse = await fetchConvivientes(unidad.id);
      if (convivientesResponse.success) {
        setConvivientes(convivientesResponse.data);
      } else {
        setConvivientes([]);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error al cargar detalles de la unidad' });
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedUnidad(null);
    setUnidadDetails(null);
    setConvivientes([]);
    setFeedback(null);
  };

  // Configuración de la tabla
  const getTipoIcon = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'apartamento': return Home;
      case 'casa': return Building2;
      case 'oficina': return Building2;
      case 'local': return Building2;
      default: return Home;
    }
  };

  const getTipoBadgeVariant = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case 'apartamento': return 'info';
      case 'casa': return 'success';
      case 'oficina': return 'warning';
      case 'local': return 'neutral';
      default: return 'info';
    }
  };

  const columns = [
    {
      key: 'numero_unidad',
      header: 'Unidad',
      render: (value, row) => {
        const IconComponent = getTipoIcon(row.tipo);
        return (
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4 text-white/60" />
            <span className="font-medium">{value || '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'tipo_unidad',
      header: 'Tipo',
      render: (value) => (
        <Badge variant={getTipoBadgeVariant(value)}>
          {value || 'No especificado'}
        </Badge>
      ),
    },
    {
      key: 'area_m2',
      header: 'Área',
      render: (value) => value ? `${value} m²` : '—',
    },
    {
      key: 'propietario_nombre',
      header: 'Propietario',
      render: (value) => value || '—',
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (_, row) => (
        <Button
          variant="icon"
          icon={Eye}
          onClick={() => openDetails(row)}
          title="Ver detalles"
        />
      ),
    },
  ];

  // Estadísticas
  const totalArea = unidades.reduce((sum, u) => sum + (parseFloat(u.area_m2) || 0), 0);
  const tiposCount = unidades.reduce((acc, u) => {
    const tipo = u.tipo_unidad || 'No especificado';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  const statsData = [
    {
      title: 'Total Unidades',
      value: unidades.length,
      variant: 'info',
      icon: Building2,
    },
    {
      title: 'Área Total',
      value: `${totalArea.toFixed(0)} m²`,
      variant: 'success',
      icon: Ruler,
    },
    {
      title: 'Tipo Principal',
      value: Object.keys(tiposCount)[0] || 'N/A',
      variant: 'warning',
      icon: Home,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mis Unidades"
        description="Información de las unidades de tu propiedad"
        icon={Building2}
      />

      {/* Estadísticas */}
      <StatsGrid stats={statsData} />

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>
          {feedback.message}
        </div>
      )}

      {/* Error general */}
      {error && !feedback && (
        <div className="alert-error">{error}</div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={unidades}
        loading={loading}
        emptyMessage="No tienes unidades registradas"
      />

      {/* Modal de detalles */}
      <Modal
        isOpen={showDetails}
        onClose={closeDetails}
        title={`Detalles de Unidad ${selectedUnidad?.numero_unidad || ''}`}
        size="lg"
      >
        {loadingDetails ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60"></div>
            <span className="ml-3 text-white/70">Cargando detalles...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información básica */}
            {unidadDetails && (
              <div className="card-minimal">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Información General
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-white/50 mb-1">Número</label>
                    <p className="text-white">{unidadDetails.numero_unidad || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-white/50 mb-1">Tipo</label>
                    <p className="text-white">{unidadDetails.tipo_unidad || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-white/50 mb-1">Área</label>
                    <p className="text-white">{unidadDetails.area_m2 ? `${unidadDetails.area_m2} m²` : '—'}</p>
                  </div>
                  <div>
                    <label className="block text-white/50 mb-1">Propietario</label>
                    <p className="text-white">{unidadDetails.propietario_nombre || '—'}</p>
                  </div>
                  {unidadDetails.created_at && (
                    <div className="col-span-2">
                      <label className="block text-white/50 mb-1">Fecha de registro</label>
                      <p className="text-white">
                        {new Date(unidadDetails.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Convivientes */}
            <div className="card-minimal">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Convivientes ({convivientes.length})
              </h3>
              {convivientes.length === 0 ? (
                <p className="text-white/50 text-center py-4">
                  No hay convivientes registrados en esta unidad
                </p>
              ) : (
                <div className="space-y-3">
                  {convivientes.map((conviviente, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">
                            {(conviviente.user?.first_name || conviviente.user?.last_name)
                              ? `${conviviente.user?.first_name || ''} ${conviviente.user?.last_name || ''}`.trim()
                              : (conviviente.user?.username || conviviente.nombre || conviviente.name || 'Sin nombre')}
                          </h4>
                          <p className="text-white/60 text-sm">
                            {conviviente.user?.email || 'Sin email'}
                          </p>
                        </div>
                        {conviviente.telefono && (
                          <div className="text-right">
                            <p className="text-white/60 text-sm">
                              {conviviente.telefono}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="secondary"
                onClick={closeDetails}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UnidadesList;

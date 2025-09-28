import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, CheckCircle2, CircleX, Users, QrCode, RefreshCw, Filter, FilterX, Clock } from 'lucide-react';
import ReservaQrModal from './ReservaQrModal';
import useReservas from '../../hooks/useReservas';
import axiosInstance from '../../api/axiosConfig';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Badge from '../common/Badge';
import StatsGrid from '../common/StatsGrid';

const ReservasList = () => {
  const navigate = useNavigate();
  const { 
    reservas, 
    loading, 
    error, 
    confirmReserva, 
    cancelReserva, 
    fetchReservas 
  } = useReservas();
  
  const [feedback, setFeedback] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, host: '', invitados: [] });
  const [areas, setAreas] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ estado: '', fecha: '', area: '' });

  // Fetch listado de áreas para seleccionar
  useEffect(() => {
    let mounted = true;
    const loadAreas = async () => {
      try {
        const resp = await axiosInstance.get('/areas/');
        const list = resp.data?.results || resp.data || [];
        if (mounted) setAreas(list);
      } catch (e) { 
        console.error('Error cargando áreas:', e);
      }
    };
    loadAreas();
    return () => { mounted = false; };
  }, []);

  const handleConfirm = async (r) => {
    if (!window.confirm('¿Confirmar esta reserva? Esto generará un cargo en tu expensa.')) return;
    
    const res = await confirmReserva(r.id);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Reserva confirmada exitosamente' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al confirmar la reserva' });
    }
  };

  const handleCancel = async (r) => {
    if (!window.confirm(`¿Cancelar la reserva del ${r.fecha_reserva}?`)) return;
    
    const res = await cancelReserva(r.id);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Reserva cancelada exitosamente' });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Error al cancelar la reserva' });
    }
  };

  const openQr = (r) => {
    const host = r.qr_anfitrion || '';
    const invitados = Array.isArray(r.qr_invitados) ? r.qr_invitados : [];
    setQrModal({ open: true, host, invitados });
  };

  const isFutura = (r) => {
    if (!r.fecha_reserva) return false;
    const d = new Date(r.fecha_reserva);
    const hoy = new Date();
    return d >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  };

  const applyFilters = async () => {
    const params = {};
    if (filters.estado) params.estado = filters.estado;
    if (filters.fecha) params.fecha = filters.fecha;
    if (filters.area) params.area = filters.area;
    await fetchReservas(params);
  };

  const clearFilters = async () => {
    setFilters({ estado: '', fecha: '', area: '' });
    await fetchReservas();
  };

  // Configuración de la tabla
  const getBadgeVariant = (estado) => {
    switch (estado) {
      case 'confirmada': return 'success';
      case 'cancelada': return 'error';
      default: return 'info';
    }
  };

  const columns = [
    {
      key: 'area_nombre',
      header: 'Área',
      render: (value) => value || '—',
    },
    {
      key: 'fecha_reserva',
      header: 'Fecha',
      render: (value) => value ? new Date(value).toLocaleDateString('es-ES') : '—',
    },
    {
      key: 'horario',
      header: 'Horario',
      render: (_, row) => `${row.hora_inicio || ''} - ${row.hora_fin || ''}`,
    },
    {
      key: 'num_personas',
      header: 'Personas',
      render: (value) => value || '—',
    },
    {
      key: 'costo_total',
      header: 'Costo',
      render: (value) => value ? `$${value}` : '—',
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (value) => {
        const estado = value || 'pendiente';
        return (
          <Badge variant={getBadgeVariant(estado)}>
            {estado}
          </Badge>
        );
      },
    },
    {
      key: 'qr',
      header: 'QR',
      render: (_, row) => {
        const hasQR = row.qr_anfitrion || (Array.isArray(row.qr_invitados) && row.qr_invitados.length > 0);
        return hasQR ? (
          <Button
            variant="icon"
            icon={QrCode}
            onClick={() => openQr(row)}
            title="Ver códigos QR"
          />
        ) : null;
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (_, row) => {
        const futura = isFutura(row);
        const estado = row.estado || 'pendiente';
        
        return (
          <div className="flex items-center gap-2 justify-end">
            {estado === 'pendiente' && futura && (
              <Button
                variant="icon"
                icon={CheckCircle2}
                onClick={() => handleConfirm(row)}
                className="text-green-400 hover:text-green-300"
                title="Confirmar reserva"
              />
            )}
            {estado !== 'cancelada' && futura && (
              <Button
                variant="icon"
                icon={CircleX}
                onClick={() => handleCancel(row)}
                className="text-red-400 hover:text-red-300"
                title="Cancelar reserva"
              />
            )}
          </div>
        );
      },
    },
  ];

  // Estadísticas
  const now = new Date();
  const hoyKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const futuras = reservas.filter(r => {
    if (!r.fecha_reserva) return false; 
    const d = new Date(r.fecha_reserva); 
    return d.getTime() >= hoyKey; 
  });
  const pendientes = reservas.filter(r => (r.estado || 'pendiente') === 'pendiente');
  const confirmadas = reservas.filter(r => r.estado === 'confirmada');

  const statsData = [
    {
      title: 'Futuras',
      value: futuras.length,
      variant: 'info',
      icon: Calendar,
    },
    {
      title: 'Pendientes',
      value: pendientes.length,
      variant: 'warning',
      icon: Clock,
    },
    {
      title: 'Confirmadas',
      value: confirmadas.length,
      variant: 'success',
      icon: CheckCircle2,
    },
  ];

  // Opciones de áreas para filtros
  const areaOptions = areas.map(a => ({
    value: a.id,
    label: a.nombre || `Área ${a.id}`
  }));

  const estadoOptions = [
    { value: '', label: 'Todos' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmada', label: 'Confirmada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  // Acciones del header
  const headerActions = (
    <>
      <Button
        variant="secondary"
        icon={Filter}
        onClick={() => setFiltersOpen(!filtersOpen)}
      >
        Filtros
      </Button>
      <Button
        variant="secondary"
        icon={RefreshCw}
        onClick={() => fetchReservas()}
      >
        Refrescar
      </Button>
      <Button
        variant="secondary"
        icon={Plus}
        onClick={() => navigate('/reservas/crear')}
      >
        Nueva Reserva
      </Button>
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reservas"
        description="Administra las reservas de áreas comunes"
        icon={Calendar}
        actions={headerActions}
      />

      {/* Estadísticas */}
      <StatsGrid stats={statsData} />

      {/* Filtros */}
      {filtersOpen && (
        <div className="card-minimal animate-slide-down">
          <div className="grid md:grid-cols-4 grid-cols-2 gap-4">
            <Select
              label="Estado"
              value={filters.estado}
              onChange={(e) => setFilters(f => ({ ...f, estado: e.target.value }))}
              options={estadoOptions}
            />
            
            <Input
              label="Fecha"
              type="date"
              value={filters.fecha}
              onChange={(e) => setFilters(f => ({ ...f, fecha: e.target.value }))}
            />
            
            <Select
              label="Área"
              value={filters.area}
              onChange={(e) => setFilters(f => ({ ...f, area: e.target.value }))}
              options={[{ value: '', label: 'Todas' }, ...areaOptions]}
            />
            
            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                onClick={applyFilters}
                className="flex-1"
              >
                Aplicar
              </Button>
              <Button
                variant="secondary"
                icon={FilterX}
                onClick={clearFilters}
                className="flex-1"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}

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
        data={reservas}
        loading={loading}
        emptyMessage="No hay reservas registradas"
      />

      {/* Modal QR */}
      <ReservaQrModal
        open={qrModal.open}
        host={qrModal.host}
        invitados={qrModal.invitados}
        onClose={() => setQrModal({ open: false, host: '', invitados: [] })}
      />
    </div>
  );
};

export default ReservasList;
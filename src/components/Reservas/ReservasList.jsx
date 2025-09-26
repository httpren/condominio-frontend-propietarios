import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, CheckCircle2, CircleX, Users, QrCode, RefreshCw, Filter, FilterX, Clock, DollarSign } from 'lucide-react';
import ReservaQrModal from './ReservaQrModal';
import useReservas from '../../hooks/useReservas';
import axiosInstance from '../../api/axiosConfig';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Badge from '../common/Badge';
import StatsGrid from '../common/StatsGrid';

const initialForm = {
  area: '',
  fecha_reserva: '',
  hora_inicio: '',
  hora_fin: '',
  num_personas: '',
  invitados: []
};

const ReservasList = () => {
  const { 
    reservas, 
    loading, 
    error, 
    saving, 
    createReserva, 
    updateReserva, 
    confirmReserva, 
    cancelReserva, 
    fetchReservas 
  } = useReservas();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [feedback, setFeedback] = useState(null);
  const [guestInput, setGuestInput] = useState({ nombre: '', documento: '' });
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

  const resetForm = () => { 
    setFormData(initialForm); 
    setEditingId(null); 
    setGuestInput({ nombre: '', documento: '' }); 
  };

  const openCreate = () => { 
    resetForm(); 
    setShowForm(true); 
  };
  
  const openEdit = (r) => {
    setFormData({
      area: r.area || '',
      fecha_reserva: r.fecha_reserva || '',
      hora_inicio: r.hora_inicio || '',
      hora_fin: r.hora_fin || '',
      num_personas: r.num_personas || '',
      invitados: Array.isArray(r.invitados) ? r.invitados : []
    });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleChange = (e) => { 
    const { name, value } = e.target; 
    setFormData(p => ({ ...p, [name]: value })); 
  };

  const addInvitado = () => {
    if (!guestInput.nombre.trim()) return;
    
    setFormData(p => ({ 
      ...p, 
      invitados: [...p.invitados, { 
        nombre: guestInput.nombre.trim(), 
        documento: guestInput.documento.trim() 
      }] 
    }));
    setGuestInput({ nombre: '', documento: '' });
  };

  const removeInvitado = (idx) => {
    setFormData(p => ({ 
      ...p, 
      invitados: p.invitados.filter((_, i) => i !== idx) 
    }));
  };

  const validate = () => {
    if (!formData.area) return 'Área requerida';
    if (!formData.fecha_reserva) return 'Fecha requerida';
    if (!formData.hora_inicio || !formData.hora_fin) return 'Horas requeridas';
    if (formData.hora_inicio >= formData.hora_fin) return 'La hora de inicio debe ser menor que la hora de fin';
    if (!formData.num_personas || parseInt(formData.num_personas, 10) <= 0) return 'Número de personas inválido';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { 
      setFeedback({ type: 'error', message: validationError }); 
      return; 
    }
    
    const payload = {
      ...formData,
      num_personas: parseInt(formData.num_personas, 10)
    };
    
    const action = editingId ? updateReserva(editingId, payload) : createReserva(payload);
    const result = await action;
    
    if (result.success) {
      const message = editingId ? 'Reserva actualizada exitosamente' : 'Reserva creada exitosamente';
      const offlineNote = result.offlinePending ? ' (pendiente de sincronizar)' : '';
      setFeedback({ type: 'success', message: message + offlineNote });
      setShowForm(false); 
      resetForm();
    } else {
      setFeedback({ type: 'error', message: result.error || 'Error al procesar la reserva' });
    }
  };

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
            {estado === 'pendiente' && futura && (
              <Button
                variant="icon"
                icon={Users}
                onClick={() => openEdit(row)}
                title="Editar reserva"
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

  // Opciones de áreas para formulario
  const areaFormOptions = areas.map(a => ({
    value: a.id,
    label: a.nombre || `Área ${a.id}`
  }));

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
        onClick={openCreate}
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

      {/* Modal de formulario */}
      <Modal
        isOpen={showForm}
        onClose={() => { 
          setShowForm(false); 
          resetForm(); 
          setFeedback(null);
        }}
        title={editingId ? 'Editar Reserva' : 'Nueva Reserva'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Área"
              name="area"
              value={formData.area}
              onChange={handleChange}
              options={areaFormOptions}
              placeholder="Seleccione un área"
              required
            />
            
            <Input
              label="Fecha"
              type="date"
              name="fecha_reserva"
              value={formData.fecha_reserva}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hora de inicio"
              type="time"
              name="hora_inicio"
              value={formData.hora_inicio}
              onChange={handleChange}
              required
            />
            
            <Input
              label="Hora de fin"
              type="time"
              name="hora_fin"
              value={formData.hora_fin}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Número de personas"
            type="number"
            name="num_personas"
            value={formData.num_personas}
            onChange={handleChange}
            placeholder="Ej: 5"
            required
          />

          {/* Gestión de invitados */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-white/70">
              Invitados
            </label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Nombre del invitado"
                value={guestInput.nombre}
                onChange={(e) => setGuestInput(g => ({ ...g, nombre: e.target.value }))}
                className="flex-1"
              />
              <Input
                placeholder="Documento (opcional)"
                value={guestInput.documento}
                onChange={(e) => setGuestInput(g => ({ ...g, documento: e.target.value }))}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addInvitado}
                disabled={!guestInput.nombre.trim()}
              >
                Agregar
              </Button>
            </div>

            {/* Lista de invitados */}
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {formData.invitados.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">
                  No hay invitados agregados
                </p>
              ) : (
                formData.invitados.map((inv, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 px-3 py-2 rounded-lg">
                    <span className="text-white/80 text-sm">
                      {inv.nombre}
                      {inv.documento && (
                        <span className="text-white/40 ml-2">({inv.documento})</span>
                      )}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInvitado(i)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Quitar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 text-sm">
              <strong>Información importante:</strong> El costo se calculará automáticamente después de crear la reserva. 
              Los códigos QR se generarán al confirmar. No podrás editar la reserva una vez confirmada.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => { 
                setShowForm(false); 
                resetForm(); 
                setFeedback(null);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              loading={saving}
              icon={editingId ? Users : Plus}
            >
              {editingId ? 'Guardar Cambios' : 'Crear Reserva'}
            </Button>
          </div>
        </form>
      </Modal>

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
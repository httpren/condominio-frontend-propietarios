import React, { useState, useCallback, useMemo } from 'react';
import { UserCheck, Plus, Trash2, Edit2, QrCode, Calendar, Clock, Users } from 'lucide-react';
import VisitQrModal from './VisitQrModal';
import useVisitas from '../../hooks/useVisitas';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';
import StatsGrid from '../common/StatsGrid';

const initialForm = { nombre_visitante: '', documento_visitante: '', fecha: '' };

const VisitasList = () => {
  const { visitas, loading, error, createVisita, updateVisita, deleteVisita } = useVisitas();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, code: '' });

  const resetForm = useCallback(() => { 
    setFormData(initialForm); 
    setEditingId(null); 
  }, []);
  
  const openCreate = useCallback(() => { 
    resetForm(); 
    setShowForm(true); 
  }, [resetForm]);
  
  const openEdit = useCallback((v) => {
    setFormData({
      nombre_visitante: v.nombre_visitante || v.nombre || '',
      documento_visitante: v.documento_visitante || '',
      fecha: v.fecha || v.fecha_visita || ''
    });
    setEditingId(v.id);
    setShowForm(true);
  }, []);

  const handleChange = useCallback((e) => { 
    const { name, value } = e.target; 
    setFormData(p => ({ ...p, [name]: value })); 
  }, []);

  const validate = useCallback(() => {
    if (!formData.fecha) return 'Fecha requerida';
    const d = new Date(formData.fecha);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    const now = new Date();
    if (d < now) return 'La fecha debe ser futura';
    if (!formData.nombre_visitante) return 'Nombre requerido';
    return null;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const valErr = validate();
    if (valErr) { 
      setFeedback({ type: 'error', message: valErr }); 
      return; 
    }
    
    setSubmitting(true);
    setFeedback(null);
    const payload = {
      nombre_visitante: formData.nombre_visitante,
      documento_visitante: formData.documento_visitante,
      fecha: formData.fecha
    };
    
    const action = editingId ? updateVisita(editingId, payload) : createVisita(payload);
    const result = await action;
    
    if (result.success) {
      const base = editingId ? 'Visita actualizada exitosamente' : 'Visita registrada exitosamente';
      const message = result.offlinePending ? `${base} (pendiente de sincronizar)` : base;
      setFeedback({ type: 'success', message });
      setShowForm(false);
      resetForm();
      
      // Si se creó online y hay qr_code, mostrar modal con QR
      if (!editingId && !result.offlinePending && result.data?.qr_code) {
        setQrModal({ open: true, code: result.data.qr_code });
      }
    } else {
      setFeedback({ type: 'error', message: result.error || 'Error al procesar la visita' });
    }
    setSubmitting(false);
  }, [formData, validate, editingId, updateVisita, createVisita, resetForm]);

  const handleDelete = useCallback(async (v) => {
    if (!window.confirm('¿Cancelar / eliminar esta visita?')) return;
    const r = await deleteVisita(v.id);
    if (!r.success) {
      setFeedback({ type: 'error', message: r.error || 'Error al eliminar la visita' });
    } else {
      setFeedback({ type: 'success', message: 'Visita eliminada exitosamente' });
    }
  }, [deleteVisita]);

  const isFutura = useCallback((fechaStr) => {
    const d = new Date(fechaStr);
    return d > new Date();
  }, []);

  // Configuración de la tabla
  const columns = useMemo(() => [
    {
      key: 'nombre_visitante',
      header: 'Visitante',
      render: (value, row) => {
        const nombre = value || row.nombre || '—';
        return <span className="font-medium">{nombre}</span>;
      },
    },
    {
      key: 'documento_visitante',
      header: 'Documento',
      render: (value) => value || '—',
    },
    {
      key: 'fecha',
      header: 'Fecha y Hora',
      render: (value, row) => {
        const fecha = value || row.fecha_visita;
        if (!fecha) return '—';
        try {
          const d = new Date(fecha);
          return d.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch {
          return fecha;
        }
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (_, row) => {
        const fecha = row.fecha || row.fecha_visita;
        const futura = fecha && isFutura(fecha);
        return (
          <Badge variant={futura ? 'info' : 'neutral'}>
            {futura ? 'Programada' : 'Pasada'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (_, row) => {
        const fecha = row.fecha || row.fecha_visita;
        const futura = fecha && isFutura(fecha);
        
        return (
          <div className="flex items-center gap-2 justify-end">
            {row.qr_code && (
              <Button
                variant="icon"
                icon={QrCode}
                onClick={() => setQrModal({ open: true, code: row.qr_code })}
                title="Ver código QR"
              />
            )}
            {futura && (
              <Button
                variant="icon"
                icon={Edit2}
                onClick={() => openEdit(row)}
                title="Editar visita"
              />
            )}
            <Button
              variant="icon"
              icon={Trash2}
              onClick={() => handleDelete(row)}
              className="text-red-400 hover:text-red-300"
              title="Eliminar visita"
            />
          </div>
        );
      },
    },
  ], [isFutura, openEdit, handleDelete]);

  // Estadísticas
  const statsData = useMemo(() => {
    const now = new Date();
    const futuras = visitas.filter(v => {
      const fecha = v.fecha || v.fecha_visita;
      return fecha && isFutura(fecha);
    });
    const hoy = visitas.filter(v => {
      const fecha = v.fecha || v.fecha_visita;
      if (!fecha) return false;
      const d = new Date(fecha);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });

    return [
      {
        title: 'Total',
        value: visitas.length,
        variant: 'info',
        icon: Users,
      },
      {
        title: 'Programadas',
        value: futuras.length,
        variant: 'success',
        icon: Calendar,
      },
      {
        title: 'Para hoy',
        value: hoy.length,
        variant: 'warning',
        icon: Clock,
      },
    ];
  }, [visitas, isFutura]);

  // Acciones del header
  const headerActions = useMemo(() => (
    <Button
      variant="secondary"
      icon={Plus}
      onClick={openCreate}
    >
      Nueva Visita
    </Button>
  ), [openCreate]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Visitas"
        description="Registra y administra las visitas a tu unidad"
        icon={UserCheck}
        actions={headerActions}
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
        data={visitas}
        loading={loading}
        emptyMessage="No hay visitas registradas"
      />

      {/* Modal de formulario */}
      <Modal
        isOpen={showForm}
        onClose={() => { 
          setShowForm(false); 
          resetForm(); 
          setFeedback(null);
        }}
        title={editingId ? 'Editar Visita' : 'Nueva Visita'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="nombre_visitante"
            label="Nombre del Visitante"
            name="nombre_visitante"
            value={formData.nombre_visitante}
            onChange={handleChange}
            placeholder="Nombre completo del visitante"
            required
          />
          
          <Input
            id="documento_visitante"
            label="Documento de Identidad"
            name="documento_visitante"
            value={formData.documento_visitante}
            onChange={handleChange}
            placeholder="Número de documento (opcional)"
          />
          
          <Input
            id="fecha_visita"
            label="Fecha y Hora de Visita"
            type="datetime-local"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            required
          />

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 text-sm">
              <strong>Información importante:</strong> Se generará un código QR automáticamente para que el visitante 
              pueda ingresar. La fecha debe ser futura y se recomienda incluir el documento para mayor seguridad.
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
              disabled={submitting}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              loading={submitting}
              icon={editingId ? Edit2 : Plus}
            >
              {editingId ? 'Guardar Cambios' : 'Registrar Visita'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal QR */}
      <VisitQrModal
        open={qrModal.open}
        code={qrModal.code}
        onClose={() => setQrModal({ open: false, code: '' })}
        onCopied={() => setFeedback({ type: 'success', message: 'Código copiado al portapapeles' })}
      />
    </div>
  );
};

export default VisitasList;
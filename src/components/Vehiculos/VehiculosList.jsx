import React, { useState } from 'react';
import { Plus, Car, QrCode, RefreshCw, Power, Trash2, Edit2 } from 'lucide-react';
import useVehiculos from '../../hooks/useVehiculos';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import Badge from '../common/Badge';

// Campos básicos inferidos. Ajustar si el backend requiere otros nombres.
const initialForm = { placa: '', tipo_vehiculo: 'auto', color: '', marca: '', modelo: '' };

const VehiculosList = () => {
  const { 
    vehiculos, 
    loading, 
    error, 
    createVehiculo, 
    updateVehiculo, 
    deleteVehiculo, 
    generateQR, 
    toggleActivo 
  } = useVehiculos();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const openCreate = () => { 
    resetForm(); 
    setShowForm(true); 
  };

  const openEdit = (vehiculo) => {
    setFormData({
      placa: vehiculo.placa || '',
      tipo_vehiculo: vehiculo.tipo_vehiculo || vehiculo.tipo || 'auto',
      color: vehiculo.color || '',
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || ''
    });
    setEditingId(vehiculo.id);
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    
    const action = editingId ? updateVehiculo(editingId, formData) : createVehiculo(formData);
    const result = await action;
    
    if (result.success) {
      setFeedback({ 
        type: 'success', 
        message: editingId ? 'Vehículo actualizado exitosamente' : 'Vehículo creado exitosamente' 
      });
      setShowForm(false);
      resetForm();
    } else {
      setFeedback({ type: 'error', message: result.error || 'Error al procesar la solicitud' });
    }
    
    setSubmitting(false);
  };

  const handleDelete = async (vehiculo) => {
    if (!window.confirm(`¿Estás seguro de eliminar el vehículo ${vehiculo.placa}?`)) return;
    
    const result = await deleteVehiculo(vehiculo.id);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error || 'Error al eliminar el vehículo' });
    } else {
      setFeedback({ type: 'success', message: 'Vehículo eliminado exitosamente' });
    }
  };

  const handleQR = async (id) => {
    const result = await generateQR(id);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error || 'Error al generar código QR' });
    } else {
      setFeedback({ type: 'success', message: 'Código QR generado exitosamente' });
    }
  };

  const handleToggle = async (vehiculo) => {
    const result = await toggleActivo(vehiculo);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error || 'Error al cambiar estado del vehículo' });
    } else {
      const newState = vehiculo.activo ? 'desactivado' : 'activado';
      setFeedback({ type: 'success', message: `Vehículo ${newState} exitosamente` });
    }
  };

  // Configuración de la tabla
  const columns = [
    {
      key: 'placa',
      header: 'Placa',
      render: (value) => (
        <span className="font-medium text-white font-mono">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'tipo_vehiculo',
      header: 'Tipo',
      render: (value, row) => (
        <span className="capitalize">
          {value || row.tipo || '—'}
        </span>
      ),
    },
    {
      key: 'color',
      header: 'Color',
      render: (value) => value || '—',
    },
    {
      key: 'marca',
      header: 'Marca',
      render: (value) => value || '—',
    },
    {
      key: 'modelo',
      header: 'Modelo',
      render: (value) => value || '—',
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (value) => (
        <Badge variant={value ? 'success' : 'error'}>
          {value ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'qr_code_url',
      header: 'QR',
      render: (value) => (
        value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-400 hover:text-blue-300 underline text-sm"
          >
            Ver QR
          </a>
        ) : (
          <span className="text-white/40 text-sm">—</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (_, row) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="icon"
            icon={QrCode}
            onClick={() => handleQR(row.id)}
            title="Generar/Regenerar QR"
          />
          <Button
            variant="icon"
            icon={Power}
            onClick={() => handleToggle(row)}
            className={row.activo ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}
            title="Activar/Desactivar"
          />
          <Button
            variant="icon"
            icon={Edit2}
            onClick={() => openEdit(row)}
            title="Editar vehículo"
          />
          <Button
            variant="icon"
            icon={Trash2}
            onClick={() => handleDelete(row)}
            className="text-red-400 hover:text-red-300"
            title="Eliminar vehículo"
          />
        </div>
      ),
    },
  ];

  const tipoOptions = [
    { value: 'auto', label: 'Auto' },
    { value: 'moto', label: 'Moto' },
    { value: 'bicicleta', label: 'Bicicleta' },
    { value: 'otro', label: 'Otro' }
  ];

  // Acciones del header
  const headerActions = (
    <Button
      variant="primary"
      icon={Plus}
      onClick={openCreate}
    >
      Nuevo Vehículo
    </Button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mis Vehículos"
        description="Administra el registro de tus vehículos y códigos QR"
        icon={Car}
        actions={headerActions}
      />

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
        data={vehiculos}
        loading={loading}
        emptyMessage="No tienes vehículos registrados"
      />

      {/* Modal de formulario */}
      <Modal
        isOpen={showForm}
        onClose={() => { 
          setShowForm(false); 
          resetForm(); 
          setFeedback(null);
        }}
        title={editingId ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Placa"
              name="placa"
              value={formData.placa}
              onChange={handleChange}
              placeholder="ABC123"
              className="font-mono"
              required
            />

            <Select
              label="Tipo de vehículo"
              name="tipo_vehiculo"
              value={formData.tipo_vehiculo}
              onChange={handleChange}
              options={tipoOptions}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Ej: Rojo"
            />
            
            <Input
              label="Marca"
              name="marca"
              value={formData.marca}
              onChange={handleChange}
              placeholder="Ej: Toyota"
            />

            <Input
              label="Modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              placeholder="Ej: Corolla"
            />
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
              {editingId ? 'Guardar Cambios' : 'Crear Vehículo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default VehiculosList;
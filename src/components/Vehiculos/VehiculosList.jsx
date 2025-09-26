import React, { useState, useCallback } from 'react';
import { Plus, Car, QrCode, Trash2, Edit2, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
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
    // generateQR  // Ya no usamos el backend para el código QR, ahora es la placa
  } = useVehiculos();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [vehiculoQR, setVehiculoQR] = useState(null); // vehiculo seleccionado para QR

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

  // Abrir modal QR usando la placa como valor directo del código
  const openQR = (vehiculo) => {
    if (!vehiculo?.placa) {
      setFeedback({ type: 'error', message: 'El vehículo no tiene placa definida' });
      return;
    }
    setVehiculoQR(vehiculo);
    setShowQR(true);
  };

  const closeQR = () => {
    setShowQR(false);
    setVehiculoQR(null);
  };

  // Descargar el SVG del QR (se genera en el modal)
  const handleDownloadQR = useCallback(() => {
    const svg = document.querySelector('#vehiculo-qr-modal svg');
    if (!svg || !vehiculoQR) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    // Añadir cabecera XML para mejor compatibilidad
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
      source = source.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${vehiculoQR.placa}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [vehiculoQR]);

  // Se eliminó la acción de activar/desactivar por no estar contemplada en la documentación para propietarios.

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
    // Campo estado removido del listado para propietarios (no requerido por especificación)
    // Columna QR ahora siempre disponible: genera QR local usando la placa
    {
      key: 'qr_local',
      header: 'QR',
      render: (_, row) => (
        row.placa ? (
          <button
            type="button"
            onClick={() => openQR(row)}
            className="text-blue-400 hover:text-blue-300 underline text-sm"
          >
            Ver QR
          </button>
        ) : <span className="text-white/40 text-sm">—</span>
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
            onClick={() => openQR(row)}
            title="Mostrar QR de la placa"
          />
          {/* Botón activar/desactivar removido */}
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
      variant="secondary"
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

      {/* Modal QR (simple, reutiliza Modal pero podría hacerse one-off */}
      <Modal
        isOpen={showQR}
        onClose={closeQR}
        title={`QR de la placa ${vehiculoQR?.placa || ''}`}
        size="sm"
      >
        <div id="vehiculo-qr-modal" className="flex flex-col items-center gap-4 py-2">
          {vehiculoQR?.placa && (
            <div className="p-4 bg-white rounded-lg">
              <QRCode value={vehiculoQR.placa} size={180} />
            </div>
          )}
          <p className="text-sm text-white/70 -mt-2">Escanea para identificar el vehículo por su placa.</p>
          <div className="flex gap-3 w-full justify-end pt-2">
            <Button variant="secondary" type="button" onClick={closeQR}>Cerrar</Button>
            <Button variant="secondary" type="button" icon={Download} onClick={handleDownloadQR} disabled={!vehiculoQR?.placa}>Descargar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VehiculosList;
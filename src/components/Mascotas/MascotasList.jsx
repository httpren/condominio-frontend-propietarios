import React, { useState } from 'react';
import { PawPrint, Plus, Trash2, Edit2 } from 'lucide-react';
import useMascotas from '../../hooks/useMascotas';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

// Campos básicos inferidos del modelo típico: nombre, tipo, raza, edad
const initialForm = { nombre: '', tipo: 'perro', raza: '', edad: '' };

const MascotasList = () => {
  const { mascotas, loading, error, createMascota, updateMascota, deleteMascota } = useMascotas();
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
  
  const openEdit = (m) => {
    setFormData({ 
      nombre: m.nombre || '', 
      tipo: m.tipo || 'perro', 
      raza: m.raza || '', 
      edad: m.edad || '' 
    });
    setEditingId(m.id);
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
    
    const action = editingId ? updateMascota(editingId, formData) : createMascota(formData);
    const result = await action;
    
    if (result.success) {
      setFeedback({ 
        type: 'success', 
        message: editingId ? 'Mascota actualizada exitosamente' : 'Mascota creada exitosamente' 
      });
      setShowForm(false);
      resetForm();
    } else {
      setFeedback({ type: 'error', message: result.error || 'Error al procesar la solicitud' });
    }
    
    setSubmitting(false);
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${m.nombre}?`)) return;
    
    const result = await deleteMascota(m.id);
    if (!result.success) {
      setFeedback({ type: 'error', message: result.error || 'Error al eliminar la mascota' });
    } else {
      setFeedback({ type: 'success', message: 'Mascota eliminada exitosamente' });
    }
  };

  // Configuración de la tabla
  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (value) => (
        <span className="font-medium text-white">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (value) => (
        <span className="capitalize">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'raza',
      header: 'Raza',
      render: (value) => value || '—',
    },
    {
      key: 'edad',
      header: 'Edad',
      render: (value) => value || '—',
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
            icon={Edit2}
            onClick={() => openEdit(row)}
            title="Editar mascota"
          />
          <Button
            variant="icon"
            icon={Trash2}
            onClick={() => handleDelete(row)}
            className="text-red-400 hover:text-red-300"
            title="Eliminar mascota"
          />
        </div>
      ),
    },
  ];

  const tipoOptions = [
    { value: 'perro', label: 'Perro' },
    { value: 'gato', label: 'Gato' },
    { value: 'ave', label: 'Ave' },
    { value: 'otro', label: 'Otro' }
  ];

  // Acciones del header
  const headerActions = (
    <Button
      variant="secondary"
      icon={Plus}
      onClick={openCreate}
    >
      Nueva Mascota
    </Button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mis Mascotas"
        description="Administra el registro de tus mascotas"
        icon={PawPrint}
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
        data={mascotas}
        loading={loading}
        emptyMessage="No tienes mascotas registradas"
      />

      {/* Modal de formulario */}
      <Modal
        isOpen={showForm}
        onClose={() => { 
          setShowForm(false); 
          resetForm(); 
          setFeedback(null);
        }}
        title={editingId ? 'Editar Mascota' : 'Nueva Mascota'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Nombre de la mascota"
            required
          />

          <Select
            label="Tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            options={tipoOptions}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Raza"
              name="raza"
              value={formData.raza}
              onChange={handleChange}
              placeholder="Ej: Labrador"
            />
            
            <Input
              label="Edad"
              name="edad"
              value={formData.edad}
              onChange={handleChange}
              placeholder="Ej: 3 años"
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
              {editingId ? 'Guardar Cambios' : 'Crear Mascota'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MascotasList;
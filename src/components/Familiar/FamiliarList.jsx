import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, UserPlus, Phone, Mail } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import PageHeader from '../common/PageHeader';
import Table from '../common/Table';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import StatsGrid from '../common/StatsGrid';

const initialForm = { nombre: '', email: '', telefono: '' };

const FamiliarList = () => {
  const [familiares, setFamiliares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [feedback, setFeedback] = useState(null);
  const [propietarioId, setPropietarioId] = useState(null);

  // Inferir propietarioId desde user almacenado
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        const pid = u.propietario_id || u.propietarioId || u.propietario?.id;
        if (pid) setPropietarioId(pid);
      }
    } catch (e) {
      console.warn('No se pudo parsear user para propietarioId');
    }
  }, []);

  const fetchFamiliares = async () => {
    if (!propietarioId) return;
    setLoading(true);
    setFeedback(null);
    try {
      const response = await axiosInstance.get(`/propietarios/${propietarioId}/`);
      const fam = response.data.familiares || response.data.inquilinos || [];
      setFamiliares(Array.isArray(fam) ? fam : []);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error al cargar familiares' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFamiliares(); }, [propietarioId]);

  const openCreate = () => { 
    setFormData(initialForm); 
    setShowForm(true); 
  };
  
  const handleChange = (e) => { 
    const { name, value } = e.target; 
    setFormData(p => ({ ...p, [name]: value })); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!propietarioId) return;
    
    setCreating(true);
    setFeedback(null);
    try {
      const response = await axiosInstance.post(`/propietarios/${propietarioId}/create_familiar/`, formData);
      setFamiliares(prev => [...prev, response.data]);
      setFeedback({ type: 'success', message: 'Familiar agregado exitosamente' });
      setShowForm(false);
      setFormData(initialForm);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error al crear familiar' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (f) => {
    // TODO: Implementar cuando esté disponible el endpoint
    setFeedback({ 
      type: 'error', 
      message: 'Función de eliminar aún no implementada en el backend' 
    });
  };

  // Configuración de la tabla
  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (value, row) => {
        const nombre = value || row.name || '—';
        return <span className="font-medium">{nombre}</span>;
      },
    },
    {
      key: 'email',
      header: 'Correo Electrónico',
      render: (value) => value || '—',
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      render: (value, row) => value || row.phone || '—',
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
            icon={Trash2}
            onClick={() => handleDelete(row)}
            className="text-red-400 hover:text-red-300"
            title="Eliminar familiar"
          />
        </div>
      ),
    },
  ];

  // Estadísticas
  const statsData = [
    {
      title: 'Familiares',
      value: familiares.length,
      variant: 'info',
      icon: Users,
    },
    {
      title: 'Con Email',
      value: familiares.filter(f => f.email).length,
      variant: 'success',
      icon: Mail,
    },
    {
      title: 'Con Teléfono',
      value: familiares.filter(f => f.telefono || f.phone).length,
      variant: 'warning',
      icon: Phone,
    },
  ];

  // Acciones del header
  const headerActions = (
    <Button
      variant="primary"
      icon={Plus}
      onClick={openCreate}
      disabled={!propietarioId}
    >
      Agregar Familiar
    </Button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Familiares e Inquilinos"
        description="Gestiona los familiares e inquilinos de tu unidad"
        icon={Users}
        actions={headerActions}
      />

      {/* Advertencia si no hay propietarioId */}
      {!propietarioId && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-amber-300 text-sm">
            <strong>Advertencia:</strong> No se encontró el ID del propietario en el usuario. 
            Por favor, verifica tu sesión o contacta al administrador.
          </p>
        </div>
      )}

      {/* Estadísticas */}
      <StatsGrid stats={statsData} />

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>
          {feedback.message}
        </div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={familiares}
        loading={loading}
        emptyMessage="No hay familiares registrados"
      />

      {/* Modal de formulario */}
      <Modal
        isOpen={showForm}
        onClose={() => { 
          setShowForm(false); 
          setFormData(initialForm);
          setFeedback(null);
        }}
        title="Agregar Familiar o Inquilino"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre Completo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez"
            required
          />
          
          <Input
            label="Correo Electrónico"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            required
          />
          
          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Ej: 77777777"
          />

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 text-sm">
              <strong>Información importante:</strong> Los familiares e inquilinos podrán acceder al sistema 
              con las credenciales que se les asignen. Se enviará una notificación al correo proporcionado.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={() => { 
                setShowForm(false); 
                setFormData(initialForm);
                setFeedback(null);
              }}
              disabled={creating}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              loading={creating}
              icon={UserPlus}
              disabled={!propietarioId}
            >
              Agregar Familiar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FamiliarList;
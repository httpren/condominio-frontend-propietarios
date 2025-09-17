import React, { useState } from 'react';
import { Plus, Car, QrCode, RefreshCw, Power, Loader2, Trash2, Edit2, X } from 'lucide-react';
import useVehiculos from '../../hooks/useVehiculos';

// Campos básicos inferidos. Ajustar si el backend requiere otros nombres.
const initialForm = { placa: '', tipo_vehiculo: 'auto', color: '', marca: '' };

const VehiculosList = () => {
  const { vehiculos, loading, error, createVehiculo, updateVehiculo, deleteVehiculo, generateQR, toggleActivo } = useVehiculos();
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
      marca: vehiculo.marca || ''
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
      setFeedback({ type: 'success', message: editingId ? 'Vehículo actualizado' : 'Vehículo creado' });
      setShowForm(false);
      resetForm();
    } else {
      setFeedback({ type: 'error', message: result.error || 'Error' });
    }
    setSubmitting(false);
  };

  const handleDelete = async (vehiculo) => {
    if (!window.confirm('¿Eliminar este vehículo?')) return;
    const r = await deleteVehiculo(vehiculo.id);
    if (!r.success) setFeedback({ type: 'error', message: r.error });
  };

  const handleQR = async (id) => {
    const r = await generateQR(id);
    if (!r.success) setFeedback({ type: 'error', message: r.error });
  };

  const handleToggle = async (vehiculo) => {
    const r = await toggleActivo(vehiculo);
    if (!r.success) setFeedback({ type: 'error', message: r.error });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2"><Car className="w-6 h-6" /> Mis Vehículos</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo</button>
      </div>

      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>
          {feedback.message}
        </div>
      )}

      {error && !feedback && (
        <div className="alert-error">{error}</div>
      )}

      <div className="table-container">
        <table className="table-primary text-sm">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Tipo</th>
              <th>Color</th>
              <th>Marca</th>
              <th>Estado</th>
              <th>QR</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-white/70"><Loader2 className="w-5 h-5 inline animate-spin mr-2" />Cargando...</td></tr>
            ) : vehiculos.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-white/60">No tienes vehículos registrados.</td></tr>
            ) : (
              vehiculos.map(v => (
                <tr key={v.id} className="transition-colors">
                  <td className="font-medium">{v.placa || '—'}</td>
                  <td className="capitalize">{v.tipo_vehiculo || v.tipo || '—'}</td>
                  <td>{v.color || '—'}</td>
                  <td>{v.marca || '—'}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${v.activo ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {v.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {v.qr_code_url ? (
                      <a href={v.qr_code_url} target="_blank" rel="noopener noreferrer" className="text-red-300 hover:text-red-200 underline text-xs">Ver QR</a>
                    ) : (
                      <span className="text-white/40 text-xs">—</span>
                    )}
                  </td>
                  <td className="flex items-center gap-2 justify-end">
                    <button onClick={() => handleQR(v.id)} className="btn-icon" title="Generar/Re-generar QR">
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleToggle(v)} className="btn-icon" title="Activar/Inactivar">
                      <Power className={`w-4 h-4 ${v.activo ? 'text-green-300' : 'text-red-300'}`} />
                    </button>
                    <button onClick={() => openEdit(v)} className="btn-icon" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(v)} className="btn-icon" title="Eliminar">
                      <Trash2 className="w-4 h-4 text-red-300" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-container max-w-lg w-full animate-bounce-in relative">
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-icon absolute top-3 right-3"><X className="w-5 h-5" /></button>
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
              {editingId ? 'Editar Vehículo' : 'Nuevo Vehículo'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Placa</label>
                <input name="placa" value={formData.placa} onChange={handleChange} required className="input-primary" placeholder="ABC123" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Tipo</label>
                <select name="tipo_vehiculo" value={formData.tipo_vehiculo} onChange={handleChange} required>
                  <option value="auto">Auto</option>
                  <option value="moto">Moto</option>
                  <option value="bicicleta">Bicicleta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Color</label>
                  <input name="color" value={formData.color} onChange={handleChange} className="input-primary" placeholder="Rojo" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Marca</label>
                  <input name="marca" value={formData.marca} onChange={handleChange} className="input-primary" placeholder="Toyota" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiculosList;
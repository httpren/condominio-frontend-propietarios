import React, { useState } from 'react';
import { PawPrint, Plus, Loader2, Trash2, Edit2, X } from 'lucide-react';
import useMascotas from '../../hooks/useMascotas';

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

  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (m) => {
    setFormData({ nombre: m.nombre || '', tipo: m.tipo || 'perro', raza: m.raza || '', edad: m.edad || '' });
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
      setFeedback({ type: 'success', message: editingId ? 'Mascota actualizada' : 'Mascota creada' });
      setShowForm(false);
      resetForm();
    } else {
      setFeedback({ type: 'error', message: result.error || 'Error' });
    }
    setSubmitting(false);
  };

  const handleDelete = async (m) => {
    if (!window.confirm('¿Eliminar esta mascota?')) return;
    const r = await deleteMascota(m.id);
    if (!r.success) setFeedback({ type: 'error', message: r.error });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2"><PawPrint className="w-6 h-6" /> Mis Mascotas</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva</button>
      </div>

      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>
          {feedback.message}
        </div>
      )}
      {error && !feedback && <div className="alert-error">{error}</div>}

      <div className="table-container">
        <table className="table-primary text-sm">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Raza</th>
              <th>Edad</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-white/70"><Loader2 className="w-5 h-5 inline animate-spin mr-2" />Cargando...</td></tr>
            ) : mascotas.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-white/60">No tienes mascotas registradas.</td></tr>
            ) : (
              mascotas.map(m => (
                <tr key={m.id}>
                  <td className="font-medium">{m.nombre || '—'}</td>
                  <td className="capitalize">{m.tipo || '—'}</td>
                  <td>{m.raza || '—'}</td>
                  <td>{m.edad || '—'}</td>
                  <td className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(m)} className="btn-icon" title="Editar"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(m)} className="btn-icon" title="Eliminar"><Trash2 className="w-4 h-4 text-red-300" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md w-full animate-bounce-in relative">
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-icon absolute top-3 right-3"><X className="w-5 h-5" /></button>
            <h2 className="text-white text-lg font-semibold mb-4">{editingId ? 'Editar Mascota' : 'Nueva Mascota'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Nombre</label>
                <input name="nombre" value={formData.nombre} onChange={handleChange} required className="input-primary" placeholder="Firulais" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Tipo</label>
                <select name="tipo" value={formData.tipo} onChange={handleChange} required>
                  <option value="perro">Perro</option>
                  <option value="gato">Gato</option>
                  <option value="ave">Ave</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Raza</label>
                  <input name="raza" value={formData.raza} onChange={handleChange} className="input-primary" placeholder="Labrador" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Edad</label>
                  <input name="edad" value={formData.edad} onChange={handleChange} className="input-primary" placeholder="3" />
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

export default MascotasList;
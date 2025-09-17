import React, { useState, useEffect } from 'react';
import { UsersRound, Plus, Loader2, Trash2, X, UserPlus } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';

// NOTE: La API expose: /api/propietarios/{id}/  (GET) y /api/propietarios/{id}/create_familiar/ (POST)
// Necesitamos el id del propietario. Asumimos que viene en user (localStorage 'user') o habrá que pedirlo.
// Por ahora: intentar leer user.propietario_id (TODO ajustar al modelo real cuando lo confirmemos).

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
        // TODO: Ajustar nombre real del campo cuando se confirme (ej: u.propietario?.id)
        const pid = u.propietario_id || u.propietarioId || u.propietario?.id;
        if (pid) setPropietarioId(pid);
      }
    } catch (e) {
      console.warn('No se pudo parsear user para propietarioId');
    }
  }, []);

  const fetchFamiliares = async () => {
    if (!propietarioId) return; // Esperar a tener id
    setLoading(true);
    setFeedback(null);
    try {
      // GET propietario para extraer familiares (asumido)
      const response = await axiosInstance.get(`/propietarios/${propietarioId}/`);
      // TODO: Ajustar según estructura real. Suponemos response.data.familiares || []
      const fam = response.data.familiares || response.data.inquilinos || [];
      setFamiliares(Array.isArray(fam) ? fam : []);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error al cargar familiares' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFamiliares(); }, [propietarioId]);

  const openCreate = () => { setFormData(initialForm); setShowForm(true); };
  const handleChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!propietarioId) return;
    setCreating(true);
    setFeedback(null);
    try {
      // POST create_familiar
      const response = await axiosInstance.post(`/propietarios/${propietarioId}/create_familiar/`, formData);
      // Añadir a la lista (ajustar segun payload devuelto)
      setFamiliares(prev => [...prev, response.data]);
      setFeedback({ type: 'success', message: 'Familiar agregado' });
      setShowForm(false);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error al crear familiar' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (f) => {
    // No tenemos endpoint para eliminar todavía
    alert('Eliminar aún no implementado (requiere endpoint).');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2"><UsersRound className="w-6 h-6" /> Familiares / Inquilinos</h1>
        <button onClick={openCreate} disabled={!propietarioId} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar</button>
      </div>

      {!propietarioId && (
        <div className="alert-warning text-sm">No se encontró id de propietario en el usuario. Ajustar extracción de propietarioId.</div>
      )}

      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-success' : 'alert-error'}>
          {feedback.message}
        </div>
      )}

      <div className="table-container">
        <table className="table-primary text-sm">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-center"><Loader2 className="w-5 h-5 inline animate-spin mr-2" />Cargando...</td></tr>
            ) : familiares.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-white/60">No hay familiares registrados.</td></tr>
            ) : (
              familiares.map(f => (
                <tr key={f.id || f.email}>
                  <td className="font-medium">{f.nombre || f.name || '—'}</td>
                  <td>{f.email || '—'}</td>
                  <td>{f.telefono || f.phone || '—'}</td>
                  <td className="flex items-center justify-end gap-2">
                    <button onClick={() => handleDelete(f)} className="btn-icon" title="Eliminar"><Trash2 className="w-4 h-4 text-red-300" /></button>
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
            <button onClick={() => setShowForm(false)} className="btn-icon absolute top-3 right-3"><X className="w-5 h-5" /></button>
            <h2 className="text-white text-lg font-semibold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5" /> Nuevo Familiar / Inquilino</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Nombre</label>
                <input name="nombre" value={formData.nombre} onChange={handleChange} required className="input-primary" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-primary" placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Teléfono</label>
                <input name="telefono" value={formData.telefono} onChange={handleChange} className="input-primary" placeholder="77777777" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={creating || !propietarioId} className="btn-primary flex items-center gap-2">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </form>
            <p className="text-[11px] text-white/50 mt-4">TODO: Confirmar nombres exactos de campos requeridos por el backend.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamiliarList;
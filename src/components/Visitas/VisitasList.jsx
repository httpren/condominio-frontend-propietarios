import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { IdCard, Plus, Loader2, Trash2, Edit2, X } from 'lucide-react';
import useVisitas from '../../hooks/useVisitas';

// Campos inferidos: nombre_visitante, documento, fecha_visita, hora (si aplica). Usaremos datetime local en un solo input.
const initialForm = { nombre_visitante: '', documento_visitante: '', fecha: '' };

const VisitasList = () => {
  const { visitas, loading, error, createVisita, updateVisita, deleteVisita } = useVisitas();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [qrModal, setQrModal] = useState({ open: false, code: '' });

  const resetForm = () => { setFormData(initialForm); setEditingId(null); };
  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (v) => {
    setFormData({
      nombre_visitante: v.nombre_visitante || v.nombre || '',
      documento_visitante: v.documento_visitante || '',
      fecha: v.fecha || v.fecha_visita || ''
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const handleChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };

  const validate = () => {
    if (!formData.fecha) return 'Fecha requerida';
    const d = new Date(formData.fecha);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    const now = new Date();
    if (d < now) return 'La fecha debe ser futura';
    if (!formData.nombre_visitante) return 'Nombre requerido';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valErr = validate();
    if (valErr) { setFeedback({ type: 'error', message: valErr }); return; }
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
      const base = editingId ? 'Visita actualizada' : 'Visita registrada';
      const message = result.offlinePending ? `${base} (pendiente de sincronizar)` : base;
      setFeedback({ type: 'success', message });
      setShowForm(false);
      resetForm();
      // Si se creó online y hay qr_code, mostrar modal con QR
      if (!editingId && !result.offlinePending && result.data?.qr_code) {
        setQrModal({ open: true, code: result.data.qr_code });
      }
    } else {
      setFeedback({ type: 'error', message: result.error || 'Error' });
    }
    setSubmitting(false);
  };

  const handleDelete = async (v) => {
    if (!window.confirm('¿Cancelar / eliminar esta visita?')) return;
    const r = await deleteVisita(v.id);
    if (!r.success) setFeedback({ type: 'error', message: r.error });
  };

  const isFutura = (fechaStr) => {
    const d = new Date(fechaStr);
    return d > new Date();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2"><IdCard className="w-6 h-6" /> Visitas</h1>
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
              <th>Documento</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-white/70"><Loader2 className="w-5 h-5 inline animate-spin mr-2" />Cargando...</td></tr>
            ) : visitas.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-white/60">No hay visitas registradas.</td></tr>
            ) : (
              visitas.map(v => {
                const fecha = v.fecha || v.fecha_visita || '—';
                const futura = fecha !== '—' && isFutura(fecha);
                return (
                  <tr key={v.id}>
                    <td className="font-medium">{v.nombre_visitante || v.nombre || '—'}</td>
                    <td>{v.documento_visitante || '—'}</td>
                    <td>{fecha}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${futura ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-500/20 text-slate-300'}`}>
                        {futura ? 'Programada' : 'Pasada'}
                      </span>
                    </td>
                    <td className="flex items-center gap-2 justify-end">
                      {v.qr_code && (
                        <button onClick={() => setQrModal({ open: true, code: v.qr_code })} className="btn-icon" title="Ver QR">
                          <IdCard className="w-4 h-4" />
                        </button>
                      )}
                      {futura && (
                        <button onClick={() => openEdit(v)} className="btn-icon" title="Editar"><Edit2 className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => handleDelete(v)} className="btn-icon" title="Eliminar"><Trash2 className="w-4 h-4 text-red-300" /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md w-full animate-bounce-in relative">
            <button onClick={() => { setShowForm(false); resetForm(); }} className="btn-icon absolute top-3 right-3"><X className="w-5 h-5" /></button>
            <h2 className="text-white text-lg font-semibold mb-4">{editingId ? 'Editar Visita' : 'Nueva Visita'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Nombre Visitante</label>
                <input name="nombre_visitante" value={formData.nombre_visitante} onChange={handleChange} required className="input-primary" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Documento</label>
                <input name="documento_visitante" value={formData.documento_visitante} onChange={handleChange} className="input-primary" placeholder="Documento / ID" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Fecha y Hora</label>
                <input type="datetime-local" name="fecha" value={formData.fecha} onChange={handleChange} required className="input-primary" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Guardar' : 'Registrar'}
                </button>
              </div>
            </form>
            <p className="text-[11px] text-white/50 mt-4">TODO: Confirmar nombres exactos de campos backend (fecha / fecha_visita / hora).</p>
          </div>
        </div>
      )}

      {qrModal.open && (
        <div className="modal-overlay">
          <div className="modal-container max-w-sm w-full animate-bounce-in relative">
            <button onClick={() => setQrModal({ open: false, code: '' })} className="btn-icon absolute top-3 right-3"><X className="w-5 h-5" /></button>
            <h2 className="text-white text-lg font-semibold mb-4">Código QR de la visita</h2>
            <div className="bg-white p-4 rounded flex items-center justify-center">
              <QRCode value={qrModal.code || ''} size={192} />
            </div>
            <div className="mt-3 text-xs text-white/70 break-all select-all">{qrModal.code}</div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(qrModal.code);
                    setFeedback({ type: 'success', message: 'Código copiado' });
                  } catch {}
                }}
              >Copiar texto</button>
              <a
                className="btn-primary"
                href={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrModal.code)}`}
                target="_blank"
                rel="noreferrer"
              >Abrir PNG</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitasList;
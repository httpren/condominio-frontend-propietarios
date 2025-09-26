import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Check, Bell } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';

/**
 * Página de detalle de un comunicado para lectura completa.
 * No altera la página principal de comunicados.
 */
export default function ComunicadoDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marcando, setMarcando] = useState(false);
  const [marcadoOk, setMarcadoOk] = useState(false);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const { data } = await axiosInstance.get(`/comunicados/${id}/`);
        if (alive) setData(data);
      } catch (e) {
        if (alive) setError(e.response?.data?.detail || 'No se pudo cargar el comunicado');
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [id]);

  const marcarLeido = async () => {
    if (!data || data.leido || marcando) return;
    setMarcando(true);
    try {
      await axiosInstance.post(`/comunicados/${data.id}/marcar_leido/`);
      setData(d => ({ ...d, leido: true }));
      setMarcadoOk(true);
      // Disparar evento global para que otros componentes (campana) refresquen
      window.dispatchEvent(new CustomEvent('comunicados:update', { detail: { type: 'marcar_leido', id: data.id } }));
    } catch (_) { /* ignore */ }
    finally { setMarcando(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Detalle de Comunicado"
        description="Lectura completa"
        icon={Bell}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)} icon={ArrowLeft}>Volver</Button>
        }
      />

      {loading && (
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando comunicado...
        </div>
      )}

      {error && (
        <div className="alert-error">{error}</div>
      )}

      {!loading && !error && data && (
        <div className="card-minimal space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-white leading-snug">{data.titulo}</h2>
            <div className="text-xs text-white/50 flex flex-wrap gap-3">
              <span>{data.tipo || 'general'}</span>
              <span>
                Enviado: {data.fecha_envio ? new Date(data.fecha_envio).toLocaleString('es-ES', { dateStyle:'short', timeStyle:'short' }) : '—'}
              </span>
              {data.leido && <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="w-3 h-3" /> Leído</span>}
            </div>
          </div>

          <div className="prose prose-invert max-w-none leading-relaxed text-sm text-white/90 whitespace-pre-wrap">
            {data.mensaje || '(Sin contenido)'}
          </div>

          {data.adjuntos?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Adjuntos</p>
              <ul className="space-y-1 text-sm">
                {data.adjuntos.map((a, idx) => (
                  <li key={idx}>
                    <a href={a.url || a} target="_blank" rel="noreferrer" className="text-red-300 hover:text-red-200 underline">
                      {a.nombre || a.url || a}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {!data.leido && (
              <Button onClick={marcarLeido} disabled={marcando}>
                {marcando ? 'Marcando...' : 'Marcar como leído'}
              </Button>
            )}
            <Link to="/comunicados" className="text-xs text-white/50 hover:text-white underline self-center">Ver listado</Link>
            {marcadoOk && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Guardado</span>}
          </div>
        </div>
      )}
    </div>
  );
}
